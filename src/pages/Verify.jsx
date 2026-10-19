import { Link } from 'react-router-dom'
import VerifyForm from '../components/verify/VerifyForm'

export default function Verify() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[400px] rounded-full bg-white opacity-[0.03] blur-[130px]" />
      </div>

      {/* Back link */}
      <div className="relative w-full max-w-md mb-4">
        <Link to="/signin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sign In
        </Link>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-[#15161B] rounded-2xl border border-white/[0.07] shadow-2xl px-4 min-[400px]:px-8 py-8 sm:py-10">
        <VerifyForm />
      </div>
    </div>
  )
}
