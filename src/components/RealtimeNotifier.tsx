'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ContentItem } from '@/types'

type Toast = {
  id: string
  title: string
  client_id: string
  service: string | null
  status: ContentItem['status']
  kind: 'insert' | 'update'
}

const TOAST_TTL_MS = 8000

export default function RealtimeNotifier() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('realtime:content_items')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'content_items' },
        (payload) => {
          const item = payload.new as ContentItem
          const toast: Toast = {
            id: item.id,
            title: item.title,
            client_id: item.client_id,
            service: item.service,
            status: item.status,
            kind: 'insert',
          }
          setToasts((prev) => [...prev.filter((t) => t.id !== toast.id), toast])
          window.setTimeout(() => dismiss(toast.id), TOAST_TTL_MS)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'content_items' },
        (payload) => {
          const newRow = payload.new as ContentItem
          const oldRow = payload.old as Partial<ContentItem>
          // Only notify on status transitions, not on every field edit
          if (oldRow.status === newRow.status) return
          const toast: Toast = {
            id: `${newRow.id}-${newRow.status}`,
            title: newRow.title,
            client_id: newRow.client_id,
            service: newRow.service,
            status: newRow.status,
            kind: 'update',
          }
          setToasts((prev) => [...prev.filter((t) => t.id !== toast.id), toast])
          window.setTimeout(() => dismiss(toast.id), TOAST_TTL_MS)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dismiss])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <Link
          key={t.id}
          href={`/review/${t.kind === 'update' ? t.id.split('-')[0] : t.id}`}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto block bg-[#1E293B] border border-[#F59E0B]/40 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 hover:border-[#F59E0B] transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
              {t.kind === 'insert' ? (
                <svg className="w-4 h-4 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wide mb-0.5">
                {t.kind === 'insert' ? 'Nieuwe content' : `Status → ${t.status}`}
              </p>
              <p className="text-sm text-white font-medium line-clamp-2">{t.title}</p>
              {t.service && (
                <p className="text-xs text-slate-400 mt-1">{t.service}</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                dismiss(t.id)
              }}
              className="text-slate-500 hover:text-white shrink-0"
              aria-label="Sluiten"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </Link>
      ))}
    </div>
  )
}
