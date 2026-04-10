'use client'

import dynamic from 'next/dynamic'

const SystemMap = dynamic(() => import('@/components/SystemMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-slate-500 text-sm">Systeem kaart laden…</div>
    </div>
  ),
})

export default function SystemMapLoader() {
  return <SystemMap />
}
