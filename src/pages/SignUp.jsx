import SignUpForm from '../components/signup/SignUpForm'

export default function SignUp() {
  return (
    <div className="relative flex-1 flex items-center justify-center px-3.5 sm:px-4 py-6 sm:py-12 overflow-hidden">
      {/* Ambient glow backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[700px] h-[500px] rounded-full bg-white opacity-[0.03] blur-[130px]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-lg bg-[#15161B] rounded-2xl border border-white/[0.07] shadow-2xl px-5 sm:px-8 py-7 sm:py-10">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create your MovieSeat Account</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Join MovieSeat to reserve seats faster, track digital tickets,<br className="hidden sm:block" />
            and access your booking history.
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  )
}
