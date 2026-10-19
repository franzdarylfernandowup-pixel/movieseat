import { useState } from 'react'

export default function TicketStub({ reference, patronName, seatsCount }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Barcode pattern of varying line widths
  const barcodeBars = [
    3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2
  ]

  return (
    <div className="flex flex-col items-center justify-between p-6 bg-[#0E0F14] border-t lg:border-t-0 lg:border-l border-dashed border-white/15 relative">
      {/* Decorative notch cutouts for perforation effect on desktop / mobile */}
      <div className="hidden lg:block absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#0B0B0D] border-b border-r border-white/10" />
      <div className="hidden lg:block absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#0B0B0D] border-t border-r border-white/10" />
      <div className="lg:hidden absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#0B0B0D]" />
      <div className="lg:hidden absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#0B0B0D]" />

      <div className="w-full text-center flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
          Reservation Reference
        </span>

        {/* Reference code & Copy button */}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-base sm:text-lg font-extrabold text-white tracking-wider bg-white/10 px-3 py-1 rounded-lg border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]">
            {reference}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`p-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10'
            }`}
            title="Copy reservation code"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[11px]">Copied!</span>
              </>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        <div className="text-xs text-gray-400 mt-3">
          Passholder: <strong className="text-gray-200">{patronName || 'Guest Patron'}</strong>
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">
          Admit: {seatsCount} {seatsCount === 1 ? 'Person' : 'Persons'}
        </div>
      </div>

      {/* Decorative Barcode */}
      <div className="w-full flex flex-col items-center mt-6 pt-4 border-t border-white/[0.06]">
        <div className="flex items-end justify-center gap-[2.5px] h-12 py-1 px-3 bg-white/[0.04] rounded-md border border-white/[0.08]">
          {barcodeBars.map((width, idx) => (
            <div
              key={idx}
              className="bg-gray-300 opacity-90 h-full rounded-[0.5px]"
              style={{ width: `${width * 1.5}px` }}
            />
          ))}
        </div>
        <span className="font-mono text-[9px] text-gray-500 tracking-[0.25em] mt-1.5 uppercase">
          {reference}
        </span>
        <span className="text-[9px] text-gray-600 mt-0.5">
          Scan at Cinema City Hall Turnstile
        </span>
      </div>
    </div>
  )
}
