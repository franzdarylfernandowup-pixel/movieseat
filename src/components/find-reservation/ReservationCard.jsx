import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function ReservationCard({ reservation, title = 'Reservation Details', onCancel }) {
  if (!reservation) return null

  const isActive = reservation.status?.toLowerCase() === 'active'

  return (
    <div className="w-full bg-[#15161B] rounded-2xl border border-white/[0.08] p-6 shadow-xl relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            {title}
          </span>
          <span className="font-mono text-sm sm:text-base font-extrabold text-white tracking-wider">
            {reservation.reference}
          </span>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      {/* Main reservation content */}
      <div className="flex flex-col sm:flex-row gap-4 py-5 items-start">
        {reservation.moviePoster && (
          <img
            src={reservation.moviePoster}
            alt={reservation.movieTitle}
            className="w-20 h-28 rounded-xl object-cover bg-[#0D0E12] border border-white/10 shrink-0 shadow-md"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
            {reservation.movieFormat || 'CINEMA'}
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight truncate mt-0.5">
            {reservation.movieTitle}
          </h3>

          <div className="text-xs text-gray-400 mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Hall:</span>
              <span className="text-gray-300 font-medium">{reservation.auditoriumName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Time:</span>
              <span className="text-white font-bold">{reservation.showtime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Passholder:</span>
              <span className="text-gray-200">{reservation.patronName || 'Guest'}</span>
            </div>
          </div>

          {/* Seat chips */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-500 uppercase font-semibold mr-1">
              Seats:
            </span>
            {(reservation.seats || []).map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-white text-xs font-bold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer & Action */}
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="text-[10px] uppercase text-gray-500 font-semibold block">Total</span>
          <span className="text-white font-extrabold text-base">
            ₱{Number(reservation.total || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isActive && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(reservation)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          )}

          <Link
            to={`/ticket/${reservation.reference}`}
            state={{ reservation }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white hover:text-black text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <span>View Full Ticket</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
