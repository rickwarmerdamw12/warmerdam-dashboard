import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import StatusBadge from '@/components/StatusBadge'
import { ClientWithServices, ContentStatus } from '@/types'
import DashboardClient from './DashboardClient'
import BottomNav from '@/components/BottomNav'

function getStatusCount(items: { status: string }[], status: ContentStatus) {
  return items.filter(i => i.status === status).length
}

function getThisMonthCount(items: { status: string; created_at: string }[], status: ContentStatus) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return items.filter(i =>
    i.status === status && new Date(i.created_at) >= startOfMonth
  ).length
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      client_services (*),
      content_items (*)
    `)
    .order('naam', { ascending: true })

  const typedClients = (clients || []) as ClientWithServices[]

  const allContentItems = typedClients.flatMap(c => c.content_items || [])

  const statsThisMonth = {
    concept: getThisMonthCount(allContentItems, 'concept'),
    in_review: getThisMonthCount(allContentItems, 'in_review'),
    goedgekeurd: getThisMonthCount(allContentItems, 'goedgekeurd'),
  }

  const activeClients = typedClients.filter(c => c.active).length
  const totalClients = typedClients.length

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header title="Dashboard" />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overzicht van alle klanten en content</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Klanten</p>
            <p className="text-2xl font-bold text-white">{activeClients}<span className="text-slate-500 text-sm font-normal">/{totalClients}</span></p>
            <p className="text-slate-500 text-xs mt-1">actief</p>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Concept</p>
            <p className="text-2xl font-bold text-white">{statsThisMonth.concept}</p>
            <p className="text-slate-500 text-xs mt-1">deze maand</p>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">In review</p>
            <p className="text-2xl font-bold text-blue-400">{statsThisMonth.in_review}</p>
            <p className="text-slate-500 text-xs mt-1">deze maand</p>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Goedgekeurd</p>
            <p className="text-2xl font-bold text-emerald-400">{statsThisMonth.goedgekeurd}</p>
            <p className="text-slate-500 text-xs mt-1">deze maand</p>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Klanten</h2>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm">{totalClients} totaal</span>
            <DashboardClient />
          </div>
        </div>

        {typedClients.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p>Geen klanten gevonden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {typedClients.map((client) => {
              const items = client.content_items || []
              const services = client.client_services || []
              const conceptCount = getStatusCount(items, 'concept')
              const reviewCount = getStatusCount(items, 'in_review')
              const goedgekeurdCount = getStatusCount(items, 'goedgekeurd')
              const gepubliceerdCount = getStatusCount(items, 'gepubliceerd')

              return (
                <Link key={client.id} href={`/klant/${client.id}`}>
                  <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 hover:border-[#F59E0B]/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer group h-full">
                    {/* Client header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-base truncate group-hover:text-[#F59E0B] transition-colors">
                            {client.naam}
                          </h3>
                          {client.active ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Actief
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                              Inactief
                            </span>
                          )}
                        </div>
                        {client.website_url && (
                          <p className="text-slate-500 text-xs truncate">{client.website_url}</p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-[#F59E0B] transition-colors shrink-0 ml-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Services */}
                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {services.filter(s => s.active).slice(0, 3).map((service) => (
                          <span key={service.id} className="px-2 py-0.5 rounded-lg bg-slate-700/70 text-slate-300 text-xs">
                            {service.service}
                          </span>
                        ))}
                        {services.filter(s => s.active).length > 3 && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-700/70 text-slate-400 text-xs">
                            +{services.filter(s => s.active).length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content counts */}
                    <div className="border-t border-slate-700/50 pt-3 mt-3">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-white font-semibold text-sm">{conceptCount}</p>
                          <p className="text-slate-500 text-xs">Concept</p>
                        </div>
                        <div>
                          <p className="text-blue-400 font-semibold text-sm">{reviewCount}</p>
                          <p className="text-slate-500 text-xs">Review</p>
                        </div>
                        <div>
                          <p className="text-emerald-400 font-semibold text-sm">{goedgekeurdCount}</p>
                          <p className="text-slate-500 text-xs">OK</p>
                        </div>
                        <div>
                          <p className="text-amber-400 font-semibold text-sm">{gepubliceerdCount}</p>
                          <p className="text-slate-500 text-xs">Gepub.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <BottomNav active="dashboard" />
    </div>
  )
}
