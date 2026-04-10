'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Question {
  id: string
  vraag: string
  type: 'choice' | 'text'
  opties?: string[]
}

interface LinkedInInput {
  id: string
  client_id: string
  type: string
  raw_text: string | null
  processed: boolean
  notes: string | null
  created_at: string
  ai_questions: Question[] | null
  user_answers: Record<string, string> | null
  _saving?: boolean
  _analyzing?: boolean
}

interface Props {
  clientId: string
  initialInputs: LinkedInInput[]
  loadError?: boolean
}

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL
const MIN_LENGTH = 20

export default function LinkedInTab({ clientId, initialInputs, loadError }: Props) {
  const router = useRouter()
  const [inputs, setInputs] = useState<LinkedInInput[]>(initialInputs)
  const [rawText, setRawText] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<{ id: string; msg: string } | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [bridgeOnline, setBridgeOnline] = useState<boolean | null>(null)
  const [localAnswers, setLocalAnswers] = useState<Record<string, Record<string, string>>>({})
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const charCount = rawText.length
  const charCountValid = charCount >= MIN_LENGTH
  const charCountColor = charCount > 0 && charCount < MIN_LENGTH
    ? 'text-red-400'
    : charCount >= MIN_LENGTH
      ? 'text-emerald-400'
      : 'text-slate-500'

  async function checkHealth() {
    if (!BRIDGE_URL) return
    try {
      const res = await fetch(`${BRIDGE_URL}/health`, { signal: AbortSignal.timeout(3000) })
      setBridgeOnline(res.ok)
    } catch {
      setBridgeOnline(false)
    }
  }

  useEffect(() => {
    if (!BRIDGE_URL) return
    checkHealth()
    healthIntervalRef.current = setInterval(checkHealth, 30_000)
    return () => { if (healthIntervalRef.current) clearInterval(healthIntervalRef.current) }
  }, [])

  function allAnswered(input: LinkedInInput): boolean {
    const questions = input.ai_questions
    if (!questions || questions.length === 0) return false
    const answers = localAnswers[input.id] || input.user_answers || {}
    return questions.every((q) => (answers[q.id] || '').trim().length > 0)
  }

  function setAnswer(inputId: string, questionId: string, value: string) {
    setLocalAnswers((prev) => ({
      ...prev,
      [inputId]: { ...(prev[inputId] || {}), [questionId]: value },
    }))
  }

  async function analyzeInput(inputId: string, inputText: string) {
    setInputs((prev) => prev.map((i) => i.id === inputId ? { ...i, _analyzing: true } : i))
    try {
      const res = await fetch(`${BRIDGE_URL}/analyze-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_id: inputId, input_text: inputText }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.detail || 'Analyse mislukt')

      const questions: Question[] = json.questions
      // Sla op in Supabase
      const supabase = createClient()
      await supabase.from('linkedin_input').update({ ai_questions: questions }).eq('id', inputId)
      // Update lokale state
      setInputs((prev) => prev.map((i) =>
        i.id === inputId ? { ...i, ai_questions: questions, _analyzing: false } : i
      ))
    } catch {
      // Analyse mislukt — toon alsnog de genereer-knop zonder vragen
      setInputs((prev) => prev.map((i) =>
        i.id === inputId ? { ...i, ai_questions: [], _analyzing: false } : i
      ))
    }
  }

  async function handleSaveInput() {
    if (!rawText.trim() || !charCountValid) return
    setSaving(true)

    const tempId = `temp-${Date.now()}`
    const savedText = rawText.trim()
    const savedNotes = notes.trim() || null

    const optimisticItem: LinkedInInput = {
      id: tempId,
      client_id: clientId,
      type: 'text',
      raw_text: savedText,
      notes: savedNotes,
      processed: false,
      created_at: new Date().toISOString(),
      ai_questions: null,
      user_answers: null,
      _saving: true,
    }
    setInputs((prev) => [optimisticItem, ...prev])
    setRawText('')
    setNotes('')

    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('linkedin_input')
        .insert({ client_id: clientId, type: 'text', raw_text: savedText, notes: savedNotes, processed: false })
        .select()
        .single()
      if (err) throw new Error(err.message)

      setInputs((prev) => prev.map((i) => i.id === tempId ? { ...data, _analyzing: false } : i))
      setSaving(false)
      // Auto-start analyse
      analyzeInput(data.id, savedText)
    } catch (e) {
      setInputs((prev) => prev.filter((i) => i.id !== tempId))
      setRawText(savedText)
      setNotes(savedNotes || '')
      setSaving(false)
    }
  }

  async function handleGenerate(input: LinkedInInput) {
    if (!BRIDGE_URL) return
    setGenerating(input.id)
    setGenerateError(null)

    // Sla antwoorden op in Supabase voordat we genereren
    const answers = localAnswers[input.id] || input.user_answers || {}
    const supabase = createClient()
    await supabase.from('linkedin_input').update({ user_answers: answers }).eq('id', input.id)

    try {
      const res = await fetch(`${BRIDGE_URL}/generate-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, input_id: input.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Genereren mislukt')
      setRetryCount(0)
      setInputs((prev) => prev.map((i) => i.id === input.id ? { ...i, processed: true } : i))
      router.push(`/klant/${clientId}?tab=content&status=concept`)
    } catch (e) {
      setRetryCount((c) => c + 1)
      setGenerateError({ id: input.id, msg: e instanceof Error ? e.message : 'Genereren mislukt' })
    } finally {
      setGenerating(null)
    }
  }

  async function handleDelete(inputId: string) {
    const supabase = createClient()
    await supabase.from('linkedin_input').delete().eq('id', inputId)
    setInputs((prev) => prev.filter((i) => i.id !== inputId))
  }

  if (!BRIDGE_URL) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
        <p className="text-red-400 font-semibold mb-1">Configuratiefout</p>
        <p className="text-red-300 text-sm">
          <code className="font-mono">NEXT_PUBLIC_BRIDGE_URL</code> is niet ingesteld.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bridge offline banner */}
      {bridgeOnline === false && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-orange-400 font-semibold text-sm">Bridge niet bereikbaar</p>
            <p className="text-orange-300 text-xs mt-0.5">Genereren is tijdelijk niet mogelijk.</p>
          </div>
          <button onClick={checkHealth} className="ml-auto text-orange-400 hover:text-orange-300 text-xs underline shrink-0">
            Opnieuw checken
          </button>
        </div>
      )}

      {loadError && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-sm text-slate-400">
          Kon inputs niet laden. Ververs de pagina.
        </div>
      )}

      {/* Input formulier */}
      <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-4">Nieuwe input</h3>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Plak hier de input van de klant — een bericht, blog, ervaring, resultaat..."
              rows={5}
              className="w-full bg-[#0F172A] text-white text-sm rounded-xl px-4 py-3 border border-slate-700/50 focus:outline-none focus:border-[#F59E0B]/60 placeholder-slate-500 resize-none"
            />
            <span className={`absolute bottom-2 right-3 text-xs font-mono ${charCountColor}`}>
              {charCount}
            </span>
          </div>
          {charCount > 0 && charCount < MIN_LENGTH && (
            <p className="text-red-400 text-xs">Minimaal {MIN_LENGTH} karakters.</p>
          )}
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionele notitie voor jezelf"
            className="w-full bg-[#0F172A] text-white text-sm rounded-xl px-4 py-3 border border-slate-700/50 focus:outline-none focus:border-[#F59E0B]/60 placeholder-slate-500"
          />
        </div>
        <button
          onClick={handleSaveInput}
          disabled={saving || !rawText.trim() || !charCountValid}
          className="mt-4 px-5 py-2.5 bg-[#F59E0B] text-[#0F172A] text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Opslaan...' : 'Input opslaan'}
        </button>
      </div>

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
              day: 'numeric', month: 'short', year: 'numeric',
            })
            const isGenerating = generating === input.id
            const isSaving = input._saving
            const isAnalyzing = input._analyzing
            const questions = input.ai_questions
            const answers = localAnswers[input.id] || input.user_answers || {}
            const canGenerate = allAnswered(input) || (questions !== null && questions.length === 0)
            const hasError = generateError?.id === input.id

            return (
              <div
                key={input.id}
                className={`bg-[#1E293B] rounded-2xl border border-slate-700/50 overflow-hidden transition-opacity ${isSaving ? 'opacity-60' : ''}`}
              >
                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">{date}</span>
                      {isSaving ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-600 text-slate-400 animate-pulse">Opslaan...</span>
                      ) : isAnalyzing ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Analyseren...
                        </span>
                      ) : input.processed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Verwerkt</span>
                      ) : questions && questions.length > 0 && !canGenerate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">Vragen beantwoorden</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Klaar om te genereren</span>
                      )}
                    </div>
                    {!isSaving && (
                      <button onClick={() => handleDelete(input.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                    {input.raw_text}
                  </p>
                  {input.notes && (
                    <p className="text-slate-500 text-xs italic mt-1">Notitie: {input.notes}</p>
                  )}
                </div>

                {/* Vragen sectie */}
                {!input.processed && !isSaving && questions && questions.length > 0 && (
                  <div className="border-t border-slate-700/50 p-5 pt-4 space-y-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Beantwoord deze vragen voor een betere post
                    </p>
                    {questions.map((q) => (
                      <div key={q.id}>
                        <p className="text-slate-200 text-sm mb-2">{q.vraag}</p>
                        {q.type === 'choice' && q.opties ? (
                          <div className="flex flex-wrap gap-2">
                            {q.opties.map((opt) => {
                              const selected = answers[q.id] === opt
                              return (
                                <button
                                  key={opt}
                                  onClick={() => setAnswer(input.id, q.id, opt)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    selected
                                      ? 'bg-[#F59E0B] text-[#0F172A]'
                                      : 'bg-[#0F172A] text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white'
                                  }`}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <textarea
                            value={answers[q.id] || ''}
                            onChange={(e) => setAnswer(input.id, q.id, e.target.value)}
                            rows={2}
                            placeholder="Jouw antwoord..."
                            className="w-full bg-[#0F172A] text-white text-sm rounded-xl px-3 py-2.5 border border-slate-700/50 focus:outline-none focus:border-[#F59E0B]/60 placeholder-slate-500 resize-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Genereer knop + errors */}
                {!input.processed && !isSaving && !isAnalyzing && (
                  <div className="px-5 pb-5 space-y-3">
                    {hasError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
                        <p className="text-red-400 text-xs">{generateError!.msg}</p>
                        {retryCount < 3 ? (
                          <button
                            onClick={() => handleGenerate(input)}
                            className="text-xs px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Opnieuw proberen ({3 - retryCount} over)
                          </button>
                        ) : (
                          <p className="text-red-300 text-xs">Check of de bridge draait.</p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleGenerate(input)}
                      disabled={isGenerating || !!generating || bridgeOnline === false || (!canGenerate && !!questions?.length)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-medium rounded-xl hover:bg-blue-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Genereren... (~90 sec)
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {!canGenerate && questions?.length ? 'Beantwoord alle vragen eerst' : 'Genereer LinkedIn post'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
