import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        <Link to="/" className="text-sm font-bold tracking-wider text-white hover:text-gray-300 transition-colors">
          MS
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span>Cinema City Hall</span>
          <span>•</span>
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-gray-400 underline decoration-white/20 transition-colors"
          >
            Powered by TMDB
          </a>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Connected
        </span>
      </div>
    </footer>
  )
}
