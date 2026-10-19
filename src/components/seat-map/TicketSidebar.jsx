import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function TicketSidebar({
  movie,
  screening,
  selectedSeats,
  onRemoveSeat,
  onConfirm,
  isSubmitting,
}) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null
      setCurrentUser(u)
      if (u) {
        setEmail(u.email || '')
        setName(u.user_metadata?.full_name || u.email?.split('@')[0] || '')
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null
      setCurrentUser(u)
      if (u) {
        setEmail(u.email || '')
        setName(u.user_metadata?.full_name || u.email?.split('@')[0] || '')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Calculate pricing
  const subtotal = selectedSeats.reduce((sum, s) => sum + (s.price || screening.price), 0)
  const bookingFee = 0 // Waived
  const total = subtotal + bookingFee

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    if (!currentUser) {
      setFormError('You must sign in to reserve seats.')
      return
    }

    if (selectedSeats.length === 0) {
      setFormError('Please select at least 1 seat on the map.')
      return
    }

    if (!name.trim()) {
      setFormError('Please enter your full name.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.')
      return
    }

    onConfirm({
      name: name.trim(),
      email: email.trim(),
      seats: selectedSeats,
      total,
      subtotal,
      userId: currentUser.id,
    })
  }

  return (
    <div className="bg-[#121214] rounded-2xl border border-white/[0.08] p-6 flex flex-col shadow-2xl relative overflow-hidden">
      {/* Decorative subtle white radial glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 rounded-full bg-white opacity-[0.03] blur-[80px]" />

      <h2 className="text-lg font-bold text-white tracking-tight pb-3 border-b border-white/[0.08] flex items-center justify-between">
        <span>Reservation Summary</span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
          {selectedSeats.length} / 6 Seats
        </span>
      </h2>

      {/* Selected Movie & Screening Info */}
      <div className="py-4 border-b border-white/[0.06] flex gap-3.5">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-14 h-20 rounded-lg object-cover bg-[#0D0E12] border border-white/10 shrink-0 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
            {movie.format}
          </div>
          <h3 className="text-sm font-bold text-white truncate mt-0.5">
            {movie.title}
          </h3>
          <div className="text-xs text-gray-400 mt-1 flex flex-col gap-0.5">
            <span>{screening.auditoriumName}</span>
            <span className="text-gray-300 font-medium">{screening.time} · Today</span>
          </div>
        </div>
      </div>

      {/* Selected Seat Chips */}
      <div className="py-4 border-b border-white/[0.06]">
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between">
          <span>Selected Seats</span>
          <span className="text-[11px] text-gray-500">
            {selectedSeats.length === 0 ? 'None yet' : `${selectedSeats.length} selected`}
          </span>
        </div>

        {selectedSeats.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map((seat) => (
              <span
                key={seat.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/40 text-white text-xs font-bold"
              >
                <span>Seat {seat.id}</span>
                <span className="text-[10px] text-zinc-300 font-normal">
                  (₱{seat.price || screening.price})
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSeat(seat.id)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer ml-0.5"
                  title="Remove seat"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="py-3 px-3 rounded-xl bg-[#0D0E12] border border-dashed border-white/10 text-center text-xs text-gray-500">
            Click on seats in the map to select them
          </div>
        )}
      </div>

      {/* Pricing Breakdown */}
      <div className="py-4 border-b border-white/[0.06] text-xs space-y-2">
        <div className="flex items-center justify-between text-gray-400">
          <span>Seat Tickets ({selectedSeats.length})</span>
          <span className="text-gray-200 font-medium">₱{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-gray-400">
          <span className="flex items-center gap-1">
            Online Booking Fee
            <span className="text-[10px] text-emerald-400 font-semibold">(Promo)</span>
          </span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            FREE
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-sm font-bold">
          <span className="text-white">Total Amount</span>
          <span className="text-white font-extrabold text-lg">₱{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Authentication Check */}
      {authLoading ? (
        <div className="py-6 text-center text-xs text-gray-500">Checking account status...</div>
      ) : !currentUser ? (
        /* Prompt for unauthenticated guests */
        <div className="pt-5 flex flex-col gap-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
            <div className="flex items-center gap-2 font-bold text-white mb-1">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Login Required to Reserve</span>
            </div>
            <span>You must be signed in to your MovieSeat account to hold and confirm seat reservations.</span>
          </div>

          <Link
            to={`/signin?redirect=/screenings/${screening.id}`}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] text-black font-bold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span>Sign In to Reserve Seats</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <div className="text-center text-xs text-gray-500 mt-1">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white font-semibold underline hover:text-zinc-300">
              Create one now
            </Link>
          </div>
        </div>
      ) : (
        /* Logged in patron checkout form */
        <form onSubmit={handleSubmit} className="pt-4 flex flex-col gap-3.5 flex-1">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Logged in as <strong className="text-white">{currentUser.email}</strong>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Verified</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Patron Name *
            </label>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0E12] border border-white/[0.08] focus:border-white focus:outline-none text-white text-xs sm:text-sm placeholder:text-gray-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Email for Ticket Confirmation *
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0E12] border border-white/[0.08] text-gray-300 text-xs sm:text-sm cursor-not-allowed opacity-80"
            />
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          <div className="mt-1 text-[11px] text-gray-500 bg-[#0D0E12] p-2.5 rounded-xl border border-white/[0.04]">
            ℹ️ <strong>Simulated checkout:</strong> No real payment is charged. Your digital ticket and reference code will be generated instantly.
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={selectedSeats.length === 0 || isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] text-black font-bold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Confirming Reservation...</span>
              </>
            ) : (
              <>
                <span>Confirm Reservation ({selectedSeats.length})</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
