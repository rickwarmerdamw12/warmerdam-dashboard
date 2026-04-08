import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import StatusBadge from '@/components/StatusBadge'
import { ContentStatus } from '@/types'

const statusTabs: { value: ContentStatus | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'concept', label: 'Concept' },
  { value: 'in_review', label: 'In review' },
  { value: 'goedgekeurd', label: 'Goedgekeurd' },
  { value: 'gepubliceerd', label: 'Gepubliceerd' },
]

export default async function KlantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { id } = await params
  const { status } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const activeFilter: string = status || 'alle'

  let query = supabase
    .from('content_items')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  if (activeFilter !== 'alle') {
    query = query.eq('status', activeFilter)
  }

  const { data: contentItems } = await query

  const { data: allItems } = await supabase
    .from('content_items')
    .select('status')
    .eq('client_id', id)

  const counts: Record<string, number> = { alle: allItems?.length || 0 }
  for (const tab of statusTabs.filter(t => t.value !== 'alle')) {
    counts[tab.value] = allItems?.filter(i => i.status === tab.value).length || 0
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header backHref="/dashboard" backLabel="Dashboard" />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        {/* Client Header */}
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">{client.naam}</h1>
                {client.active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Actief
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                    Inactief
                  </span>
                )}
              </div>
              {client.website_url && (
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F59E0B] text-sm hover:underline flex items-center gap-1 mt-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {client.website_url}
                </a>
              )}
            </div>
            {client.cms_type && (
              <span className="px-3 py-1 rounded-xl bg-slate-700/70 text-slate-300 text-xs font-medium">
                {client.cms_type}
              </span>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {statusTabs.map((tab) => {
            const isActive = activeFilter === tab.value
            return (
              <Link
                key={tab.value}
                href={`/klant/${id}${tab.value !== 'alle' ? `?status=${tab.value}` : ''}`}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F59E0B] text-[#0F172A]'
                    : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                  isActive ? 'bg-[#0F172A]/20 text-[#0F172A]' : 'bg-slate-700 text-slate-300'
                }`}>
                  {counts[tab.value] || 0}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Content Items */}
        {!contentItems || contentItems.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p>Geen content gevonden</p>
            {activeFilter !== 'alle' && (
              <Link href={`/klant/${id}`} className="text-[#F59E0B] text-sm mt-2 inline-block hover:underline">
                Toon alle content
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contentItems.map((item) => {
              const preview = item.content?.slice(0, 150) || ''
              const date = new Date(item.created_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              return (
                <Link key={item.id} href={`/review/${item.id}`}>
                  <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 hover:border-[#F59E0B]/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-white group-hover:text-[#F59E0B] transition-colors line-clamp-2 flex-1">
                        {item.title}
                      </h3>
                      <div className="shrink-0 flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <svg className="w-4 h-4 text-slate-600 group-hover:text-[#F59E0B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {preview && (
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {preview}{item.content?.length > 150 ? '...' : ''}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{date}</span>
                      {item.service && (
                        <>
                          <span>·</span>
                          <span>{item.service}</span>
                        </>
                      )}
                      {item.feedback && item.status === 'concept' && (
                        <>
                          <span>·</span>
                          <span className="text-orange-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Feedback aanwezig
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
