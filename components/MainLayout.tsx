'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navbar */}
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* เนื้อหาหลัก ขยับระยะซ้ายอัตโนมัติตามสถานะ Sidebar */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {children}
      </main>
    </div>
  )
}