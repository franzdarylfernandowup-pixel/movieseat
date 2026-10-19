import { Link } from 'react-router-dom'

export default function BreadcrumbBar({ movieTitle, auditoriumName, showtime }) {
  return (
    <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 py-2 overflow-x-auto no-scrollbar">
      <Link to="/" className="hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Now Showing</span>
      </Link>

      <span className="text-gray-600 shrink-0">/</span>

      <span className="text-gray-300 font-medium truncate max-w-[140px] sm:max-w-none shrink-0">
        {movieTitle}
      </span>

      <span className="text-gray-600 shrink-0">/</span>

      <span className="text-gray-400 shrink-0">
        {auditoriumName}
      </span>

      <span className="text-gray-600 shrink-0">/</span>

      <span className="text-white font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 shrink-0">
        {showtime}
      </span>
    </nav>
  )
}
