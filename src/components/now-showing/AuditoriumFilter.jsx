export default function AuditoriumFilter({ auditoriums, selectedAuditorium, onSelect }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2.5 min-w-max">
        {auditoriums.map((aud) => {
          const isActive = selectedAuditorium === aud.id

          return (
            <button
              key={aud.id}
              onClick={() => onSelect(aud.id)}
              className={`group inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.25)] scale-[1.02]'
                  : 'bg-[#15161B] text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              {/* Colored status dot */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-transform ${
                  aud.dotColor || 'bg-white'
                } ${isActive ? 'scale-110 shadow-[0_0_8px_currentColor]' : 'opacity-80 group-hover:opacity-100'}`}
              />
              <span>{aud.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
