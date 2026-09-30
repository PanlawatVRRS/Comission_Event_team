'use client'

import { useEffect, useState } from 'react'
import { supabase, ReconciliationLog } from '@/lib/supabase'
import { History, FileSpreadsheet, Calendar, CheckCircle2, RefreshCw } from 'lucide-react'

export default function InviteRecordsPage() {
  const [logs, setLogs] = useState<ReconciliationLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reconciliation_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setLogs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            ประวัติการนำเข้าและกระทบยอดรายวัน
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            รายการบันทึกประวัติการกระทบยอดไฟล์ Data of Invite ย้อนหลัง
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">วันที่ทำรายการ</th>
              <th className="p-4">ชื่อไฟล์ที่อัปโหลด</th>
              <th className="p-4 text-center">รายการทั้งหมดในไฟล์</th>
              <th className="p-4 text-center text-emerald-600">พนักงานที่แมตช์ได้</th>
              <th className="p-4 text-right">เวลาประมวลผล</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  กำลังโหลดข้อมูลประวัติ...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  ยังไม่มีประวัติการทำรายการกระทบยอด
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(log.reconcile_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-500 shrink-0" />
                      {log.file_name}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-700 font-semibold">
                    {log.total_records.toLocaleString()} รายการ
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {log.matched_users.toLocaleString()} คน
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} น.
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}