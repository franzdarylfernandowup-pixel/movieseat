export default function ProjectionArc({ format = 'SCREEN' }) {
  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center select-none mb-8">
      {/* Light beam projection downward effect */}
      <div className="absolute top-4 w-3/4 h-16 bg-gradient-to-b from-white/10 via-white/[0.02] to-transparent blur-md pointer-events-none" />

      {/* Curved Screen Arc SVG */}
      <div className="w-full h-12 relative flex items-center justify-center">
        <svg
          viewBox="0 0 500 50"
          className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]"
        >
          <defs>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M 25,40 Q 250,5 475,40"
            fill="none"
            stroke="url(#screenGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Screen label */}
      <div className="flex items-center gap-2 -mt-4">
        <span className="text-[10px] tracking-[0.25em] font-bold text-gray-400 uppercase">
          {format}
        </span>
      </div>
    </div>
  )
}
