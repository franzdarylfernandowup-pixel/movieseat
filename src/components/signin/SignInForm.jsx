import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

// ── icons ──────────────────────────────────────────────────────────────────────
function IconMail() {
  return (
    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function IconEye({ show }) {
  return show ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function Field({ label, id, error, left, right, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs tracking-widest text-gray-500 uppercase font-medium">
          {label}
        </label>
        {right}
      </div>
      <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#0D0E12] border transition-colors ${error ? 'border-red-500/60' : 'border-white/[0.08] focus-within:border-white focus-within:ring-1 focus-within:ring-white'}`}>
        {left}
        {children}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-0.5">
          <IconAlert />
          {error}
        </p>
      )}
    </div>
  )
}

export default function SignInForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const redirectTo = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState(() => location.state?.email || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [passErr, setPassErr] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    let ok = true
    setEmailErr('')
    setPassErr('')
    setError('')
    if (!email.trim()) { setEmailErr('Email address is required.'); ok = false }
    if (!password) { setPassErr('Password is required.'); ok = false }
    return ok
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        console.error('Supabase sign in error:', authError)
        setError(authError.message || 'Invalid credentials or user is not registered.')
      } else {
        navigate(redirectTo, { replace: true })
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 w-full">

      {/* Verified success notification */}
      {location.state?.verified && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Email verified successfully! Please sign in with your credentials.</span>
        </div>
      )}

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <IconAlert />
          {error}
        </div>
      )}

      {/* Email */}
      <Field label="Email Address" id="signin-email" error={emailErr} left={<IconMail />}>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="alex.rivera@example.com"
          autoComplete="email"
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
      </Field>

      {/* Password */}
      <Field
        label="Password"
        id="signin-password"
        error={passErr}
        left={<IconLock />}
        right={
          <Link to="/forgot-password" tabIndex={-1}
            className="text-xs text-zinc-400 hover:text-white underline transition-colors">
            Forgot password?
          </Link>
        }
      >
        <input
          id="signin-password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
        <button type="button" onClick={() => setShowPassword(v => !v)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}>
          <IconEye show={showPassword} />
        </button>
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1 py-3.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <>
            Sign In to MovieSeat
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>

      {/* Link to signup */}
      <p className="text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-white font-bold underline hover:text-zinc-300 transition-colors">
          Create an account
        </Link>
      </p>
    </form>
  )
}
