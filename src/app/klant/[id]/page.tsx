import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import StatusBadge from '@/components/StatusBadge'
import { ClientService, ContentStatus, GscInspection } from '@/types'
import ServicesSection from './ServicesSection'
import NieuweContentModal from './NieuweContentModal'
import MarkGelezenButton from './MarkGelezenButton'
import LinkedInTab from './LinkedInTab'

const statusTabs: { value: ContentStatus | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'concept', label: 'Concept' },
  { value: 'in_review', label: 'In review' },
  { value: 'goedgekeurd', label: 'Goedgekeurd' },
  { value: 'gepubliceerd', label: 'Gepubliceerd' },
]

const mainTabs = [
  { value: 'content', label: 'Content' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'seo', label: 'SEO' },
  { value: 'services', label: 'Services' },
  { value: 'blogs', label: 'Blogs' },
  { value: 'contacten', label: 'Contacten' },
]

const seoFilters: { value: 'alle' | 'indexed' | 'not-indexed'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'indexed', label: 'Geïndexeerd' },
  { value: 'not-indexed', label: 'Niet geïndexeerd' },
]

export default async function KlantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; status?: string; seo?: string }>
}) {
  const { id } = await params
  const { tab, status, seo } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const activeTab = tab || 'content'
  const activeFilter: string = status || 'alle'

  // Content tab data
  let contentItems = null
  let counts: Record<string, number> = {}
  if (activeTab === 'content') {
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })

    if (activeFilter !== 'alle') {
      query = query.eq('status', activeFilter)
    }

    const { data } = await query
    contentItems = data

    const { data: allItems } = await supabase
      .from('content_items')
      .select('status')
      .eq('client_id', id)

    counts = { alle: allItems?.length || 0 }
    for (const t of statusTabs.filter((t) => t.value !== 'alle')) {
      counts[t.value] = allItems?.filter((i) => i.status === t.value).length || 0
    }
  }

  // Services tab data
  let clientServices = null
  if (activeTab === 'services') {
    const { data } = await supabase
      .from('client_services')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: true })
    clientServices = data
  }

  // Blogs tab data
  let blogPosts = null
  if (activeTab === 'blogs') {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
    blogPosts = data
  }

  // Contacten tab data
  let contactSubmissions = null
  if (activeTab === 'contacten') {
    const { data } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
    contactSubmissions = data
  }

  // LinkedIn tab data
  let linkedInInputs = null
  if (activeTab === 'linkedin') {
    const { data } = await supabase
      .from('linkedin_input')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
    linkedInInputs = data
  }

  // SEO tab data — laatste GSC snapshot voor deze klant
  let seoInspections: GscInspection[] | null = null
  let seoLatestDate: string | null = null
  let seoCounts = { alle: 0, indexed: 0, notIndexed: 0 }
  const seoFilter = (seo as 'alle' | 'indexed' | 'not-indexed') || 'alle'
  if (activeTab === 'seo') {
    const { data: latest } = await supabase
      .from('gsc_inspections')
      .select('snapshot_date')
      .eq('client_id', id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
    seoLatestDate = latest?.[0]?.snapshot_date ?? null

    if (seoLatestDate) {
      const { data: rows } = await supabase
        .from('gsc_inspections')
        .select('*')
        .eq('client_id', id)
        .eq('snapshot_date', seoLatestDate)
        .order('verdict', { ascending: true })
        .order('url', { ascending: true })
      const all = (rows ?? []) as GscInspection[]
      seoCounts = {
        alle: all.length,
        indexed: all.filter((r) => r.verdict === 'PASS').length,
        notIndexed: all.filter((r) => r.verdict !== 'PASS').length,
      }
      if (seoFilter === 'indexed') {
        seoInspections = all.filter((r) => r.verdict === 'PASS')
      } else if (seoFilter === 'not-indexed') {
        seoInspections = all.filter((r) => r.verdict !== 'PASS')
      } else {
        seoInspections = all
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header backHref="/dashboard" backLabel="Dashboard" />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        {/* Client Header */}
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 mb-5">
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

        {/* Main Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {mainTabs.map((t) => {
            const isActive = activeTab === t.value
            return (
              <Link
                key={t.value}
                href={`/klant/${id}?tab=${t.value}`}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F59E0B] text-[#0F172A]'
                    : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </div>

        {/* Tab: Content */}
        {activeTab === 'content' && (
          <>
            {/* New Content Button */}
            <div className="mb-4 flex items-center justify-end">
              <NieuweContentModal clientId={id} />
            </div>

            {/* Status Sub-Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {statusTabs.map((stab) => {
                const isActive = activeFilter === stab.value
                return (
                  <Link
                    key={stab.value}
                    href={`/klant/${id}?tab=content${stab.value !== 'alle' ? `&status=${stab.value}` : ''}`}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#F59E0B] text-[#0F172A]'
                        : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'
                    }`}
                  >
                    {stab.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                      isActive ? 'bg-[#0F172A]/20 text-[#0F172A]' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {counts[stab.value] || 0}
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
                  <Link href={`/klant/${id}?tab=content`} className="text-[#F59E0B] text-sm mt-2 inline-block hover:underline">
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
          </>
        )}

        {/* Tab: LinkedIn */}
        {activeTab === 'linkedin' && (
          <LinkedInTab
            clientId={id}
            initialInputs={linkedInInputs || []}
          />
        )}

        {/* Tab: SEO */}
        {activeTab === 'seo' && (
          <>
            {!client.gsc_property ? (
              <div className="bg-[#1E293B] rounded-2xl p-8 border border-slate-700/50 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-slate-300 font-medium mb-2">GSC nog niet ingesteld voor deze klant</p>
                <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
                  Vul <code className="text-[#F59E0B] font-mono">gsc_property</code> en <code className="text-[#F59E0B] font-mono">sitemap_url</code> in op deze klant. Daarna pakt de dagelijkse cron (06:00) automatisch indexatie-data op via Google Search Console.
                </p>
                <pre className="inline-block text-left text-xs bg-[#0F172A] text-slate-400 rounded-lg p-3 border border-slate-700/50 font-mono">{`UPDATE clients SET
  gsc_property = 'sc-domain:voorbeeld.nl',
  sitemap_url  = 'https://voorbeeld.nl/sitemap.xml'
WHERE id = '${id}';`}</pre>
              </div>
            ) : !seoLatestDate ? (
              <div className="bg-[#1E293B] rounded-2xl p-8 border border-slate-700/50 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-300 font-medium mb-1">Nog geen snapshot beschikbaar</p>
                <p className="text-slate-500 text-sm">
                  GSC property: <code className="text-[#F59E0B] font-mono">{client.gsc_property}</code>
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  De cron draait dagelijks om 06:00. Of run nu handmatig:
                </p>
                <pre className="inline-block text-left text-xs bg-[#0F172A] text-slate-400 rounded-lg p-3 border border-slate-700/50 font-mono mt-3">{`~/warmerdam/.venv-agent/bin/python3 \\
  ~/warmerdam/gsc/inspect.py \\
  --client-id ${id}`}</pre>
              </div>
            ) : (
              <>
                {/* Summary card */}
                <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 mb-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Indexatie status</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{seoCounts.indexed}</span>
                        <span className="text-lg text-slate-400">/ {seoCounts.alle}</span>
                        <span className="text-sm text-slate-500 ml-1">geïndexeerd</span>
                      </div>
                      <div className="text-2xl font-bold text-[#F59E0B] mt-1">
                        {seoCounts.alle > 0 ? Math.round((seoCounts.indexed / seoCounts.alle) * 1000) / 10 : 0}%
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>Snapshot</div>
                      <div className="text-slate-300 font-medium">
                        {new Date(seoLatestDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-700/50">
                    <span>Property:</span>
                    <code className="text-slate-300 font-mono">{client.gsc_property}</code>
                  </div>
                </div>

                {/* Sub-Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                  {seoFilters.map((sf) => {
                    const isActive = seoFilter === sf.value
                    const count = sf.value === 'alle' ? seoCounts.alle : sf.value === 'indexed' ? seoCounts.indexed : seoCounts.notIndexed
                    return (
                      <Link
                        key={sf.value}
                        href={`/klant/${id}?tab=seo${sf.value !== 'alle' ? `&seo=${sf.value}` : ''}`}
                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-[#F59E0B] text-[#0F172A]'
                            : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'
                        }`}
                      >
                        {sf.label}
                        <span className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                          isActive ? 'bg-[#0F172A]/20 text-[#0F172A]' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {count}
                        </span>
                      </Link>
                    )
                  })}
                </div>

                {/* URL list */}
                {!seoInspections || seoInspections.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">
                    <p>Geen URLs in deze categorie</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {seoInspections.map((row) => {
                      const indexed = row.verdict === 'PASS'
                      const lastCrawl = row.last_crawl_time
                        ? new Date(row.last_crawl_time).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
                        : null
                      const path = row.url.replace(/^https?:\/\/[^/]+/, '') || '/'
                      return (
                        <div
                          key={row.id}
                          className="bg-[#1E293B] rounded-xl p-4 border border-slate-700/50 hover:border-[#F59E0B]/40 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-white hover:text-[#F59E0B] transition-colors font-mono break-all"
                              >
                                {path}
                              </a>
                              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                                {row.coverage_state && <span>{row.coverage_state}</span>}
                                {lastCrawl && (
                                  <>
                                    <span>·</span>
                                    <span>laatst gecrawld {lastCrawl}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {indexed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  Geïndexeerd
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                  Niet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Services */}
        {activeTab === 'services' && (
          <ServicesSection
            clientId={id}
            initialServices={(clientServices || []) as ClientService[]}
          />
        )}

        {/* Tab: Blogs */}
        {activeTab === 'blogs' && (
          <>
            {!blogPosts || blogPosts.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                </svg>
                <p>Geen blog posts gevonden voor deze klant</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blogPosts.map((blog) => {
                  const date = new Date(
                    blog.published_at || blog.created_at
                  ).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  const excerptPreview = blog.excerpt
                    ? blog.excerpt.slice(0, 150) + (blog.excerpt.length > 150 ? '...' : '')
                    : ''

                  return (
                    <Link key={blog.id} href={`/blogs/${blog.id}`}>
                      <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 hover:border-[#F59E0B]/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer group">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-white group-hover:text-[#F59E0B] transition-colors line-clamp-2 flex-1">
                            {blog.title}
                          </h3>
                          <div className="shrink-0 flex items-center gap-2">
                            {blog.published ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Gepubliceerd
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/70 text-slate-400 border border-slate-600">
                                Concept
                              </span>
                            )}
                            <svg className="w-4 h-4 text-slate-600 group-hover:text-[#F59E0B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>

                        {excerptPreview && (
                          <p className="text-slate-400 text-sm line-clamp-2 mb-3">{excerptPreview}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{date}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Tab: Contacten */}
        {activeTab === 'contacten' && (
          <>
            {!contactSubmissions || contactSubmissions.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <p>Geen contact aanvragen gevonden voor deze klant</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactSubmissions.map((submission) => {
                  const date = new Date(submission.created_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                  const time = new Date(submission.created_at).toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const berichtPreview = submission.bericht
                    ? submission.bericht.slice(0, 200) + (submission.bericht.length > 200 ? '...' : '')
                    : ''

                  return (
                    <div
                      key={submission.id}
                      className={`bg-[#1E293B] rounded-2xl p-5 border transition-all duration-200 ${
                        !submission.gelezen
                          ? 'border-l-[3px] border-l-amber-500 border-t-slate-700/50 border-r-slate-700/50 border-b-slate-700/50'
                          : 'border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-white text-base">{submission.naam}</h3>
                            {!submission.gelezen && (
                              <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-semibold border border-[#F59E0B]/30">
                                Nieuw
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                            <a
                              href={`mailto:${submission.email}`}
                              className="hover:text-[#F59E0B] transition-colors"
                            >
                              {submission.email}
                            </a>
                            {submission.organisatie && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span>{submission.organisatie}</span>
                              </>
                            )}
                            {submission.telefoon && (
                              <>
                                <span className="text-slate-600">·</span>
                                <a
                                  href={`tel:${submission.telefoon}`}
                                  className="hover:text-[#F59E0B] transition-colors"
                                >
                                  {submission.telefoon}
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-500">{date}</p>
                          <p className="text-xs text-slate-600">{time}</p>
                        </div>
                      </div>

                      {submission.onderwerp && (
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Onderwerp: </span>
                          <span className="text-sm text-slate-300 font-medium">{submission.onderwerp}</span>
                        </div>
                      )}

                      {berichtPreview && (
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">{berichtPreview}</p>
                      )}

                      <div className="flex items-center justify-end pt-2 border-t border-slate-700/50">
                        <MarkGelezenButton
                          submissionId={submission.id}
                          gelezen={submission.gelezen || false}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
