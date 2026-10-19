import { useState } from 'react'

export default function CancelReservationModal({ isOpen, onClose, reservation, onConfirmCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !reservation) return null

  // Check 30-minute cutoff policy
  const checkCancellationEligibility = () => {
    try {
      const showtimeStr = reservation.showtime || ''
      // Match "4:45 PM" or "10:15 AM"
      const match = showtimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (match) {
        let hours = parseInt(match[1], 10)
        const minutes = parseInt(match[2], 10)
        const meridiem = match[3].toUpperCase()

        if (meridiem === 'PM' && hours < 12) hours += 12
        if (meridiem === 'AM' && hours === 12) hours = 0

        const now = new Date()
        // Compute showtime date for today
        const showtimeDate = new Date()
        showtimeDate.setHours(hours, minutes, 0, 0)

        const diffMinutes = (showtimeDate.getTime() - now.getTime()) / (1000 * 60)

        // If showtime is within 30 minutes or already passed
        if (diffMinutes < 30) {
          return {
            allowed: false,
            reason: diffMinutes <= 0
              ? 'This screening has already started. Cancellations are not permitted.'
              : `This screening starts in ${Math.round(diffMinutes)} minutes. Theater policy strictly prohibits cancellations within 30 minutes of showtime.`,
          }
        }
      }
    } catch (e) {
      console.warn('Cutoff check error:', e)
    }

    return { allowed: true }
  }

  const eligibility = checkCancellationEligibility()

  const handleCancel = async () => {
    if (!eligibility.allowed) {
      setError(eligibility.reason)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onConfirmCancel(reservation)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to cancel reservation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#15161B] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Red accent glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-red-500/10 blur-[60px]" />

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Cancel Reservation
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Ref: {reservation.reference}
            </p>
          </div>
        </div>

        {/* Details Box */}
        <div className="bg-[#0D0E12] rounded-xl p-3.5 border border-white/[0.06] mb-4 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Movie:</span>
            <span className="text-gray-200 font-semibold">{reservation.movieTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Screening Time:</span>
            <span className="text-white font-bold">{reservation.showtime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Seats to Release:</span>
            <span className="text-gray-200 font-medium">{(reservation.seats || []).join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Refund / Release:</span>
            <span className="text-white font-bold">₱{Number(reservation.total || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Policy Notice */}
        <div className="text-[11px] text-gray-400 mb-5 leading-relaxed bg-white/5 border border-white/10 rounded-xl p-3">
          <strong className="text-white block mb-0.5">30-Minute Cutoff Policy:</strong>
          Reservations can only be cancelled at least 30 minutes prior to showtime. Once confirmed, seat assignments are permanently released back into general admission.
        </div>

        {/* Error or ineligible warning */}
        {(!eligibility.allowed || error) && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <div>
              <strong className="font-semibold block">Cancellation Policy Restriction</strong>
              <span>{error || eligibility.reason}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Keep Reservation
          </button>

          {eligibility.allowed && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
