export default function StatusBadge({ status = 'Active' }) {
  const normalized = status.toLowerCase()

  if (normalized === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Active
      </span>
    )
  }

  if (normalized === 'used') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Used
      </span>
    )
  }

  if (normalized === 'expired') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-300 font-bold text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        Expired
      </span>
    )
  }

  // Cancelled or default
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-gray-400 font-bold text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      Cancelled
    </span>
  )
}
