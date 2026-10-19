import { Link } from 'react-router-dom'

export default function ActionButtons() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xl mx-auto pt-6">
      {/* Print / Save Ticket */}
      <button
        type="button"
        onClick={handlePrint}
        className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] text-black font-bold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>Print / Save Ticket (PDF)</span>
      </button>

      {/* Lookup Anytime */}
      <Link
        to="/find-reservation"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#15161B] hover:bg-white/[0.08] text-gray-200 hover:text-white font-semibold text-sm border border-white/10 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Lookup Anytime</span>
      </Link>

      {/* Book Another Movie */}
      <Link
        to="/"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#15161B] hover:bg-white/[0.08] text-gray-200 hover:text-white font-semibold text-sm border border-white/10 transition-colors"
      >
        <span>Book Another Movie</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
