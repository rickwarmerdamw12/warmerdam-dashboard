'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BackgroundVariant,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ─── Custom node types ───────────────────────────────────────────────────────

interface SystemNodeData {
  label: string
  subtitle: string
  icon: string
  accentColor: string
  bgColor: string
  borderColor: string
  items?: string[]
  badge?: string
  [key: string]: unknown
}

function SystemNode({ data }: NodeProps) {
  const d = data as SystemNodeData
  return (
    <div
      className={`rounded-xl border shadow-lg min-w-[210px] max-w-[240px] ${d.borderColor} ${d.bgColor}`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />

      {/* Header */}
      <div className={`flex items-center gap-3 px-4 pt-4 pb-3 border-b ${d.borderColor}`}>
        <span className="text-2xl flex-shrink-0">{d.icon}</span>
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm leading-tight">{d.label}</p>
          <p className="text-xs text-slate-400 leading-tight mt-0.5">{d.subtitle}</p>
        </div>
        {d.badge && (
          <span
            className="ml-auto flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: `${d.accentColor}22`, color: d.accentColor, border: `1px solid ${d.accentColor}44` }}
          >
            {d.badge}
          </span>
        )}
      </div>

      {/* Items */}
      {d.items && d.items.length > 0 && (
        <ul className="px-4 py-3 space-y-1.5">
          {d.items.map((item: string, i: number) => (
            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                style={{ background: d.accentColor }}
              />
              {item}
            </li>
          ))}
        </ul>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />
    </div>
  )
}

// ─── Node definitions ────────────────────────────────────────────────────────

const NODES_INIT = [
  {
    id: 'n8n',
    type: 'system',
    position: { x: 480, y: 40 },
    data: {
      label: 'n8n',
      subtitle: 'Orchestrator & Scheduler',
      icon: '⚙️',
      accentColor: '#7C3AED',
      bgColor: 'bg-[#1E1433]',
      borderColor: 'border-violet-800/60',
      badge: 'Docker',
      items: [
        'Cron: 1e maandag 09:00',
        'Manual trigger mogelijk',
        'Blog Generatie - Main workflow',
        '7 nodes: Schedule → Supabase → Bridge → IF',
      ],
    },
  },
  {
    id: 'bridge',
    type: 'system',
    position: { x: 160, y: 300 },
    data: {
      label: 'Clausie Bridge',
      subtitle: 'FastAPI op :8787',
      icon: '🌉',
      accentColor: '#3B82F6',
      bgColor: 'bg-[#0F1B2D]',
      borderColor: 'border-blue-800/60',
      badge: 'Python',
      items: [
        'POST /generate-blog',
        'GET /healthz',
        'Semaphore(3) — max 3 parallel',
        'agent_server.py + venv Python 3.13',
      ],
    },
  },
  {
    id: 'claude',
    type: 'system',
    position: { x: 160, y: 560 },
    data: {
      label: 'Claude CLI',
      subtitle: 'AI content generatie',
      icon: '🤖',
      accentColor: '#F59E0B',
      bgColor: 'bg-[#1C1608]',
      borderColor: 'border-amber-800/60',
      badge: 'claude -p',
      items: [
        'Subprocess per klant (non-interactive)',
        'Leest klantbriefing + eerdere blogs',
        '800–1200 woorden NL blog',
        'Failure dumps: clausie-fail-{id}-{ts}.log',
      ],
    },
  },
  {
    id: 'knowledge',
    type: 'system',
    position: { x: -120, y: 560 },
    data: {
      label: 'Knowledge Base',
      subtitle: '~/warmerdam/knowledge/',
      icon: '📚',
      accentColor: '#EAB308',
      bgColor: 'bg-[#1A1700]',
      borderColor: 'border-yellow-800/60',
      items: [
        'copywriting_secrets.md',
        '20 Robin Timmers principes',
        'hormozi_100m_offers.md',
        'Offer & value framing',
      ],
    },
  },
  {
    id: 'supabase',
    type: 'system',
    position: { x: 800, y: 300 },
    data: {
      label: 'Supabase',
      subtitle: 'PostgreSQL + Realtime',
      icon: '🗄️',
      accentColor: '#10B981',
      bgColor: 'bg-[#071A12]',
      borderColor: 'border-emerald-800/60',
      badge: 'bijcfyop…',
      items: [
        'clients (briefing, brand voice, keywords)',
        'content_items (blogs, status, service)',
        'client_services (retainer koppelingen)',
        'Realtime pub aan op beide tabellen',
      ],
    },
  },
  {
    id: 'dashboard',
    type: 'system',
    position: { x: 800, y: 560 },
    data: {
      label: 'Dashboard',
      subtitle: 'Next.js 16 · Vercel',
      icon: '🖥️',
      accentColor: '#64748B',
      bgColor: 'bg-[#101418]',
      borderColor: 'border-slate-700/60',
      badge: 'React 19',
      items: [
        '/dashboard /klant/[id] /kanban /review',
        'Realtime toasts bij nieuwe content',
        '@supabase/ssr + RLS policies',
        'warmerdam-dashboard.vercel.app',
      ],
    },
  },
  {
    id: 'clients',
    type: 'system',
    position: { x: 480, y: 560 },
    data: {
      label: 'Retainerklanten',
      subtitle: 'Actieve klanten (3)',
      icon: '🏢',
      accentColor: '#0D9488',
      bgColor: 'bg-[#071A18]',
      borderColor: 'border-teal-800/60',
      items: [
        'Synergy Builders',
        'TAAI-consult',
        '[TEST] Bakkerij de Goudkorst',
      ],
    },
  },
]

// ─── Edge definitions ────────────────────────────────────────────────────────

const edgeStyle = {
  stroke: '#475569',
  strokeWidth: 1.5,
}
const labelStyle = {
  fontSize: '10px',
  fill: '#94A3B8',
}

const EDGES_INIT = [
  {
    id: 'n8n-supabase',
    source: 'n8n',
    target: 'supabase',
    label: 'GET clients (met services join)',
    labelStyle,
    style: { ...edgeStyle, stroke: '#10B981', strokeDasharray: '4 3' },
    animated: false,
    type: 'smoothstep',
  },
  {
    id: 'n8n-bridge',
    source: 'n8n',
    target: 'bridge',
    label: 'POST /generate-blog per klant',
    labelStyle,
    style: { ...edgeStyle, stroke: '#3B82F6' },
    animated: true,
    type: 'smoothstep',
  },
  {
    id: 'bridge-claude',
    source: 'bridge',
    target: 'claude',
    label: 'subprocess spawn',
    labelStyle,
    style: { ...edgeStyle, stroke: '#F59E0B' },
    animated: true,
    type: 'smoothstep',
  },
  {
    id: 'claude-supabase',
    source: 'claude',
    target: 'supabase',
    label: 'INSERT content_items (status=concept)',
    labelStyle,
    style: { ...edgeStyle, stroke: '#10B981' },
    animated: true,
    type: 'smoothstep',
  },
  {
    id: 'claude-knowledge',
    source: 'claude',
    target: 'knowledge',
    label: 'leest kennisbank',
    labelStyle,
    style: { ...edgeStyle, stroke: '#EAB308', strokeDasharray: '4 3' },
    animated: false,
    type: 'smoothstep',
  },
  {
    id: 'supabase-dashboard',
    source: 'supabase',
    target: 'dashboard',
    label: 'Realtime subscription',
    labelStyle,
    style: { ...edgeStyle, stroke: '#64748B' },
    animated: true,
    type: 'smoothstep',
  },
  {
    id: 'dashboard-supabase',
    source: 'dashboard',
    target: 'supabase',
    label: 'REST queries',
    labelStyle,
    style: { ...edgeStyle, stroke: '#475569', strokeDasharray: '4 3' },
    animated: false,
    type: 'smoothstep',
  },
  {
    id: 'clients-supabase',
    source: 'clients',
    target: 'supabase',
    label: 'klantdata opgeslagen',
    labelStyle,
    style: { ...edgeStyle, stroke: '#0D9488', strokeDasharray: '4 3' },
    animated: false,
    type: 'smoothstep',
  },
]

// ─── Legend ──────────────────────────────────────────────────────────────────

const LEGEND = [
  { color: '#3B82F6', label: 'Actieve flow (animated)' },
  { color: '#475569', label: 'Passieve relatie (dashed)' },
]

// ─── Main component ──────────────────────────────────────────────────────────

const nodeTypes = { system: SystemNode }

export default function SystemMap() {
  const [nodes, , onNodesChange] = useNodesState(NODES_INIT as Parameters<typeof useNodesState>[0])
  const [edges, , onEdgesChange] = useEdgesState(EDGES_INIT)

  return (
    <div className="w-full h-full relative">
      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-[#0F172A]/90 border border-slate-800 rounded-xl px-4 py-3 space-y-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Legenda</p>
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-6 h-0.5 flex-shrink-0 rounded" style={{ background: l.color }} />
            <span className="text-[11px] text-slate-400">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 flex-shrink-0 rounded border-t border-dashed border-slate-500" style={{ background: 'transparent', borderTopWidth: '1.5px' }} />
          <span className="text-[11px] text-slate-400">Dashed = passief / query</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1E293B" gap={24} size={1} />
        <Controls
          className="!bg-[#1E293B] !border-slate-700 !rounded-xl"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as SystemNodeData
            return d?.accentColor ?? '#475569'
          }}
          maskColor="rgba(15,23,42,0.7)"
          style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
        />
      </ReactFlow>
    </div>
  )
}
