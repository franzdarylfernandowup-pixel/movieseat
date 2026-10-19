export default function SeatGrid({
  seats,
  selectedSeatIds,
  onToggleSeat,
  basePrice,
}) {
  // Group seats by row
  const rows = ['A', 'B', 'C', 'D', 'E']

  return (
    <div className="w-full select-none py-4">
      {/* Mobile Swipe Hint */}
      <div className="flex md:hidden items-center justify-center gap-1.5 text-[11px] text-zinc-300 mb-3 font-medium bg-white/5 py-1.5 px-3 rounded-lg border border-white/10 max-w-xs mx-auto">
        <svg className="w-3.5 h-3.5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>Swipe to view all seats</span>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar pb-2">
        <div className="min-w-[540px] sm:min-w-[580px] max-w-xl mx-auto flex flex-col gap-3 sm:gap-3.5">
        {rows.map((rowLetter) => {
          const rowSeats = seats.filter((s) => s.row === rowLetter)
          const isVipRow = rowLetter === 'E'

          return (
            <div key={rowLetter} className="flex items-center justify-between gap-3">
              {/* Row letter label left */}
              <span className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-gray-500 shrink-0">
                {rowLetter}
              </span>

              {/* Seats container */}
              <div className="flex-1 flex items-center justify-center gap-1 min-[380px]:gap-1.5 sm:gap-2.5">
                {rowSeats.map((seat, index) => {
                  const isSelected = selectedSeatIds.includes(seat.id)
                  const isSold = seat.status === 'reserved'
                  const isHeld = seat.status === 'held'
                  const isAvailable = seat.status === 'available'

                  // Insert aisle gaps after seat 2 and seat 8 (for standard rows)
                  // and after seat 2 and seat 6 (for VIP row)
                  const hasAisleAfter = isVipRow
                    ? index === 1 || index === 5
                    : index === 1 || index === 7

                  // Seat base styling
                  let seatClasses =
                    'relative transition-all duration-200 flex items-center justify-center font-bold text-[9px] sm:text-[10px] rounded-md sm:rounded-lg shrink-0 cursor-pointer '

                  if (isVipRow) {
                    // Wider recliner shape
                    seatClasses += 'w-8 min-[380px]:w-9 sm:w-11 h-7 min-[380px]:h-8 sm:h-10 border-2 '
                  } else {
                    seatClasses += 'w-6 min-[380px]:w-7 sm:w-9 h-6 min-[380px]:h-7 sm:h-9 border '
                  }

                  if (isSelected) {
                    seatClasses +=
                      'bg-white text-black font-extrabold border-white shadow-[0_0_14px_rgba(255,255,255,0.7)] scale-105 z-10'
                  } else if (isHeld) {
                    seatClasses +=
                      'bg-zinc-800 text-zinc-400 border-zinc-600 cursor-not-allowed opacity-60'
                  } else if (isSold) {
                    seatClasses +=
                      'bg-[#0d0d10] text-zinc-700 border-white/[0.04] cursor-not-allowed opacity-40 line-through'
                  } else {
                    // Available
                    if (isVipRow) {
                      seatClasses +=
                        'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-200 border-zinc-500 hover:border-white hover:text-white hover:bg-zinc-700 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                    } else {
                      seatClasses +=
                        'bg-[#18181B] text-zinc-400 border-zinc-700 hover:border-white hover:text-white hover:bg-zinc-800'
                    }
                  }

                  return (
                    <div key={seat.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => onToggleSeat(seat)}
                        disabled={isSold || isHeld}
                        title={
                          isSold
                            ? `Seat ${seat.id} (Reserved)`
                            : isHeld
                            ? `Seat ${seat.id} (Temporarily held)`
                            : `Seat ${seat.id} · ₱${seat.price || basePrice}${isVipRow ? ' (VIP Recliner)' : ''}`
                        }
                        className={seatClasses}
                      >
                        {/* Seat label */}
                        <span>{seat.number}</span>

                        {/* VIP Recliner mini badge */}
                        {isVipRow && !isSelected && (
                          <span className="absolute -top-1 right-0 text-[6px] sm:text-[7px] text-zinc-300 font-semibold uppercase">
                            VIP
                          </span>
                        )}
                      </button>

                      {/* Aisle space */}
                      {hasAisleAfter && (
                        <div className="w-2 min-[380px]:w-3 sm:w-6 pointer-events-none" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Row letter label right */}
              <span className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-gray-500 shrink-0">
                {rowLetter}
              </span>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
