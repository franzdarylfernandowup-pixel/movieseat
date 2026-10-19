import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ShowtimePill from './ShowtimePill'

export default function MovieCard({ movie, activeAuditorium }) {
  const navigate = useNavigate()

  // Filter screenings if auditorium filter is set to a specific hall
  const filteredScreenings = useMemo(() => {
    if (!activeAuditorium || activeAuditorium === 'all') {
      return movie.screenings
    }
    return movie.screenings.filter((s) => s.auditoriumId === activeAuditorium)
  }, [movie.screenings, activeAuditorium])

  // Default selected screening to the first available one in the filtered list
  const firstAvailable = filteredScreenings.find((s) => !s.soldOut && s.seatsLeft > 0)
  const [selectedScreeningId, setSelectedScreeningId] = useState(firstAvailable?.id || null)

  // Update selected if filter changes and current selection is no longer valid
  const currentSelection = useMemo(() => {
    const found = filteredScreenings.find((s) => s.id === selectedScreeningId && !s.soldOut)
    return found || firstAvailable || null
  }, [filteredScreenings, selectedScreeningId, firstAvailable])

  const allSoldOut = filteredScreenings.length > 0 && filteredScreenings.every((s) => s.soldOut || s.seatsLeft <= 0)

  const handleBooking = () => {
    if (currentSelection) {
      navigate(`/screenings/${currentSelection.id}`)
    }
  }

  return (
    <div className="group relative flex flex-col bg-[#15161B] rounded-2xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {/* Top Media & Header Section */}
      <div className="flex flex-row gap-3.5 sm:gap-5 p-4 sm:p-5 pb-3 sm:pb-4 items-start">
        {/* Poster Image */}
        <div className="relative w-24 sm:w-36 h-36 sm:h-52 rounded-xl overflow-hidden shrink-0 bg-[#0D0E12] border border-white/[0.06] shadow-md">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Rating Badge top-left */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-bold text-gray-200">
            {movie.rating}
          </div>

          {/* Format Badge bottom-left */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 px-2 py-1 rounded bg-white text-[10px] font-extrabold text-black uppercase tracking-wider text-center truncate shadow-sm">
            {movie.format}
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Genre & Runtime */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span>{movie.genre}</span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {movie.runtime}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white tracking-tight mt-1 group-hover:text-zinc-200 transition-colors">
              {movie.title}
            </h3>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-gray-400 line-clamp-3 leading-relaxed mt-2.5">
              {movie.synopsis}
            </p>
          </div>

          {/* Screening selection notice */}
          {currentSelection && (
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5 font-medium text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {currentSelection.auditoriumName}
              </span>
              <span className="text-white font-semibold">
                {currentSelection.seatsLeft} seats available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Showtimes Row */}
      <div className="px-5 py-3 bg-[#0D0E12]/60 border-t border-white/[0.05]">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center justify-between">
          <span>Today's Showtimes</span>
          <span className="text-[10px] text-gray-500 normal-case">Select time to reserve</span>
        </div>

        {filteredScreenings.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {filteredScreenings.map((screening) => (
              <ShowtimePill
                key={screening.id}
                screening={screening}
                isSelected={currentSelection?.id === screening.id}
                onSelect={(s) => setSelectedScreeningId(s.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic py-2">
            No showtimes currently scheduled in this auditorium today.
          </p>
        )}
      </div>

      {/* Card Footer: Action & Summary */}
      <div className="p-4 px-5 bg-[#15161B] border-t border-white/[0.06] flex items-center justify-between mt-auto">
        <div className="text-xs text-gray-400">
          {currentSelection ? (
            <span>
              Selected:{' '}
              <strong className="text-white font-semibold">
                {currentSelection.time}
              </strong>{' '}
              <span className="text-white font-bold ml-1">₱{currentSelection.price}</span>
            </span>
          ) : (
            <span className="text-gray-500">No showtime selected</span>
          )}
        </div>

        {allSoldOut ? (
          <button
            disabled
            className="px-5 py-2.5 rounded-xl bg-white/[0.05] text-gray-500 font-semibold text-xs sm:text-sm cursor-not-allowed border border-white/[0.05]"
          >
            Sold Out
          </button>
        ) : (
          <button
            onClick={handleBooking}
            disabled={!currentSelection}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-bold text-xs sm:text-sm transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_24px_rgba(255,255,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Select Screening</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
