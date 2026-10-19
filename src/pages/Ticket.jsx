import { useMemo } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import TicketCard from '../components/ticket/TicketCard'
import TicketStub from '../components/ticket/TicketStub'
import ActionButtons from '../components/ticket/ActionButtons'
import { MOVIES } from '../data/mockData'

export default function Ticket() {
  const { reference } = useParams()
  const location = useLocation()

  // Resolve reservation from route state, sessionStorage, or fallback demo
  const reservation = useMemo(() => {
    if (location.state?.reservation) {
      return location.state.reservation
    }

    // Try reading from sessionStorage
    try {
      const stored = sessionStorage.getItem(`reservation_${reference}`)
      if (stored) return JSON.parse(stored)

      const latest = sessionStorage.getItem('latest_reservation')
      if (latest) {
        const parsed = JSON.parse(latest)
        if (parsed.reference === reference) return parsed
      }
    } catch (e) {
      console.warn('Storage read failed:', e)
    }

    // Fallback demo ticket
    return {
      reference: reference || 'MS-2026-X8R49K',
      movieTitle: MOVIES[0].title,
      moviePoster: MOVIES[0].poster,
      movieFormat: MOVIES[0].format,
      auditoriumName: 'Cinema 2 · IMAX Laser',
      showtime: '4:45 PM',
      seats: ['D4', 'D5'],
      total: 960,
      subtotal: 960,
      patronName: 'Alex Rivera',
      patronEmail: 'alex.rivera@example.com',
      createdAt: new Date().toISOString(),
      status: 'Active',
    }
  }, [reference, location.state])

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 max-w-3xl mx-auto w-full">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[350px] rounded-full bg-white opacity-[0.03] blur-[150px]" />
      </div>

      {/* Reservation Confirmed Emerald Banner */}
      <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3.5 shadow-lg">
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-sm sm:text-base font-bold text-white">
            Reservation Confirmed!
          </h1>
          <p className="text-xs text-emerald-300/80 mt-0.5">
            Your booking is active! Your admission ticket and reference code have been emailed to <strong className="text-white">{reservation.patronEmail}</strong>.
          </p>
        </div>
      </div>

      {/* Main Ticket Surface (Perforated Card & Stub) */}
      <div className="w-full max-w-2xl bg-[#15161B] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">
        {/* Ticket Main Card */}
        <TicketCard reservation={reservation} />

        {/* Ticket Stub */}
        <TicketStub
          reference={reservation.reference}
          patronName={reservation.patronName}
          seatsCount={reservation.seats?.length || 1}
        />
      </div>

      {/* Actions */}
      <ActionButtons />
    </div>
  )
}
