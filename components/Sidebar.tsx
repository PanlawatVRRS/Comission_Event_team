'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, RefreshCw, History } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'จัดการพนักงาน',
      href: '/employees',
      icon: Users,
    },
    {
      name: 'คำนวณกระทบยอด',
      href: '/reconcile',
      icon: RefreshCw,
    },
    {
      name: 'ประวัติการกระทบยอด',
      href: '/history',
      icon: History,
    },
  ]

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-xl text-white font-bold text-sm">
            ACU
          </div>
          <span className="font-bold text-slate-800 text-lg">Commission App</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}