import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'

export default async function BlogsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blogs, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  const allBlogs = blogs || []
  const totalBlogs = allBlogs.length
  const publishedBlogs = allBlogs.filter((b) => b.published).length
  const conceptBlogs = totalBlogs - publishedBlogs

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header backHref="/dashboard" backLabel="Dashboard" title="Blog posts" />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Blog posts</h1>
          <p className="text-slate-400 text-sm mt-1">Overzicht van alle blog artikelen</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50 text-center">
            <p className="text-2xl font-bold text-white">{totalBlogs}</p>
            <p className="text-slate-500 text-xs mt-1">Totaal</p>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50 text-center">
            <p className="text-2xl font-bold text-emerald-400">{publishedBlogs}</p>
            <p className="text-slate-500 text-xs mt-1">Gepubliceerd</p>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50 text-center">
            <p className="text-2xl font-bold text-amber-400">{conceptBlogs}</p>
            <p className="text-slate-500 text-xs mt-1">Concept</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            Fout bij het laden: {error.message}
          </div>
        )}

        {allBlogs.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            <p>Geen blog posts gevonden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allBlogs.map((blog) => {
              const date = new Date(blog.created_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              const publishedDate = blog.published_at
                ? new Date(blog.published_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : null
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
                      <span>Aangemaakt: {date}</span>
                      {publishedDate && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400">Gepubliceerd: {publishedDate}</span>
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
