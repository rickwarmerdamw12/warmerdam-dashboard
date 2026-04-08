'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MarkGelezenButtonProps {
  submissionId: string
  gelezen: boolean
}

export default function MarkGelezenButton({ submissionId, gelezen }: MarkGelezenButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isGelezen, setIsGelezen] = useState(gelezen)

  const handleMark = async () => {
    if (isGelezen) return
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('contact_submissions')
      .update({ gelezen: true })
      .eq('id', submissionId)

    if (!error) {
      setIsGelezen(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (isGelezen) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Gelezen
      </span>
    )
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-xs font-semibold hover:bg-[#F59E0B]/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      Mark als gelezen
    </button>
  )
}
