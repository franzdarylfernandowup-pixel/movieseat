import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { sendOtp, verifyOtp, readOtpRecord, OTP_TTL_MS, RESEND_COOLDOWN_MS } from '../../lib/otp'

const DIGITS = 6

function IconMail() {
  return (
    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconResend() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

/** Format seconds as M:SS */
function fmt(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VerifyForm() {
  const navigate = useNavigate()
  const { state } = useLocation()

  // Persist email to sessionStorage so it survives a hard refresh / back navigation
  const email = useMemo(() => {
    if (state?.email) {
      sessionStorage.setItem('ms_verify_email', state.email)
      return state.email
    }
    return sessionStorage.getItem('ms_verify_email') || ''
  }, [state])

  const [digits, setDigits] = useState(Array(DIGITS).fill(''))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Countdown timer (seconds until OTP expires)
  const [timeLeft, setTimeLeft] = useState(() => {
    const rec = readOtpRecord()
    if (!rec) return Math.floor(OTP_TTL_MS / 1000)
    const elapsed = Math.floor((Date.now() - rec.issuedAt) / 1000)
    return Math.max(0, Math.floor(OTP_TTL_MS / 1000) - elapsed)
  })

  // Resend cooldown (seconds)
  const [resendCooldown, setResendCooldown] = useState(() => {
    const rec = readOtpRecord()
    if (!rec) return 0
    const elapsed = Math.floor((Date.now() - rec.lastSentAt) / 1000)
    return Math.max(0, Math.floor(RESEND_COOLDOWN_MS / 1000) - elapsed)
  })

  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef([])

  // Tick down both timers
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
      setResendCooldown(c => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // If no OTP was issued and no email is recoverable, redirect to signin
  useEffect(() => {
    const rec = readOtpRecord()
    const storedEmail = sessionStorage.getItem('ms_verify_email')
    if (!rec && !storedEmail && !success) {
      navigate('/signin', { replace: true })
    }
  }, [success, navigate])

  // Focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleDigitChange = useCallback((i, val) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    setDigits(prev => {
      const next = [...prev]
      next[i] = ch
      return next
    })
    setError('')
    if (ch && i < DIGITS - 1) {
      inputRefs.current[i + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback((i, e) => {
    if (e.key === 'Backspace') {
      if (!digits[i] && i > 0) {
        setDigits(prev => { const n = [...prev]; n[i - 1] = ''; return n })
        inputRefs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputRefs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < DIGITS - 1) {
      inputRefs.current[i + 1]?.focus()
    }
  }, [digits])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS)
    if (!pasted) return
    setDigits(prev => {
      const next = [...prev]
      pasted.split('').forEach((ch, idx) => { next[idx] = ch })
      return next
    })
    const nextFocus = Math.min(pasted.length, DIGITS - 1)
    inputRefs.current[nextFocus]?.focus()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < DIGITS) { setError('Please enter all 6 digits.'); return }

    if (timeLeft === 0) { setError('Your code has expired. Please request a new one.'); return }

    setLoading(true)
    setError('')
    try {
      const result = verifyOtp(code)
      if (result.valid) {
        sessionStorage.removeItem('ms_verify_email')
        setSuccess(true)
        setTimeout(() => navigate('/signin', { state: { verified: true, email }, replace: true }), 1200)
      } else if (result.expired) {
        setError('Your code has expired. Please request a new one.')
      } else {
        setError('Incorrect code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !email) return
    setResendLoading(true)
    setError('')
    try {
      const result = await sendOtp(email)
      if (result.success) {
        setDigits(Array(DIGITS).fill(''))
        setTimeLeft(Math.floor(OTP_TTL_MS / 1000))
        setResendCooldown(Math.floor(RESEND_COOLDOWN_MS / 1000))
        inputRefs.current[0]?.focus()
      } else if (result.cooldownMs) {
        setResendCooldown(Math.ceil(result.cooldownMs / 1000))
      } else {
        setError(result.error || 'Failed to resend. Please try again.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const filled = digits.filter(Boolean).length
  const expired = timeLeft === 0

  return (
    <div className="flex flex-col items-center gap-6 w-full">

      {/* Icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-[#18181B] border border-white/[0.12] flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.1)]">
          <IconMail />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#15161B] flex items-center justify-center">
          <IconCheck />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          We've dispatched a 6-digit verification code to{' '}
          <span className="text-white font-semibold underline">{email || 'your email'}</span>{' '}
          to activate your MovieSeat perks.
        </p>
      </div>

      {/* Error / success */}
      {error && (
        <div className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <IconAlert />
          {error}
        </div>
      )}
      {success && (
        <div className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          <IconCheck />
          Email verified! Redirecting to Sign In…
        </div>
      )}

      {/* OTP boxes */}
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5 w-full">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 w-full" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={expired || success}
              aria-label={`OTP digit ${i + 1}`}
              className={`w-9 min-[380px]:w-10 sm:w-12 h-11 min-[380px]:h-12 sm:h-14 rounded-lg sm:rounded-xl text-center text-lg sm:text-xl font-bold transition-all duration-150 outline-none border-2 bg-[#0D0E12] text-white caret-white
                ${d ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.3)]' : 'border-white/[0.12]'}
                focus:border-white focus:shadow-[0_0_16px_rgba(255,255,255,0.4)]
                disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          ))}
        </div>

        {/* Timer */}
        <p className={`flex items-center gap-1.5 text-xs ${expired ? 'text-red-400' : 'text-gray-500'}`}>
          <IconClock />
          {expired ? 'Code expired — request a new one below' : (
            <>Code expires in <span className="font-semibold text-white tabular-nums">{fmt(timeLeft)}</span></>
          )}
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || success || expired || filled < DIGITS}
          className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <>
              Verify Email &amp; Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>

        {/* Resend row */}
        <div className="flex items-center justify-between w-full text-sm">
          <span className="text-gray-500">Didn't get the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading || !email}
            className="flex items-center gap-1.5 text-white underline hover:text-zinc-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {resendLoading ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <IconResend />
            )}
            {resendCooldown > 0 ? `Resend in ${fmt(resendCooldown)}` : 'Resend Code'}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="w-full border-t border-white/[0.06]" />

      {/* Hint */}
      <div className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-gray-500 leading-relaxed">
        <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
        </svg>
        Check your spam or promotions folder if the email doesn't appear within 2 minutes.
      </div>
    </div>
  )
}
