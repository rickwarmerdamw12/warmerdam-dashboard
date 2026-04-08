'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NieuweKlantModalProps {
  onClose: () => void
}

export default function NieuweKlantModal({ onClose }: NieuweKlantModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [naam, setNaam] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [cmsType, setCmsType] = useState<'wordpress' | 'anders'>('anders')
  const [wordpressUrl, setWordpressUrl] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!naam.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: insertError } = await supabase.from('clients').insert({
      naam: naam.trim(),
      website_url: websiteUrl.trim() || null,
      cms_type: cmsType,
      wordpress_url: cmsType === 'wordpress' ? wordpressUrl.trim() || null : null,
      telegram_chat_id: telegramChatId.trim() || null,
      active: true,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1E293B] rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Nieuwe klant toevoegen</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Naam */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Naam <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
              placeholder="Bedrijfsnaam"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Website URL
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.voorbeeld.nl"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
            />
          </div>

          {/* CMS Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              CMS Type
            </label>
            <select
              value={cmsType}
              onChange={(e) => setCmsType(e.target.value as 'wordpress' | 'anders')}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
            >
              <option value="anders">Anders</option>
              <option value="wordpress">WordPress</option>
            </select>
          </div>

          {/* WordPress URL (conditional) */}
          {cmsType === 'wordpress' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                WordPress URL
              </label>
              <input
                type="text"
                value={wordpressUrl}
                onChange={(e) => setWordpressUrl(e.target.value)}
                placeholder="https://www.voorbeeld.nl/wp-admin"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
              />
            </div>
          )}

          {/* Telegram Chat ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="-1001234567890"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]/50 transition-all duration-200"
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
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-600 disabled:opacity-60 transition-all duration-200"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading || !naam.trim()}
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
                  Klant toevoegen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
