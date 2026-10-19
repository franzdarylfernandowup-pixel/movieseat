import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { sendOtp } from '../../lib/otp'

// ── icons ──────────────────────────────────────────────────────────────────────
function IconPerson() {
  return (
    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

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

function IconShield() {
  return (
    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

// ── reusable field ─────────────────────────────────────────────────────────────
function Field({ label, id, error, left, right, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs tracking-widest text-gray-500 uppercase font-medium">
        {label}{required && <span className="text-white ml-0.5">*</span>}
      </label>
      <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#0D0E12] border transition-colors ${error ? 'border-red-500/60' : 'border-white/[0.08] focus-within:border-white focus-within:ring-1 focus-within:ring-white'}`}>
        {left}
        {children}
        {right}
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

// ── main component ────────────────────────────────────────────────────────────
export default function SignUpForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (!form.confirm) e.confirm = 'Please confirm your password.'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    if (!agreed) e.terms = 'You must agree to the terms to continue.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGlobalError('')
    if (!validate()) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.fullName.trim() },
          emailRedirectTo: undefined,
        },
      })

      if (error && !error.message.toLowerCase().includes('already registered')) {
        setGlobalError(error.message)
        return
      }

      // Send OTP via EmailJS
      const otpResult = await sendOtp(form.email.trim())
      if (!otpResult.success) {
        setGlobalError(otpResult.error || 'Failed to send verification email. Please try again.')
        return
      }

      navigate('/verify', { state: { email: form.email.trim() } })
    } catch {
      setGlobalError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 w-full">

      {/* Global error */}
      {globalError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <IconAlert />
          {globalError}
        </div>
      )}

      {/* Full Name */}
      <Field label="Full Name" id="signup-name" error={errors.fullName} left={<IconPerson />} required>
        <input
          id="signup-name"
          type="text"
          value={form.fullName}
          onChange={set('fullName')}
          placeholder="Alex Rivera"
          autoComplete="name"
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
      </Field>

      {/* Email */}
      <Field label="Email Address" id="signup-email" error={errors.email} left={<IconMail />} required>
        <input
          id="signup-email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="alex.rivera@example.com"
          autoComplete="email"
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
      </Field>

      {/* Password */}
      <Field
        label="Password"
        id="signup-password"
        error={errors.password}
        left={<IconLock />}
        required
        right={
          <button type="button" onClick={() => setShowPass(v => !v)}
            className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="Toggle password">
            <IconEye show={showPass} />
          </button>
        }
      >
        <input
          id="signup-password"
          type={showPass ? 'text' : 'password'}
          value={form.password}
          onChange={set('password')}
          placeholder="••••••••••••"
          autoComplete="new-password"
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
      </Field>

      {/* Confirm Password */}
      <Field
        label="Confirm Password"
        id="signup-confirm"
        error={errors.confirm}
        left={<IconShield />}
        required
        right={
          <button type="button" onClick={() => setShowConfirm(v => !v)}
            className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="Toggle confirm password">
            <IconEye show={showConfirm} />
          </button>
        }
      >
        <input
          id="signup-confirm"
          type={showConfirm ? 'text' : 'password'}
          value={form.confirm}
          onChange={set('confirm')}
          placeholder="••••••••••••"
          autoComplete="new-password"
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
      </Field>

      {/* Terms */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative mt-0.5 shrink-0">
            <input
              id="signup-terms"
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${agreed ? 'bg-white border-white' : 'border-white/20 bg-transparent'} peer-focus-visible:ring-2 peer-focus-visible:ring-white`}>
              {agreed && (
                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-400 leading-snug">
            I agree to the{' '}
            <a href="#" className="text-white underline hover:text-zinc-300 transition-colors">Terms of Service</a>
            {', '}
            <a href="#" className="text-white underline hover:text-zinc-300 transition-colors">Theater House Rules</a>
            {', and consent to digital processing under the '}
            <a href="#" className="text-white underline hover:text-zinc-300 transition-colors">Privacy Policy</a>.
          </span>
        </label>
        {errors.terms && (
          <p className="flex items-center gap-1.5 text-xs text-red-400 ml-7">
            <IconAlert />
            {errors.terms}
          </p>
        )}
      </div>

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
            Create Account
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>

      {/* Link to sign in */}
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/signin" className="text-white font-bold underline hover:text-zinc-300 transition-colors">
          Sign In →
        </Link>
      </p>
    </form>
  )
}
