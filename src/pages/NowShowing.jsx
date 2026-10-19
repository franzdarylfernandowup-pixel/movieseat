import { useState, useEffect } from 'react'
import AuditoriumFilter from '../components/now-showing/AuditoriumFilter'
import MovieCard from '../components/now-showing/MovieCard'
import { AUDITORIUMS, MOVIES } from '../data/mockData'
import { enrichMoviesWithTmdb } from '../lib/tmdb'

export default function NowShowing() {
  const [movies, setMovies] = useState(MOVIES)
  const [loading, setLoading] = useState(true)
  const [selectedAuditorium, setSelectedAuditorium] = useState('all')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const enriched = await enrichMoviesWithTmdb(MOVIES)
        if (isMounted) {
          setMovies(enriched)
        }
      } catch (e) {
        console.error('TMDB load error:', e)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  // Filter movies: only show movies that have screenings in the selected auditorium
  const visibleMovies = movies.filter((movie) => {
    if (selectedAuditorium === 'all') return true
    return movie.screenings.some((s) => s.auditoriumId === selectedAuditorium)
  })

  return (
    <div className="relative flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl mx-auto w-full">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
        <div className="w-[800px] h-[350px] rounded-full bg-white opacity-[0.03] blur-[140px] -top-20" />
      </div>

      {/* Hero Marquee Section */}
      <div className="relative mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-3 shadow-[0_0_12px_rgba(255,255,255,0.08)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Cinema City Hall · Downtown Complex
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Now Showing
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xl">
            Select your movie and showtime to choose your seats in real-time. Featuring IMAX Laser and Dolby Atmos auditoriums.
          </p>
        </div>

        {/* Date and Status indicator */}
        <div className="flex items-center sm:flex-col sm:items-end justify-center sm:justify-start gap-2 sm:gap-1 text-xs text-gray-400">
          <span className="font-medium text-gray-300">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            All 3 Auditoriums Operational
          </span>
        </div>
      </div>

      {/* Auditorium Filter Bar */}
      <div className="relative mb-8">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Filter by Auditorium
        </div>
        <AuditoriumFilter
          auditoriums={AUDITORIUMS}
          selectedAuditorium={selectedAuditorium}
          onSelect={setSelectedAuditorium}
        />
      </div>

      {/* Loading state: Centered white circular spinner */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white animate-spin" />
            <div className="absolute inset-0 rounded-full blur-[8px] border border-white/30 animate-pulse pointer-events-none" />
          </div>
          <span className="text-xs font-medium text-gray-400 mt-4 tracking-wide">
            Loading movie schedule...
          </span>
        </div>
      ) : (
        /* Movie Grid: Desktop 2x2, Mobile single column */
        <div className="relative">
          {visibleMovies.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  activeAuditorium={selectedAuditorium}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#15161B] rounded-2xl border border-white/[0.06] p-8">
              <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-3 text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">No Screenings Available</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                There are no scheduled screenings for this auditorium right now. Try selecting "All Auditoriums".
              </p>
              <button
                onClick={() => setSelectedAuditorium('all')}
                className="mt-4 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Show All Auditoriums
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
