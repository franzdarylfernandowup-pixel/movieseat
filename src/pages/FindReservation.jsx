import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SearchCard from '../components/find-reservation/SearchCard'
import ReservationCard from '../components/find-reservation/ReservationCard'
import CancelReservationModal from '../components/find-reservation/CancelReservationModal'
import { supabase } from '../supabaseClient'
import { MOVIES } from '../data/mockData'

/**
 * Searches local web storage (both sessionStorage and localStorage)
 * for a reservation by reference code variations.
 */
function searchLocalStorages(rawCode) {
  const clean = rawCode.trim().toUpperCase()
  const variations = [
    clean,
    clean.startsWith('MS-2026-') ? clean : `MS-2026-${clean}`,
    clean.replace(/^MS-2026-/, ''),
    clean.replace(/[^A-Z0-9]/g, ''),
  ]

  // 1. Direct keys in sessionStorage and localStorage
  for (const v of variations) {
    const fromSession = sessionStorage.getItem(`reservation_${v}`)
    if (fromSession) {
      try { return JSON.parse(fromSession) } catch {}
    }
    const fromLocal = localStorage.getItem(`reservation_${v}`)
    if (fromLocal) {
      try { return JSON.parse(fromLocal) } catch {}
    }
  }

  // 2. Check movieseat_reservations dictionary
  try {
    const all = JSON.parse(localStorage.getItem('movieseat_reservations') || '{}')
    for (const [key, record] of Object.entries(all)) {
      const keyNorm = key.toUpperCase()
      for (const v of variations) {
        if (keyNorm === v || keyNorm.includes(v) || (record.reference && record.reference.toUpperCase().includes(v))) {
          return record
        }
      }
    }
  } catch {}

  // 3. Scan all keys in storage
  const stores = [sessionStorage, localStorage]
  for (const store of stores) {
    try {
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i)
        if (k && (k.startsWith('reservation_') || k.startsWith('latest_reservation'))) {
          const item = store.getItem(k)
          if (item) {
            const parsed = JSON.parse(item)
            if (parsed?.reference) {
              const refUpper = parsed.reference.toUpperCase()
              for (const v of variations) {
                if (refUpper === v || refUpper.endsWith(v) || refUpper.replace(/[^A-Z0-9]/g, '').includes(v)) {
                  return parsed
                }
              }
            }
          }
        }
      }
    } catch {}
  }

  return null
}

