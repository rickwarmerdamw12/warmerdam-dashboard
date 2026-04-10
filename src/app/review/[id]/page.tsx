import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import StatusBadge from '@/components/StatusBadge'
import ReviewActions from './ReviewActions'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) notFound()

  const { data: client } = await supabase
    .from('clients')
    .select('naam, telegram_chat_id')
    .eq('id', item.client_id)
    .single()

  // Revisiegeschiedenis ophalen (alleen voor LinkedIn posts met linkedin_input_id)
  let revisionHistory = null
  if (item.service === 'linkedin_post' && item.linkedin_input_id) {
    const { data: revisions } = await supabase
      .from('content_items')
      .select('id, title, status, created_at, revision_feedback')
      .eq('linkedin_input_id', item.linkedin_input_id)
      .eq('service', 'linkedin_post')
      .order('created_at', { ascending: false })
    revisionHistory = revisions
  }

  const createdDate = new Date(item.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header backHref={`/klant/${item.client_id}`} backLabel={client?.naam || 'Terug'} />

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28">
        {/* Header info */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StatusBadge status={item.status} />
                {item.service && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                    {item.service}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white mt-2 leading-tight">{item.title}</h1>
              <p className="text-slate-500 text-sm mt-1">{createdDate} · {client?.naam}</p>
            </div>
          </div>
        </div>

        {/* Meta info */}
        {(item.meta_description || (item.keywords_used && item.keywords_used.length > 0)) && (
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 mb-5 space-y-3">
            {item.meta_description && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Meta beschrijving</p>
                <p className="text-slate-300 text-sm">{item.meta_description}</p>
              </div>
            )}
            {item.keywords_used && item.keywords_used.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Zoekwoorden</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.keywords_used.map((kw: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback (if any) */}
        {item.feedback && (
          <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Feedback</p>
            </div>
            <p className="text-orange-200 text-sm">{item.feedback}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 mb-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Inhoud</p>
          <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {item.content}
          </div>
        </div>

        {/* Revisiegeschiedenis (alleen voor LinkedIn) */}
        {revisionHistory && revisionHistory.length > 1 && (
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 mb-6">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Revisiegeschiedenis</p>
            <div className="space-y-2">
              {revisionHistory.map((rev, i) => {
                const isHuidige = rev.id === item.id
                const datum = new Date(rev.created_at).toLocaleDateString('nl-NL', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <div key={rev.id} className={`flex items-start gap-3 p-3 rounded-xl ${isHuidige ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/20' : 'bg-[#0F172A]/50'}`}>
                    <span className="text-xs text-slate-500 shrink-0 mt-0.5 w-16">{i === 0 ? 'Nieuwste' : datum}</span>
                    <div className="flex-1 min-w-0">
                      {isHuidige ? (
                        <span className="text-[#F59E0B] text-xs font-medium">Huidige versie</span>
                      ) : (
                        <a href={`/review/${rev.id}`} className="text-slate-300 text-xs hover:text-white transition-colors line-clamp-1">{rev.title}</a>
                      )}
                      {rev.revision_feedback && (
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 italic">"{rev.revision_feedback}"</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <ReviewActions
          itemId={item.id}
          clientId={item.client_id}
          currentStatus={item.status}
          itemTitle={item.title}
          clientNaam={client?.naam || ''}
          telegramChatId={client?.telegram_chat_id || null}
          isLinkedIn={item.service === 'linkedin_post'}
        />
      </main>
    </div>
  )
}
