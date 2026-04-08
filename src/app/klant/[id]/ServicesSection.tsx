'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClientService } from '@/types'

const SERVICE_OPTIONS = [
  { value: 'seo_blog', label: 'SEO Blog' },
  { value: 'geo_artikel', label: 'GEO Artikel' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'seo_landingspagina', label: 'SEO Landingspagina' },
]

const FREQUENCY_OPTIONS = [
  { value: 'wekelijks', label: 'Wekelijks' },
  { value: 'tweewekelijks', label: 'Tweewekelijks' },
  { value: 'maandelijks', label: 'Maandelijks' },
]

interface ServicesSectionProps {
  clientId: string
  initialServices: ClientService[]
}

export default function ServicesSection({ clientId, initialServices }: ServicesSectionProps) {
  const router = useRouter()
  const [services, setServices] = useState<ClientService[]>(initialServices)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newService, setNewService] = useState('seo_blog')
  const [newFrequency, setNewFrequency] = useState('maandelijks')
  const [newActive, setNewActive] = useState(true)

  const handleAddService = async () => {
    setAddLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: insertError } = await supabase
      .from('client_services')
      .insert({
        client_id: clientId,
        service: newService,
        frequency: newFrequency,
        active: newActive,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setAddLoading(false)
      return
    }

    if (data) {
      setServices((prev) => [...prev, data as ClientService])
    }
    setShowAddForm(false)
    setNewService('seo_blog')
    setNewFrequency('maandelijks')
    setNewActive(true)
    setAddLoading(false)
    router.refresh()
  }

  const handleToggleActive = async (serviceId: string, currentActive: boolean) => {
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('client_services')
      .update({ active: !currentActive })
      .eq('id', serviceId)

    if (!updateError) {
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, active: !currentActive } : s))
      )
      router.refresh()
    }
  }

  const handleDelete = async (serviceId: string) => {
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('client_services')
      .delete()
      .eq('id', serviceId)

    if (!deleteError) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      router.refresh()
    }
  }

  const getServiceLabel = (value: string) =>
    SERVICE_OPTIONS.find((o) => o.value === value)?.label ?? value

  const getFrequencyLabel = (value: string | null) =>
    FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '–'

  return (
    <div className="bg-[#1E293B] rounded-2xl border border-slate-700/50 mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Services</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-xs font-semibold hover:bg-[#F59E0B]/20 transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Service toevoegen
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="px-5 py-4 border-b border-slate-700/50 bg-[#0F172A]/30">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Nieuwe service</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Service</label>
              <select
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E293B] border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Frequentie</label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E293B] border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <button
                type="button"
                onClick={() => setNewActive((v) => !v)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  newActive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}
              >
                {newActive ? 'Actief' : 'Inactief'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddForm(false); setError(null) }}
              disabled={addLoading}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 disabled:opacity-60 transition-all duration-200"
            >
              Annuleren
            </button>
            <button
              onClick={handleAddService}
              disabled={addLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] text-[#0F172A] text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {addLoading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Services list */}
      {services.length === 0 ? (
        <div className="px-5 py-8 text-center text-slate-500 text-sm">
          Geen services geconfigureerd.
        </div>
      ) : (
        <div className="divide-y divide-slate-700/50">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between px-5 py-3 gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{getServiceLabel(service.service)}</p>
                  <p className="text-xs text-slate-500">{getFrequencyLabel(service.frequency)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(service.id, service.active)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    service.active
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {service.active ? 'Actief' : 'Inactief'}
                </button>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(service.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
