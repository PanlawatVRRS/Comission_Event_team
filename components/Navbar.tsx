'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Layers,
  RefreshCw,
  History,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Database,
  Settings,
  Globe,
  X,
  Check,
  Sun,
  Moon,
} from 'lucide-react'

interface NavbarProps {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

export default function Navbar({ isCollapsed, setIsCollapsed }: NavbarProps) {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [language, setLanguage] = useState<'th' | 'en'>('th')
  const [isDarkMode, setIsDarkMode] = useState(false)

  // จัดการสถานะ Dark Mode (เช็กค่าจาก class บน HTML หรือ LocalStorage)
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }

  const navItems = [
    { name: language === 'th' ? 'แดชบอร์ด' : 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: language === 'th' ? 'จัดการพนักงาน' : 'Employees', href: '/employees', icon: Users },
    { name: language === 'th' ? 'กระดานรายวัน' : 'Daily Board', href: '/daily-board', icon: Layers },
    { name: language === 'th' ? 'กระทบยอด (Reconcile)' : 'Reconcile', href: '/reconcile', icon: RefreshCw },
    { name: language === 'th' ? 'ประวัติกระทบยอดรายวัน' : 'Invite History', href: '/invite-records', icon: History },
    { name: 'Database Status', href: '/database-status', icon: Database },
  ]

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col justify-between p-3 shadow-xs ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="space-y-6">
          {/* Header & Toggle Button */}
          <div className="flex items-center justify-between px-1 py-1">
            <Link href="/" className="flex items-center gap-3 overflow-hidden group">
              <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-xl text-white group-hover:bg-blue-700 transition-colors shadow-xs shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap transition-opacity duration-200">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-base block leading-tight">
                    ACU Commission
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Manager System
                  </span>
                </div>
              )}
            </Link>

            {/* ปุ่มพับ/ขยายแถบข้าง */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title={isCollapsed ? 'ขยายแถบข้าง' : 'พับเก็บแถบข้าง'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick Theme Toggle Button (แสดงเมื่อไม่พับแถบข้าง) */}
          {!isCollapsed && (
            <div className="px-1">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  {isDarkMode ? (language === 'th' ? 'โหมดมืด (Dark)' : 'Dark Mode') : (language === 'th' ? 'โหมดสว่าง (Light)' : 'Light Mode')}
                </span>
                <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
                  Switch
                </span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 whitespace-nowrap">
                {language === 'th' ? 'เมนูหลัก' : 'Main Menu'}
              </p>
            )}
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.name}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Footer & Setting Button */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsSettingsOpen(true)}
            title={isCollapsed ? (language === 'th' ? 'ตั้งค่าระบบ' : 'Settings') : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                {language === 'th' ? 'ตั้งค่าระบบ' : 'Settings'}
              </span>
            )}
          </button>

          {!isCollapsed && (
            <div className="text-center px-2">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">ACU Pay IT Department</p>
            </div>
          )}
        </div>
      </aside>

      {/* Settings Modal (รวมสลับ Dark/Light Mode และเปลี่ยนภาษา) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {language === 'th' ? 'ตั้งค่าระบบ (System Settings)' : 'System Settings'}
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* ตั้งค่า Theme (Dark / Light Mode) ใน Modal */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  {language === 'th' ? 'รูปแบบการแสดงผล (Theme)' : 'Theme Mode'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDarkMode) toggleDarkMode()
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      !isDarkMode
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" /> Light
                    </span>
                    {!isDarkMode && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isDarkMode) toggleDarkMode()
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isDarkMode
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400" /> Dark
                    </span>
                    {isDarkMode && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </button>
                </div>
              </div>

              {/* ตั้งค่าภาษาใน Modal */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {language === 'th' ? 'เลือกภาษา (Language)' : 'Select Language'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('th')}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      language === 'th'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>ภาษาไทย (Thai)</span>
                    {language === 'th' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      language === 'en'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors"
              >
                {language === 'th' ? 'บันทึก / ปิด' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}