'use client'

import { useEffect, useState } from 'react'
import { supabase, Employee } from '@/lib/supabase'
import MetricCard from '@/components/MetricCard'
import CommissionTable from '@/components/CommissionTable'
import { useLanguage } from '@/lib/i18n'
import { Users, Award, TrendingUp, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('invitation_success', { ascending: false })

    if (!error && data) {
      setEmployees(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const totalEmployees = employees.length
  const totalInvites = employees.reduce(
    (acc, curr) => acc + (curr.invitation_success || 0),
    0
  )

  const topEmp = employees[0]
  const topPerformer = topEmp
    ? `${topEmp.full_name}${topEmp.nickname ? ` (${topEmp.nickname})` : ''}`
    : '-'

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 shadow-2xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
          {t('dashboard.refreshData')}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title={t('dashboard.totalEmployees')}
          value={t('common.people', { n: totalEmployees })}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title={t('dashboard.totalInvites')}
          value={t('common.items', { n: totalInvites.toLocaleString() })}
          icon={Award}
          color="emerald"
        />
        <MetricCard
          title={t('dashboard.top1')}
          value={topPerformer}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Commission Table Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('dashboard.tableTitle')}
        </h2>
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            {t('dashboard.loading')}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <CommissionTable employees={employees} showContactInfo={false} />
          </div>
        )}
      </div>
    </div>
  )
}