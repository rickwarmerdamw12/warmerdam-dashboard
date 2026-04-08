'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title?: string
  backHref?: string
  backLabel?: string
}

export default function Header({ title, backHref, backLabel }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm mr-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel || 'Terug'}
            </Link>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F59E0B] flex items-center justify-center shadow-sm shadow-amber-500/30">
              <svg className="w-4 h-4 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm hidden sm:block">
              {title || 'Warmerdam Consulting'}
            </span>
          </div>
        </div>

        <nav className="hidden sm:flex items-center gap-1 mr-2">
          <Link href="/contact-submissions" className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 text-sm">
            Contact
          </Link>
          <Link href="/blogs" className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 text-sm">
            Blogs
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span className="hidden sm:block">Uitloggen</span>
        </button>
      </div>
    </header>
  )
}
