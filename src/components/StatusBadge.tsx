import { ContentStatus } from '@/types'

const statusConfig: Record<ContentStatus, { label: string; className: string }> = {
  concept: {
    label: 'Concept',
    className: 'bg-slate-700 text-slate-300',
  },
  in_review: {
    label: 'In review',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
  goedgekeurd: {
    label: 'Goedgekeurd',
    className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  gepubliceerd: {
    label: 'Gepubliceerd',
    className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  },
}

export default function StatusBadge({ status }: { status: ContentStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
