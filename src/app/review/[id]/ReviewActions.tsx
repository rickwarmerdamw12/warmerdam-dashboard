'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ContentStatus } from '@/types'

interface ReviewActionsProps {
  itemId: string
  clientId: string
  currentStatus: ContentStatus
  itemTitle: string
  clientNaam: string
  telegramChatId: string | null
  isLinkedIn?: boolean
}

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL

export default function ReviewActions({
  itemId, clientId, currentStatus, itemTitle, clientNaam, telegramChatId, isLinkedIn,
}: ReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | 'revise' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showReviseForm, setShowReviseForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [reviseFeedback, setReviseFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState(false)
  const [reviseError, setReviseError] = useState<string | null>(null)

  const handleApprove = async () => {
    setLoading('approve')
    const supabase = createClient()
    await supabase
      .from('content_items')
      .update({ status: 'goedgekeurd', feedback: null })
      .eq('id', itemId)

    if (telegramChatId) {
      fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, title: itemTitle, client_naam: clientNaam }),
      }).catch(() => {})
    }
    router.push(`/klant/${clientId}`)
    router.refresh()
  }

  const handleReject = async () => {
    if (!feedback.trim()) { setFeedbackError(true); return }
    setLoading('reject')
    const supabase = createClient()
    await supabase
      .from('content_items')
      .update({ status: 'concept', feedback: feedback.trim() })
      .eq('id', itemId)
    router.push(`/klant/${clientId}`)
    router.refresh()
  }

  const handleRevise = async () => {
    if (!reviseFeedback.trim()) return
    if (!BRIDGE_URL) { setReviseError('NEXT_PUBLIC_BRIDGE_URL niet ingesteld'); return }
    setLoading('revise')
    setReviseError(null)
    try {
      const res = await fetch(`${BRIDGE_URL}/revise-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: itemId, feedback: reviseFeedback.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Revisie mislukt')
      // Navigeer naar de nieuwe revisie
      router.push(`/review/${json.content_id}`)
      router.refresh()
    } catch (e) {
      setReviseError(e instanceof Error ? e.message : 'Revisie mislukt')
      setLoading(null)
    }
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
    <div className="fixed bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-sm border-t border-slate-800 z-50">
      <div className="max-w-3xl mx-auto p-4 space-y-3">

        {/* Revisie sectie — alleen voor LinkedIn posts */}
        {isLinkedIn && !showRejectForm && (
          <div>
            {!showReviseForm ? (
              <button
                onClick={() => setShowReviseForm(true)}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/30 text-sm font-medium hover:bg-blue-600/20 disabled:opacity-60 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Revisie aanvragen
              </button>
            ) : (
              <div className="bg-[#1E293B] rounded-2xl p-4 border border-blue-500/30 space-y-3">
                <p className="text-blue-400 text-sm font-semibold">Revisie aanvragen</p>
                <textarea
                  value={reviseFeedback}
                  onChange={(e) => setReviseFeedback(e.target.value)}
                  rows={3}
                  placeholder="Beschrijf wat er aangepast moet worden. Claude herschrijft de post op basis van jouw feedback."
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 resize-none"
                />
                {reviseError && (
                  <p className="text-red-400 text-xs">{reviseError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReviseForm(false); setReviseFeedback(''); setReviseError(null) }}
                    disabled={loading !== null}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 disabled:opacity-60 transition-all"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleRevise}
                    disabled={loading !== null || !reviseFeedback.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-semibold hover:bg-blue-600/30 disabled:opacity-60 transition-all"
                  >
                    {loading === 'revise' ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Herschrijven... (~90 sec)
                      </>
                    ) : 'Herschrijf post'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Goedkeuren / Afwijzen */}
        {!showReviseForm && (
          !showRejectForm ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/20 disabled:opacity-60 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Afwijzen
              </button>
              <button
                onClick={handleApprove}
                disabled={loading !== null || isAlreadyApproved}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#F59E0B] text-[#0F172A] font-semibold hover:bg-amber-400 disabled:opacity-60 transition-all shadow-lg shadow-amber-500/20"
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
                  onChange={(e) => { setFeedback(e.target.value); if (e.target.value.trim()) setFeedbackError(false) }}
                  rows={3}
                  placeholder="Geef aan wat er aangepast moet worden..."
                  className={`w-full px-4 py-3 rounded-xl bg-[#1E293B] border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none transition-all ${feedbackError ? 'border-red-500' : 'border-slate-600'}`}
                />
                {feedbackError && <p className="text-red-400 text-xs mt-1">Feedback is verplicht bij afwijzen.</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectForm(false); setFeedback(''); setFeedbackError(false) }}
                  disabled={loading !== null}
                  className="flex-1 py-3 px-5 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 disabled:opacity-60 transition-all"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading !== null}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 disabled:opacity-60 transition-all"
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
          )
        )}
      </div>
    </div>
  )
}
