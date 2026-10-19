import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-PH', {
          timeZone: 'Asia/Manila',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400">
      {/* Clock icon */}
      <svg className="w-3.5 h-3.5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="tabular-nums font-mono">{time}</span>
    </span>
  )
}

export default function Header() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMobileMenuOpen(false)
  }

  const isSignedIn = !!user

  return (
    <header className="sticky top-0 z-50 w-full bg-[#000000]/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-85">
          <img src="/logo.svg" alt="MS" className="h-7 w-auto" />
        </Link>

        {/* Center: Desktop Nav Pills (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ` +
              (isActive
                ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'text-gray-300 hover:text-white hover:bg-white/10')
            }
          >
            Now Showing
          </NavLink>
          <NavLink
            to="/find-reservation"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ` +
              (isActive
                ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'text-gray-300 hover:text-white hover:bg-white/10')
            }
          >
            Find Reservation
          </NavLink>
        </nav>

        {/* Right side: Cinema tag, Clock & Auth (Desktop) */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Cinema tag (desktop only) */}
          <span className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            Cinema City Hall
          </span>

          <span className="hidden lg:block w-px h-4 bg-white/10" />

          {/* Live clock (always visible) */}
          <LiveClock />

          <span className="hidden md:block w-px h-4 bg-white/10" />

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/[0.06] px-3 py-1.5 rounded-full border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate max-w-[130px] font-medium">{user?.email}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all duration-200 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button (visible on mobile only) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl bg-white/[0.05] border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              /* Close X Icon */
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger Bars Icon */
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0C] border-b border-white/10 px-4 py-5 shadow-2xl animate-fadeIn">
          {/* Cinema Hall Tag */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Cinema City Hall · Downtown
            </span>
            <span className="text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">
              3 Auditoriums
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 mb-4">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                    : 'bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08]'
                }`
              }
            >
              <span>Now Showing</span>
              <span>→</span>
            </NavLink>

            <NavLink
              to="/find-reservation"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                    : 'bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08]'
                }`
              }
            >
              <span>Find Reservation</span>
              <span>→</span>
            </NavLink>
          </nav>

          {/* User Account / Auth Section */}
          <div className="pt-3 border-t border-white/[0.06]">
            {isSignedIn ? (
              <div className="flex flex-col gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-gray-300 truncate font-medium">{user?.email}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Logged In
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Sign Out of Account
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 font-semibold text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-colors shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
