import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import MarkGelezenButton from './MarkGelezenButton'

export default async function ContactSubmissionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: submissions, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  const unreadCount = (submissions || []).filter((s) => !s.gelezen).length

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header backHref="/dashboard" backLabel="Dashboard" title="Contact aanvragen" />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Contact aanvragen</h1>
            <p className="text-slate-400 text-sm mt-1">
              {unreadCount > 0
                ? `${unreadCount} ongelezen bericht${unreadCount !== 1 ? 'en' : ''}`
                : 'Alle berichten gelezen'}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-sm font-semibold border border-[#F59E0B]/30">
              {unreadCount} nieuw
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            Fout bij het laden: {error.message}
          </div>
        )}

        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <p>Geen contact aanvragen gevonden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => {
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
                      ? 'border-l-[3px] border-l-[#F59E0B] border-t-slate-700/50 border-r-slate-700/50 border-b-slate-700/50'
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
      </main>
    </div>
  )
}
