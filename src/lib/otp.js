import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_0qee32n'
const TEMPLATE_ID = 'template_nz0bh48'
const PUBLIC_KEY = 'mBdbLrUapzmIszQJd'
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000 // 60 seconds
const STORAGE_KEY = 'ms_otp'

/** Generate a cryptographically random 6-digit code */
function generateCode() {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1000000).padStart(6, '0')
}

/** Store OTP record in sessionStorage */
function storeOtp(email, code) {
  const record = {
    email,
    code,
    issuedAt: Date.now(),
    lastSentAt: Date.now(),
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  return record
}

/** Read OTP record from sessionStorage */
export function readOtpRecord() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Clear OTP record (call after successful verification) */
export function clearOtpRecord() {
  sessionStorage.removeItem(STORAGE_KEY)
}

/**
 * Generate a new OTP and send it via EmailJS.
 * Returns { success, error, cooldownMs }
 */
export async function sendOtp(email) {
  const existing = readOtpRecord()

  // Enforce resend cooldown
  if (existing) {
    const elapsed = Date.now() - existing.lastSentAt
    if (elapsed < RESEND_COOLDOWN_MS) {
      return { success: false, cooldownMs: RESEND_COOLDOWN_MS - elapsed }
    }
  }

  const code = generateCode()
  storeOtp(email, code)

  // Format expiry time label for email body
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)
  const timeLabel = expiresAt.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        email,
        to_email: email,
        recipient: email,
        to_name: email.split('@')[0],
        passcode: code,
        code,
        otp_code: code,
        otp: code,
        time: timeLabel,
      },
      PUBLIC_KEY
    )
    return { success: true }
  } catch (err) {
    console.error('EmailJS send error:', err)
    return { success: false, error: err?.text || err?.message || 'Failed to send email.' }
  }
}

/**
 * Verify the code the user entered.
 * Returns { valid, expired, wrong }
 */
export function verifyOtp(inputCode) {
  const record = readOtpRecord()
  if (!record) return { valid: false, expired: true }

  const age = Date.now() - record.issuedAt
  if (age > OTP_TTL_MS) return { valid: false, expired: true }

  if (inputCode !== record.code) return { valid: false, wrong: true }

  clearOtpRecord()
  return { valid: true }
}

/**
 * Send digital ticket confirmation email with reference code via EmailJS
 */
export async function sendTicketConfirmationEmail(reservation) {
  const seatsFormatted = Array.isArray(reservation.seats)
    ? reservation.seats.join(', ')
    : reservation.seats

  const confirmTemplateId = import.meta.env.VITE_EMAILJS_CONFIRM_TEMPLATE_ID || TEMPLATE_ID

  const templateParams = {
    to_name: reservation.patronName || 'Movie Patron',
    email: reservation.patronEmail,
    to_email: reservation.patronEmail,
    recipient: reservation.patronEmail,
    reference_code: reservation.reference,
    passcode: reservation.reference,
    movie_title: reservation.movieTitle,
    cinema: reservation.auditoriumName,
    showtime: reservation.showtime,
    seats: seatsFormatted,
    total_amount: `₱${Number(reservation.total || 0).toLocaleString()}`,
    time: reservation.showtime,
    ticket_url: `${window.location.origin}/ticket/${reservation.reference}`,
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      confirmTemplateId,
      templateParams,
      PUBLIC_KEY
    )
    return { success: true }
  } catch (err) {
    console.warn('Ticket confirmation email error (non-fatal):', err)
    return { success: false, error: err?.text || err?.message }
  }
}

export { OTP_TTL_MS, RESEND_COOLDOWN_MS }
