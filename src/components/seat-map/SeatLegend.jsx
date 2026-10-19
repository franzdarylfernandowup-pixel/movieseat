export default function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4 px-4 bg-[#0D0E12]/80 rounded-xl border border-white/[0.08] text-xs text-gray-400 select-none">
      {/* Available */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-[#18181B] border border-zinc-700" />
        <span>Available</span>
      </div>

      {/* Selected */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-white text-black font-extrabold flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(255,255,255,0.7)]">
          ✓
        </div>
        <span className="text-white font-semibold">Selected (Yours)</span>
      </div>

      {/* Held by others */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-600 relative">
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
            ⏳
          </span>
        </div>
        <span>Held by Others</span>
      </div>

      {/* Reserved/Sold */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-[#0d0d10] border border-white/[0.04] opacity-40 cursor-not-allowed" />
        <span className="text-gray-500">Reserved / Sold</span>
      </div>

      {/* VIP Recliner marker */}
      <div className="flex items-center gap-2 border-l border-white/10 pl-4">
        <div className="w-6 h-5 rounded-md bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-500 flex items-center justify-center text-[9px] text-white font-bold">
          VIP
        </div>
        <span className="text-zinc-200 font-medium">VIP Recliners</span>
      </div>
    </div>
  )
}
