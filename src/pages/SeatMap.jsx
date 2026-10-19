import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import BreadcrumbBar from '../components/seat-map/BreadcrumbBar'
import ProjectionArc from '../components/seat-map/ProjectionArc'
import SeatLegend from '../components/seat-map/SeatLegend'
import SeatGrid from '../components/seat-map/SeatGrid'
import TicketSidebar from '../components/seat-map/TicketSidebar'
import { MOVIES } from '../data/mockData'
import { supabase } from '../supabaseClient'
import { sendTicketConfirmationEmail } from '../lib/otp'

// Initial seed generator for 40 standard seats (A-D) + 8 VIP seats (E)
function generateAuditoriumSeats(basePrice) {
  const seats = []
  const rows = ['A', 'B', 'C', 'D', 'E']

  rows.forEach((row) => {
    const isVip = row === 'E'
    const count = isVip ? 8 : 10
    const price = isVip ? basePrice + 70 : basePrice

    for (let i = 1; i <= count; i++) {
      const seatId = `${row}${i}`
      seats.push({
        id: seatId,
        row,
        number: i,
        isVip,
        price,
        status: 'available',
      })
    }
  })

  return seats
}

export default function SeatMap() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Find the movie and screening
  const { movie, screening } = useMemo(() => {
    for (const m of MOVIES) {
      const s = m.screenings.find((sc) => sc.id === id)
      if (s) {
        return { movie: m, screening: s }
      }
    }
    // Fallback if not found
    return { movie: MOVIES[0], screening: MOVIES[0].screenings[0] }
  }, [id])

  const [seats, setSeats] = useState(() => generateAuditoriumSeats(screening.price))
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [warningMessage, setWarningMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const channelRef = useRef(null)

  // Get current auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load existing holds and reservations from Supabase database
  useEffect(() => {
    let isMounted = true

    async function fetchSeatStatuses() {
      try {
        // 1. Fetch active seat holds
        const { data: holds } = await supabase
          .from('seat_holds')
          .select('seat_id, user_id, held_until')
          .eq('showtime_id', id)
          .gt('held_until', new Date().toISOString())

        // 2. Fetch permanently reserved seats
        const { data: reserved } = await supabase
          .from('reservation_seats')
          .select('seat_id')
          .eq('showtime_id', id)
          .eq('status', 'reserved')

        if (!isMounted) return

        const reservedSet = new Set((reserved || []).map((r) => r.seat_id))
        const heldMap = new Map((holds || []).map((h) => [h.seat_id, h.user_id]))

        setSeats((prev) =>
          prev.map((seat) => {
            if (reservedSet.has(seat.id)) {
              return { ...seat, status: 'reserved' }
            }
            if (heldMap.has(seat.id)) {
              const holderId = heldMap.get(seat.id)
              // If held by current user, restore selection
              if (currentUser && holderId === currentUser.id) {
                return { ...seat, status: 'available' }
              }
              return { ...seat, status: 'held', heldBy: holderId }
            }
            return seat
          })
        )
      } catch (err) {
        console.warn('Seat status query warning (using local sync):', err)
      }
    }

    fetchSeatStatuses()

    return () => {
      isMounted = false
    }
  }, [id, currentUser])

  // Supabase Realtime Broadcast Channel for Live Multi-User Synchronization
  useEffect(() => {
    const channel = supabase.channel(`screening:${id}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'seat_held' }, ({ payload }) => {
        // Another user picked a seat
        setSeats((prev) =>
          prev.map((s) =>
            s.id === payload.seatId
              ? { ...s, status: 'held', heldBy: payload.userId }
              : s
          )
        )
      })
      .on('broadcast', { event: 'seat_released' }, ({ payload }) => {
        // Another user released their seat
        setSeats((prev) =>
          prev.map((s) =>
            s.id === payload.seatId ? { ...s, status: 'available', heldBy: null } : s
          )
        )
      })
      .on('broadcast', { event: 'seats_reserved' }, ({ payload }) => {
        // Another user completed checkout
        const setOfReserved = new Set(payload.seatIds || [])
        setSeats((prev) =>
          prev.map((s) =>
            setOfReserved.has(s.id) ? { ...s, status: 'reserved', heldBy: null } : s
          )
        )
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      // Release held seats on unmount if not checked out
      selectedSeatIds.forEach((seatId) => {
        channel.send({
          type: 'broadcast',
          event: 'seat_released',
          payload: { seatId },
        })
      })
      supabase.removeChannel(channel)
    }
  }, [id, selectedSeatIds])

  // Clear warning after 4 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [warningMessage])

  // Get seat objects for selected IDs
  const selectedSeats = useMemo(() => {
    return seats.filter((s) => selectedSeatIds.includes(s.id))
  }, [seats, selectedSeatIds])

  const handleToggleSeat = async (seat) => {
    setWarningMessage('')

    // Cannot pick seat if reserved or held by another user
    if (seat.status === 'reserved') {
      setWarningMessage(`Seat ${seat.id} is already reserved and sold out.`)
      return
    }

    if (seat.status === 'held' && !selectedSeatIds.includes(seat.id)) {
      setWarningMessage(
        `Seat ${seat.id} is currently held by another patron. Please select another seat.`
      )
      return
    }

    if (selectedSeatIds.includes(seat.id)) {
      // Unselect: Release seat
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id))

      // Broadcast to other users that this seat is now free
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'seat_released',
          payload: { seatId: seat.id },
        })
      }

      // Remove hold in Supabase database
      if (currentUser) {
        supabase
          .from('seat_holds')
          .delete()
          .match({ showtime_id: id, seat_id: seat.id, user_id: currentUser.id })
          .catch((e) => console.warn('Hold removal error:', e))
      }
    } else {
      // 6-seat cap rule
      if (selectedSeatIds.length >= 6) {
        setWarningMessage('Maximum of 6 seats allowed per reservation.')
        return
      }

      // Pick seat
      setSelectedSeatIds((prev) => [...prev, seat.id])

      // Broadcast to all other users immediately: this seat is now HELD
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'seat_held',
          payload: { seatId: seat.id, userId: currentUser?.id || 'guest' },
        })
      }

      // Persist hold in Supabase database (10 minute hold)
      if (currentUser) {
        supabase
          .from('seat_holds')
          .upsert({
            showtime_id: id,
            seat_id: seat.id,
            user_id: currentUser.id,
            held_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          })
          .catch((e) => console.warn('Hold insert warning:', e))
      }
    }
  }

  const handleRemoveSeat = async (seatId) => {
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId))

    // Broadcast release
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'seat_released',
        payload: { seatId },
      })
    }

    if (currentUser) {
      supabase
        .from('seat_holds')
        .delete()
        .match({ showtime_id: id, seat_id: seatId, user_id: currentUser.id })
        .catch((e) => console.warn('Hold removal error:', e))
    }
  }

  const handleConfirmReservation = async (formData) => {
    setIsSubmitting(true)

    // Generate reference code format: MS-2026-XXXXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let rand = ''
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const reference = `MS-2026-${rand}`

    const reservationRecord = {
      reference,
      movieTitle: movie.title,
      moviePoster: movie.poster,
      movieFormat: movie.format,
      auditoriumName: screening.auditoriumName,
      showtime: screening.time,
      seats: formData.seats.map((s) => s.id),
      total: formData.total,
      subtotal: formData.subtotal,
      patronName: formData.name,
      patronEmail: formData.email,
      createdAt: new Date().toISOString(),
      status: 'Active',
    }

    try {
      // 1. Insert into Supabase reservations table
      const { data: resData } = await supabase
        .from('reservations')
        .insert({
          reference_code: reference,
          user_id: formData.userId || currentUser?.id,
          showtime_id: id,
          patron_name: formData.name,
          patron_email: formData.email,
          total_amount: formData.total,
          status: 'Active',
        })
        .select()
        .single()

      // 2. Insert into reservation_seats table to lock them permanently
      const seatRows = formData.seats.map((s) => ({
        reservation_id: resData?.id,
        showtime_id: id,
        seat_id: s.id,
        status: 'reserved',
      }))

      await supabase.from('reservation_seats').insert(seatRows)

      // 3. Clear temporary holds
      if (currentUser) {
        await supabase
          .from('seat_holds')
          .delete()
          .match({ showtime_id: id, user_id: currentUser.id })
      }

      // 4. Broadcast permanent lock across all connected users
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'seats_reserved',
          payload: { seatIds: formData.seats.map((s) => s.id) },
        })
      }

      // 5. Send digital ticket & reference via EmailJS
      sendTicketConfirmationEmail(reservationRecord).catch((e) =>
        console.warn('Ticket email confirmation error:', e)
      )
    } catch (e) {
      console.warn('Supabase DB persistence warning:', e)
    }

    // Persist to local sessionStorage and localStorage for multi-tab and permanent lookup
    try {
      const recordStr = JSON.stringify(reservationRecord)
      sessionStorage.setItem(`reservation_${reference}`, recordStr)
      sessionStorage.setItem('latest_reservation', recordStr)
      localStorage.setItem(`reservation_${reference}`, recordStr)
      localStorage.setItem('latest_reservation', recordStr)
      if (currentUser?.id) {
        localStorage.setItem(`latest_reservation_${currentUser.id}`, recordStr)
      }

      // Add to global reservations registry
      const all = JSON.parse(localStorage.getItem('movieseat_reservations') || '{}')
      all[reference] = reservationRecord
      localStorage.setItem('movieseat_reservations', JSON.stringify(all))
    } catch (e) {
      console.warn('Storage error:', e)
    }

    setTimeout(() => {
      setIsSubmitting(false)
      navigate(`/ticket/${reference}`, { state: { reservation: reservationRecord } })
    }, 600)
  }

  return (
    <div className="relative flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[700px] h-[400px] rounded-full bg-white opacity-[0.03] blur-[150px]" />
      </div>

      {/* Top Header & Breadcrumb Bar */}
      <div className="relative mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <BreadcrumbBar
          movieTitle={movie.title}
          auditoriumName={screening.auditoriumName}
          showtime={screening.time}
        />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors shrink-0"
        >
          <span>← Back to Now Showing</span>
        </Link>
      </div>

      {/* Advisory Banner */}
      <div className="relative mb-6 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/15 flex items-center justify-between gap-3 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong className="text-white">Realtime Seating:</strong> Seats you pick are held live for 10 minutes and locked for other patrons.
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
          Live Synced
        </span>
      </div>

      {/* Warning Alert Banner (if limit reached or held by others) */}
      {warningMessage && (
        <div className="relative mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">{warningMessage}</span>
        </div>
      )}

      {/* Main Two-Column Layout (Desktop: map left, sidebar right; Mobile: stacked) */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Screen Arc, Seat Grid, and Legend */}
        <div className="lg:col-span-8 flex flex-col bg-[#15161B]/60 rounded-2xl border border-white/[0.06] p-4 sm:p-8 shadow-xl">
          {/* Curved Projection Screen Arc */}
          <ProjectionArc format={movie.format} />

          {/* Seat Grid */}
          <SeatGrid
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            basePrice={screening.price}
          />

          {/* Seat Legend */}
          <div className="mt-8 pt-4 border-t border-white/[0.06]">
            <SeatLegend />
          </div>
        </div>

        {/* Right Column: Checkout Summary Sidebar */}
        <div className="lg:col-span-4">
          <TicketSidebar
            movie={movie}
            screening={screening}
            selectedSeats={selectedSeats}
            onRemoveSeat={handleRemoveSeat}
            onConfirm={handleConfirmReservation}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}
