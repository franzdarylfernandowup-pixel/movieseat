export default function ShowtimePill({ screening, isSelected, onSelect }) {
  const isSoldOut = screening.soldOut || screening.seatsLeft <= 0

  if (isSoldOut) {
    return (
      <div
        className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] opacity-40 cursor-not-allowed select-none min-w-[92px]"
        title="Screening is completely sold out"
      >
        <span className="text-xs font-medium line-through text-gray-500">{screening.time}</span>
        <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mt-0.5">Sold Out</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(screening)}
      className={`group flex flex-col items-center justify-center px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer min-w-[92px] ${
        isSelected
          ? 'bg-white text-black border-white shadow-[0_0_16px_rgba(255,255,255,0.4)] ring-1 ring-white'
          : 'bg-[#0D0E12] border-white/[0.08] hover:border-white/40 hover:bg-[#15161B] text-gray-300 hover:text-white'
      } border`}
    >
      <span className="text-xs sm:text-sm font-semibold tracking-tight">{screening.time}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className={`text-[11px] font-medium ${isSelected ? 'text-black font-bold' : 'text-zinc-300'}`}>₱{screening.price}</span>
        <span className={`text-[10px] ${isSelected ? 'text-zinc-600' : 'text-gray-500'}`}>•</span>
        <span className={`text-[10px] ${isSelected ? 'text-zinc-700 font-medium' : 'text-gray-400'}`}>
          {screening.seatsLeft} left
        </span>
      </div>
    </button>
  )
}
