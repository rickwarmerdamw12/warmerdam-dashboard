'use client'

import { useState } from 'react'
import NieuweKlantModal from './NieuweKlantModal'

export default function DashboardClient() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F59E0B] text-[#0F172A] font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all duration-200 shadow-lg shadow-amber-500/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nieuwe klant
      </button>

      {showModal && <NieuweKlantModal onClose={() => setShowModal(false)} />}
    </>
  )
}
