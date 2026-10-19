import { useState } from 'react'

export default function SearchCard({ onSearch, isLoading, error }) {
  const [code, setCode] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!code.trim()) return
    onSearch(code.trim())
  }

  return (
    <div className="w-full bg-[#15161B] rounded-2xl border border-white/[0.08] p-6 shadow-xl relative overflow-hidden">
      <h2 className="text-lg font-bold text-white tracking-tight">
        Search Booking by Reference
      </h2>
      <p className="text-xs text-gray-400 mt-1">
        Enter your 6-character reservation reference code (e.g. <span className="font-mono text-gray-300">MS-2026-X8R49K</span> or <span className="font-mono text-gray-300">X8R49K</span>).
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-mono font-bold">
            #
          </div>
          <input
            type="text"
            placeholder="MS-2026-XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0D0E12] border border-white/[0.08] focus:border-white focus:outline-none text-white font-mono text-sm tracking-wider uppercase placeholder:text-gray-600 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!code.trim() || isLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] text-black font-bold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Find Reservation</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
