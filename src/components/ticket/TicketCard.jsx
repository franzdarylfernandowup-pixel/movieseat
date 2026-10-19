export default function TicketCard({ reservation }) {
  const seats = reservation.seats || []

  return (
    <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
      <div className="flex flex-row gap-4 sm:gap-5 items-start">
        {/* Movie Poster */}
        <div className="relative w-24 sm:w-32 h-36 sm:h-44 rounded-xl overflow-hidden bg-[#0D0E12] border border-white/10 shrink-0 shadow-lg">
          <img
            src={reservation.moviePoster}
            alt={reservation.movieTitle}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-bold text-white border border-white/30 uppercase">
            {reservation.movieFormat || 'STANDARD'}
          </div>
        </div>

        {/* Details Column */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
            Cinema City Hall · {reservation.auditoriumName}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 truncate">
            {reservation.movieTitle}
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Date</span>
              <span className="text-gray-200 font-medium">
                {new Date(reservation.createdAt || Date.now()).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Showtime</span>
              <span className="text-white font-bold text-sm">
                {reservation.showtime}
              </span>
            </div>
          </div>

          {/* Reserved Seats List */}
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1.5">
              Reserved Seats
            </span>
            <div className="flex flex-wrap gap-1.5">
              {seats.map((seatId) => (
                <span
                  key={seatId}
                  className="px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-white font-bold text-xs shadow-sm"
                >
                  Seat {seatId}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Footer details */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-500 block text-[10px] uppercase font-semibold">Total Paid</span>
          <span className="text-white font-extrabold text-base">
            ₱{Number(reservation.total || 0).toLocaleString()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-gray-500 block text-[10px] uppercase font-semibold">Status</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Confirmed & Active
          </span>
        </div>
      </div>
    </div>
  )
}