export default function FindReservation() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [latestReservation, setLatestReservation] = useState(null)
  const [searchResult, setSearchResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cancelModalReservation, setCancelModalReservation] = useState(null)
  const [notification, setNotification] = useState('')

  // Load user auth session and user's true latest reservation
  useEffect(() => {
    let isMounted = true

    async function initUserReservations() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user || null
        if (!isMounted) return
        setCurrentUser(user)
        setAuthLoaded(true)

        if (user) {
          // If logged in: fetch latest reservation from Supabase for this user
          try {
            const { data: dbRows, error: dbErr } = await supabase
              .from('reservations')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)

            if (!dbErr && dbRows && dbRows.length > 0) {
              const r = dbRows[0]
              // Fetch seats
              const { data: seatsData } = await supabase
                .from('reservation_seats')
                .select('seat_id')
                .eq('reservation_id', r.id)

              const seats = (seatsData || []).map((s) => s.seat_id)
              const matchedMovie = MOVIES.find((m) => m.screenings.some((s) => s.id === r.showtime_id)) || MOVIES[0]
              const matchedScreening = matchedMovie.screenings.find((s) => s.id === r.showtime_id) || matchedMovie.screenings[0]

              const record = {
                reference: r.reference_code,
                movieTitle: matchedMovie.title,
                moviePoster: matchedMovie.poster,
                movieFormat: matchedMovie.format,
                auditoriumName: matchedScreening.auditoriumName,
                showtime: matchedScreening.time,
                seats: seats.length > 0 ? seats : ['A1'],
                total: r.total_amount,
                subtotal: r.total_amount,
                patronName: r.patron_name,
                patronEmail: r.patron_email,
                createdAt: r.created_at,
                status: r.status || 'Active',
                showtimeId: r.showtime_id,
              }

              if (isMounted) {
                setLatestReservation(record)
                return
              }
            }
          } catch (e) {
            console.warn('Supabase latest fetch error:', e)
          }

          // Fallback to user-specific localStorage if offline
          const userLocal = localStorage.getItem(`latest_reservation_${user.id}`)
          if (userLocal && isMounted) {
            try {
              setLatestReservation(JSON.parse(userLocal))
              return
            } catch {}
          }
        }

        // If NOT logged in:
        // Do NOT show default fake mock reservation.
        // Only show if the user actually booked something in this browser session.
        const sessionLatest = sessionStorage.getItem('latest_reservation') || localStorage.getItem('latest_reservation')
        if (sessionLatest && isMounted) {
          try {
            const parsed = JSON.parse(sessionLatest)
            if (parsed && parsed.reference && parsed.reference !== 'MS-2026-X8R49K') {
              setLatestReservation(parsed)
              return
            }
          } catch {}
        }

        // Otherwise no reservation to show initially
        if (isMounted) {
          setLatestReservation(null)
        }
      } catch (err) {
        console.warn('FindReservation init error:', err)
        if (isMounted) setAuthLoaded(true)
      }
    }

    initUserReservations()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSearch = async (code) => {
    setIsLoading(true)
    setError('')
    setSearchResult(null)

    const raw = code.trim()
    const normalized = raw.toUpperCase()
    const searchKey = normalized.startsWith('MS-2026-') ? normalized : `MS-2026-${normalized}`
    const suffixKey = normalized.replace(/^MS-2026-/, '')

    // 1. Search local storage first (instant response)
    const localMatch = searchLocalStorages(raw)
    if (localMatch) {
      setTimeout(() => {
        setIsLoading(false)
        setSearchResult(localMatch)
      }, 200)
      return
    }

    // 2. Check current latest reservation if already in memory
    if (latestReservation) {
      const ref = (latestReservation.reference || '').toUpperCase()
      if (ref === normalized || ref === searchKey || ref.endsWith(suffixKey)) {
        setTimeout(() => {
          setIsLoading(false)
          setSearchResult(latestReservation)
        }, 200)
        return
      }
    }

    // 3. Query Supabase Database for the reference code
    try {
      const { data: dbRows, error: dbErr } = await supabase
        .from('reservations')
        .select('*')
        .or(`reference_code.eq.${searchKey},reference_code.eq.${normalized},reference_code.ilike.%${suffixKey}%`)
        .limit(1)

      if (!dbErr && dbRows && dbRows.length > 0) {
        const r = dbRows[0]

        // Fetch seat allocation
        const { data: seatsData } = await supabase
          .from('reservation_seats')
          .select('seat_id')
          .eq('reservation_id', r.id)

        const seats = (seatsData || []).map((s) => s.seat_id)
        const matchedMovie = MOVIES.find((m) => m.screenings.some((s) => s.id === r.showtime_id)) || MOVIES[0]
        const matchedScreening = matchedMovie.screenings.find((s) => s.id === r.showtime_id) || matchedMovie.screenings[0]

        const foundRecord = {
          reference: r.reference_code,
          movieTitle: matchedMovie.title,
          moviePoster: matchedMovie.poster,
          movieFormat: matchedMovie.format,
          auditoriumName: matchedScreening.auditoriumName,
          showtime: matchedScreening.time,
          seats: seats.length > 0 ? seats : ['A1'],
          total: r.total_amount,
          subtotal: r.total_amount,
          patronName: r.patron_name,
          patronEmail: r.patron_email,
          createdAt: r.created_at,
          status: r.status || 'Active',
          showtimeId: r.showtime_id,
        }

        // Cache in local storage for instant future lookups
        try {
          const serialized = JSON.stringify(foundRecord)
          sessionStorage.setItem(`reservation_${foundRecord.reference}`, serialized)
          localStorage.setItem(`reservation_${foundRecord.reference}`, serialized)
          const all = JSON.parse(localStorage.getItem('movieseat_reservations') || '{}')
          all[foundRecord.reference] = foundRecord
          localStorage.setItem('movieseat_reservations', JSON.stringify(all))
        } catch {}

        setIsLoading(false)
        setSearchResult(foundRecord)
        return
      }
    } catch (e) {
      console.warn('Supabase reservation search warning:', e)
    }

    // 4. Not found anywhere
    setIsLoading(false)
    setError(`No reservation found for reference "${raw}". Please check the code and try again.`)
  }

  const handleConfirmCancel = async (res) => {
    const updated = { ...res, status: 'Cancelled' }

    // 1. Update in Supabase
    try {
      await supabase
        .from('reservations')
        .update({ status: 'Cancelled' })
        .eq('reference_code', res.reference)

      await supabase
        .from('reservation_seats')
        .update({ status: 'cancelled' })
        .match({ showtime_id: res.showtimeId || res.showtime_id })
    } catch (e) {
      console.warn('Supabase cancel sync error:', e)
    }

    // 2. Update in all storages
    try {
      const serialized = JSON.stringify(updated)
      sessionStorage.setItem(`reservation_${res.reference}`, serialized)
      localStorage.setItem(`reservation_${res.reference}`, serialized)
      if (latestReservation && latestReservation.reference === res.reference) {
        sessionStorage.setItem('latest_reservation', serialized)
        localStorage.setItem('latest_reservation', serialized)
      }
      const all = JSON.parse(localStorage.getItem('movieseat_reservations') || '{}')
      all[res.reference] = updated
      localStorage.setItem('movieseat_reservations', JSON.stringify(all))
    } catch (e) {
      console.warn('Storage write error:', e)
    }

    // 3. Update React UI state
    if (latestReservation && latestReservation.reference === res.reference) {
      setLatestReservation(updated)
    }
    if (searchResult && searchResult.reference === res.reference) {
      setSearchResult(updated)
    }

    setNotification(`Reservation ${res.reference} has been successfully cancelled and seats have been released.`)
    setTimeout(() => setNotification(''), 6000)
  }

  return (
    <div className="relative flex-1 flex flex-col items-center px-4 sm:px-6 py-10 max-w-xl mx-auto w-full">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[350px] rounded-full bg-white opacity-[0.03] blur-[150px]" />
      </div>

      {/* Header title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-3 shadow-[0_0_12px_rgba(255,255,255,0.08)]">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          Ticket Verification Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Find Your Reservation
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
          Look up your admission details, seat assignments, and digital passes anytime.
        </p>
      </div>

      {/* Cancellation Success Notification */}
      {notification && (
        <div className="w-full mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{notification}</span>
        </div>
      )}

      {/* Search Input Card */}
      <div className="w-full mb-8">
        <SearchCard onSearch={handleSearch} isLoading={isLoading} error={error} />
      </div>

      {/* Search Result (if searched) */}
      {searchResult && (
        <div className="w-full mb-8 animate-fadeIn">
          <ReservationCard
            reservation={searchResult}
            title="Matching Reservation"
            onCancel={(r) => setCancelModalReservation(r)}
          />
        </div>
      )}

      {/* Authenticated / Verified Latest Reservation */}
      {latestReservation && (!searchResult || searchResult.reference !== latestReservation.reference) && (
        <div className="w-full">
          <ReservationCard
            reservation={latestReservation}
            title="Your Latest Reservation"
            onCancel={(r) => setCancelModalReservation(r)}
          />
        </div>
      )}

      {/* No reservation empty state card when neither searchResult nor latestReservation is active */}
      {!latestReservation && !searchResult && authLoaded && (
        <div className="w-full p-6 sm:p-8 rounded-2xl bg-[#121214] border border-white/[0.08] text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3.5 text-zinc-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            {currentUser ? 'No Active Bookings Found' : 'No Recent Bookings Found'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {currentUser ? (
              'You have no saved bookings right now. Reserve seats for today’s movies on the Now Showing schedule.'
            ) : (
              'You are not currently logged in. Enter your 6-character reference code above, or sign in to access your saved profile bookings.'
            )}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {currentUser ? (
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Browse Now Showing
              </Link>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Sign In to Account
                </Link>
                <Link
                  to="/"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
                >
                  View Schedule
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Reservation Modal */}
      <CancelReservationModal
        isOpen={!!cancelModalReservation}
        reservation={cancelModalReservation}
        onClose={() => setCancelModalReservation(null)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  )
}
