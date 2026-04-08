'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ContentStatus } from '@/types'

interface ReviewActionsProps {
  itemId: string
  clientId: string
  currentStatus: ContentStatus
}

export default function ReviewActions({ itemId, clientId, currentStatus }: ReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState(false)

  const handleApprove = async () => {
    setLoading('approve')
    const supabase = createClient()

    await supabase
      .from('content_items')
      .update({ status: 'goedgekeurd', feedback: null })
      .eq('id', itemId)

    router.push(`/klant/${clientId}`)
    router.refresh()
  }

  const handleReject = async () => {
    if (!feedback.trim()) {
      setFeedbackError(true)
      return
    }

    setLoading('reject')
    const supabase = createClient()

    await supabase
      .from('content_items')
      .update({ status: 'concept', feedback: feedback.trim() })
      .eq('id', itemId)

    router.push(`/klant/${clientId}`)
    router.refresh()
  }

  const isAlreadyApproved = currentStatus === 'goedgekeurd'
  const isPublished = currentStatus === 'gepubliceerd'

  if (isPublished) {
    return (
      <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 text-center">
        <p className="text-slate-400 text-sm">Dit item is gepubliceerd en kan niet meer worden bewerkt.</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0F172A]/95 backdrop-blur-sm border-t border-slate-800 z-50">
      <div className="max-w-3xl mx-auto">
        {!showRejectForm ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/20 active:bg-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Afwijzen
            </button>
            <button
              onClick={handleApprove}
              disabled={loading !== null || isAlreadyApproved}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#F59E0B] text-[#0F172A] font-semibold hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/20"
            >
              {loading === 'approve' ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Opslaan...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isAlreadyApproved ? 'Al goedgekeurd' : 'Goedkeuren'}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Feedback <span className="text-red-400">*</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value)
                  if (e.target.value.trim()) setFeedbackError(false)
                }}
                rows={3}
                placeholder="Geef aan wat er aangepast moet worden..."
                className={`w-full px-4 py-3 rounded-xl bg-[#1E293B] border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 resize-none ${
                  feedbackError ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {feedbackError && (
                <p className="text-red-400 text-xs mt-1">Feedback is verplicht bij afwijzen.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectForm(false)
                  setFeedback('')
                  setFeedbackError(false)
                }}
                disabled={loading !== null}
                className="flex-1 py-3 px-5 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 disabled:opacity-60 transition-all duration-200"
              >
                Annuleren
              </button>
              <button
                onClick={handleReject}
                disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 active:bg-red-600 disabled:opacity-60 transition-all duration-200"
              >
                {loading === 'reject' ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Opslaan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Afwijzen & feedback opslaan
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
