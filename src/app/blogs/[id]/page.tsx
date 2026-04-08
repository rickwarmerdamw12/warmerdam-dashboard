import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blog } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!blog) notFound()

  const createdDate = new Date(blog.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const publishedDate = blog.published_at
    ? new Date(blog.published_at).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header backHref="/blogs" backLabel="Blogs" />

      <main className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {/* Back button */}
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug naar blogs
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {blog.published ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Gepubliceerd
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Concept
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight mb-3">{blog.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
            <span>Aangemaakt: {createdDate}</span>
            {publishedDate && (
              <>
                <span>·</span>
                <span className="text-emerald-400">Gepubliceerd: {publishedDate}</span>
              </>
            )}
          </div>
        </div>

        {/* Excerpt */}
        {blog.excerpt && (
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 mb-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Samenvatting</p>
            <p className="text-slate-300 text-sm leading-relaxed italic">{blog.excerpt}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Inhoud</p>
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap">
            {blog.content || (
              <span className="text-slate-500 italic">Geen inhoud beschikbaar.</span>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
