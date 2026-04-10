'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="bg-[#1E293B] rounded-2xl p-8 border border-slate-700/50 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">Er ging iets mis</h2>
        <p className="text-slate-400 text-sm mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#F59E0B] text-[#0F172A] text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  )
}
