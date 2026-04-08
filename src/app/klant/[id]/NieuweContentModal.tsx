'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SERVICE_OPTIONS = [
  { value: 'seo_blog', label: 'SEO Blog' },
  { value: 'geo_artikel', label: 'GEO Artikel' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'seo_landingspagina', label: 'SEO Landingspagina' },
]

interface NieuweContentModalProps {
  clientId: string
}

export default function NieuweContentModal({ clientId }: NieuweContentModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [service, setService] = useState('seo_blog')
  const [metaDescription, setMetaDescription] = useState('')
  const [keywordsInput, setKeywordsInput] = useState('')
  const [content, setContent] = useState('')

  const handleClose = () => {
    setOpen(false)
    setError(null)
    setTitle('')
    setService('seo_blog')
    setMetaDescription('')
    setKeywordsInput('')
    setContent('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    const supabase = createClient()

    const { error: insertError } = await supabase.from('content_items').insert({
      client_id: clientId,
      title: title.trim(),
      service,
      meta_description: metaDescription.trim() || null,
      keywords_used: keywords.length > 0 ? keywords : null,
      content: content.trim(),
      status: 'concept',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.refresh()
    handleClose()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F59E0B] text-[#0F172A] font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all duration-200 shadow-lg shadow-amber-500/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nieuw content item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-[#1E293B] rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/50 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50 shrink-0">
              <h2 className="text-lg font-semibold text-white">Nieuw content item</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Titel <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Titel van het content item"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Service
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
                >
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Meta description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Meta beschrijving
                </label>
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Korte beschrijving voor zoekmachines..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Zoekwoorden
                  <span className="text-slate-500 font-normal ml-1">(komma gescheiden)</span>
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="seo, content marketing, website"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Inhoud
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Schrijf hier de inhoud van het content item..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-600 disabled:opacity-60 transition-all duration-200"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F59E0B] text-[#0F172A] font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  {loading ? (
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Item aanmaken
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
