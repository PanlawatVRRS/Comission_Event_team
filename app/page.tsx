'use client'

import { useEffect, useState } from 'react'
import { supabase, Employee } from '@/lib/supabase'
import MetricCard from '@/components/MetricCard'
import CommissionTable from '@/components/CommissionTable'
import { Users, Award, TrendingUp, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
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

  // จัดรูปแบบชื่อพนักงานอันดับ 1 ให้แสดงชื่อเล่นด้วย
  const topEmp = employees[0]
  const topPerformer = topEmp
    ? `${topEmp.full_name}${topEmp.nickname ? ` (${topEmp.nickname})` : ''}`
    : '-'

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">แดชบอร์ดสรุปผล (Dashboard)</h1>
          <p className="text-xs text-slate-500 mt-1">
            สรุปข้อมูลจำนวนพนักงาน ยอดการเชิญเพื่อน และลำดับพนักงานตามคอมมิชชั่น
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรชข้อมูล
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="จำนวนพนักงานทั้งหมด"
          value={`${totalEmployees} คน`}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="รวมยอดเชิญเพื่อนสำเร็จ"
          value={`${totalInvites.toLocaleString()} รายการ`}
          icon={Award}
          color="emerald"
        />
        <MetricCard
          title="พนักงานอันดับ #1"
          value={topPerformer}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">
          ตารางสรุป Daily Commission พนักงาน
        </h2>
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <CommissionTable employees={employees} showContactInfo={false} />
        )}
      </div>
    </div>
  )
}