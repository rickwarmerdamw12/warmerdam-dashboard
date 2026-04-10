'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LinkedInInput {
  id: string
  client_id: string
  type: string
  raw_text: string | null
  processed: boolean
  notes: string | null
  created_at: string
}

interface Props {
  clientId: string
  initialInputs: LinkedInInput[]
}

export default function LinkedInTab({ clientId, initialInputs }: Props) {
  const router = useRouter()
  const [inputs, setInputs] = useState<LinkedInInput[]>(initialInputs)
  const [rawText, setRawText] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveInput() {
    if (!rawText.trim()) return
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('linkedin_input')
        .insert({
          client_id: clientId,
          type: 'text',
          raw_text: rawText.trim(),
          notes: notes.trim() || null,
          processed: false,
        })
        .select()
        .single()
      if (err) throw new Error(err.message)
      setInputs((prev) => [data, ...prev])
      setRawText('')
      setNotes('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate(inputId: string) {
    setGenerating(inputId)
    setError(null)
    try {
      // Call bridge directly from browser — bridge runs on same Mac as this browser session
      const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://127.0.0.1:8787'
      const res = await fetch(`${bridgeUrl}/generate-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, input_id: inputId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Genereren mislukt')
      setInputs((prev) => prev.map((i) => i.id === inputId ? { ...i, processed: true } : i))
      router.push(`/klant/${clientId}?tab=content&status=concept`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Genereren mislukt')
    } finally {
      setGenerating(null)
    }
  }

  async function handleDelete(inputId: string) {
    const supabase = createClient()
    await supabase.from('linkedin_input').delete().eq('id', inputId)
    setInputs((prev) => prev.filter((i) => i.id !== inputId))
  }

  return (
    <div className="space-y-6">
      {/* Input formulier */}
      <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-4">Nieuwe wekelijkse input</h3>
        <div className="space-y-3">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Plak hier de input van de klant — wat wil je deze week delen? Een ervaring, inzicht, tip, resultaat..."
            rows={5}
            className="w-full bg-[#0F172A] text-white text-sm rounded-xl px-4 py-3 border border-slate-700/50 focus:outline-none focus:border-[#F59E0B]/60 placeholder-slate-500 resize-none"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionele notitie (bijv. 'liefst storytelling stijl')"
            className="w-full bg-[#0F172A] text-white text-sm rounded-xl px-4 py-3 border border-slate-700/50 focus:outline-none focus:border-[#F59E0B]/60 placeholder-slate-500"
          />
        </div>
        <button
          onClick={handleSaveInput}
          disabled={saving || !rawText.trim()}
          className="mt-4 px-5 py-2.5 bg-[#F59E0B] text-[#0F172A] text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Opslaan...' : 'Input opslaan'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Input lijst */}
      {inputs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          <p>Nog geen input aangeleverd</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inputs.map((input) => {
            const date = new Date(input.created_at).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            const isGenerating = generating === input.id

            return (
              <div
                key={input.id}
                className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{date}</span>
                    {input.processed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Verwerkt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Wacht op generatie
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(input.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                    title="Verwijderen"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed line-clamp-4 mb-3">
                  {input.raw_text}
                </p>

                {input.notes && (
                  <p className="text-slate-500 text-xs italic mb-3">Notitie: {input.notes}</p>
                )}

                {!input.processed && (
                  <button
                    onClick={() => handleGenerate(input.id)}
                    disabled={isGenerating || !!generating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-medium rounded-xl hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        LinkedIn post genereren...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Genereer LinkedIn post
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
