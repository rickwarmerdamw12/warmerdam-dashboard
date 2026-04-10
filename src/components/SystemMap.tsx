'use client'

import { useState, useCallback } from 'react'
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
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemNodeData {
  label: string
  subtitle: string
  icon: string
  accentColor: string
  bgColor: string
  borderColor: string
  items?: string[]
  badge?: string
  detail?: NodeDetail
  [key: string]: unknown
}

interface DetailSection {
  title: string
  items: string[]
}

interface NodeDetail {
  heading: string
  description: string
  sections: DetailSection[]
  footer?: string
  tag?: string
  tagColor?: string
}

// ─── Custom node ──────────────────────────────────────────────────────────────

function SystemNode({ data }: NodeProps) {
  const d = data as SystemNodeData
  const hasDetail = !!d.detail
  return (
    <div
      className={`rounded-xl border shadow-lg min-w-[210px] max-w-[240px] ${d.borderColor} ${d.bgColor} transition-all duration-150 ${hasDetail ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-offset-transparent' : ''}`}
      style={hasDetail ? ({ backdropFilter: 'blur(8px)', '--tw-ring-color': d.accentColor } as React.CSSProperties) : { backdropFilter: 'blur(8px)' }}
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

      {hasDetail && (
        <div className="px-4 pb-3 pt-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Klik voor volledige uitleg
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function NodeDetailPanel({
  nodeData,
  onClose,
}: {
  nodeData: SystemNodeData
  onClose: () => void
}) {
  const d = nodeData.detail!
  return (
    <div className="absolute top-0 right-0 bottom-0 z-20 flex flex-col w-[380px] max-w-[90vw] bg-[#0D1423] border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Panel header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 flex-shrink-0"
        style={{ borderBottomColor: `${nodeData.accentColor}33` }}
      >
        <span className="text-2xl">{nodeData.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-base leading-tight">{nodeData.label}</h2>
            {d.tag && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${d.tagColor ?? nodeData.accentColor}22`, color: d.tagColor ?? nodeData.accentColor, border: `1px solid ${d.tagColor ?? nodeData.accentColor}44` }}
              >
                {d.tag}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{nodeData.subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed">{d.description}</p>

        {/* Sections */}
        {d.sections.map((section, i) => (
          <div key={i}>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: nodeData.accentColor }}
            >
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-300 leading-snug">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: nodeData.accentColor }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Footer note */}
        {d.footer && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-400 leading-relaxed">{d.footer}</p>
          </div>
        )}
      </div>
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
  // ─── Externe tools ────────────────────────────────────────────────────────
  {
    id: 'ai-website-cloner',
    type: 'system',
    position: { x: -120, y: 300 },
    data: {
      label: 'AI Website Cloner',
      subtitle: 'Next.js reverse-engineer tool',
      icon: '🌐',
      accentColor: '#A855F7',
      bgColor: 'bg-[#160D20]',
      borderColor: 'border-purple-800/60',
      badge: 'GitHub',
      items: [
        '/clone-website <url> → volledige clone',
        'Multi-fase pipeline: recon → specs → build',
        'Parallel agents per component',
        'Next.js 16 + shadcn/ui output',
      ],
      detail: {
        heading: 'AI Website Cloner Template',
        tag: 'MIT · 9.5k ★',
        tagColor: '#A855F7',
        description:
          'Open-source template om elke website met één commando te reverse-engineeren naar een schone, moderne Next.js codebase. Aanbevolen met Claude Code + Opus 4.6. Handig voor platform-migraties, verloren broncode terugkrijgen of leren van productie-sites.',
        sections: [
          {
            title: 'Quick Start',
            items: [
              'git clone https://github.com/JCodesMore/ai-website-cloner-template.git my-clone',
              'cd my-clone && npm install',
              'Start agent: claude --chrome',
              'Run skill: /clone-website <target-url>',
              'Optioneel: daarna handmatig aanpassen naar wens',
            ],
          },
          {
            title: 'Hoe het werkt — 5-fase pipeline',
            items: [
              '① Reconnaissance — screenshots, design tokens, interactie-sweep (scroll, klik, hover, responsive)',
              '② Foundation — fonts, kleuren, globals updaten + alle assets downloaden',
              '③ Component Specs — gedetailleerde spec-bestanden in docs/research/components/ met exacte getComputedStyle() waarden, states en content',
              '④ Parallel Build — builder agents in git worktrees, één per sectie/component tegelijk',
              '⑤ Assembly & QA — worktrees samenvoegen, pagina bekabelen, visuele diff vs. origineel',
            ],
          },
          {
            title: 'Tech Stack output',
            items: [
              'Next.js 16 — App Router, React 19, TypeScript strict',
              'shadcn/ui — Radix primitives + Tailwind CSS v4',
              'Tailwind CSS v4 — oklch design tokens',
              'Lucide React — standaard icons, vervangen door geëxtraheerde SVGs',
            ],
          },
          {
            title: 'Gebruik gevallen',
            items: [
              'Platform migratie — WordPress/Webflow/Squarespace → Next.js',
              'Verloren broncode — site live maar repo weg of developer vertrokken',
              'Leren — onderzoek hoe productie-sites layouts/animaties/responsive gedrag bouwen',
            ],
          },
          {
            title: 'Ondersteunde AI agents',
            items: [
              'Claude Code — Aanbevolen (Opus 4.6)',
              'GitHub Copilot, Cursor, Windsurf, Gemini CLI',
              'Cline, Roo Code, Continue, Amazon Q, Augment Code, Aider',
            ],
          },
          {
            title: 'Projectstructuur output',
            items: [
              'src/app/ — Next.js routes',
              'src/components/ — React components + ui/ (shadcn) + icons.tsx',
              'public/images/ & public/videos/ — gedownloade assets van target',
              'docs/research/ — extractie output + component specs',
              'docs/design-references/ — screenshots van origineel',
            ],
          },
          {
            title: 'Niet bedoeld voor',
            items: [
              'Phishing of identiteitsfraude — verboden',
              'Designs van anderen als je eigen werk presenteren',
              'Sites scrapen die dit verbieden in hun ToS — altijd eerst checken',
            ],
          },
        ],
        footer:
          'Repo: github.com/JCodesMore/ai-website-cloner-template · MIT licentie · Vereist Node.js 24+ · Broncode: AGENTS.md (single source of truth voor alle platforms)',
      },
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
  const [selectedNodeData, setSelectedNodeData] = useState<SystemNodeData | null>(null)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const d = node.data as SystemNodeData
    if (d.detail) {
      setSelectedNodeData(d)
    }
  }, [])

  const closePanel = useCallback(() => setSelectedNodeData(null), [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[11px] text-slate-500">ℹ️ node = klikbaar</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
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

      {/* Detail panel — slide in from right */}
      {selectedNodeData && (
        <NodeDetailPanel nodeData={selectedNodeData} onClose={closePanel} />
      )}
    </div>
  )
}
