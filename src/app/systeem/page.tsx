import BottomNav from '@/components/BottomNav'
import SystemMapLoader from '@/components/SystemMapLoader'

export default function SysteemPage() {
  return (
    <div className="bg-[#0F172A]" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-800 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Systeem overzicht</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Interactieve kaart van alle automatiseringen &amp; tools · drag, zoom &amp; pan
        </p>
      </div>

      {/* Map canvas — expliciete hoogte zodat ReactFlow iets heeft om op te renderen */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SystemMapLoader />
      </div>

      <BottomNav active="systeem" />
    </div>
  )
}
