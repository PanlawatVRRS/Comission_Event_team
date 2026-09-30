'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  onReconcileSuccess?: () => void
}

export default function InviteImportModal({ onReconcileSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    details?: { totalImported: number; uniqueUsers: number }
  }>({ type: null, message: '' })

  const handleUploadAndReconcile = async () => {
    if (!file) return

    setLoading(true)
    setStatus({ type: null, message: '' })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/reconcile/import-invite', {
        method: 'POST',
        body: formData,
      })

      const responseText = await res.text()
      let data: any = {}

      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error(
          `เซิร์ฟเวอร์ตอบกลับไม่ใช่ JSON (HTTP ${res.status}): ${
            res.status === 404
              ? 'ไม่พบเส้นทาง API (404 Not Found)'
              : responseText.slice(0, 150)
          }`
        )
      }

      if (res.ok) {
        setStatus({
          type: 'success',
          message: 'คำนวณและกระทบยอดข้อมูลเรียบร้อยแล้ว!',
          details: {
            totalImported: data.totalImported,
            uniqueUsers: data.uniqueUsers,
          },
        })
        
        onReconcileSuccess?.()
      } else {
        setStatus({
          type: 'error',
          message: data.error || `เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์ (HTTP ${res.status})`,
        })
      }
    } catch (err: any) {
      console.error('Upload Error Details:', err)
      setStatus({
        type: 'error',
        message: err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">นำเข้าไฟล์ Data of Invite</h2>
          <p className="text-xs text-slate-500">อัปโหลดไฟล์เพื่อคำนวณนับยอดเชิญเพื่อนกระทบเข้า Daily Commission</p>
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          id="invite-file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="invite-file" className="cursor-pointer space-y-2 block">
          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-medium text-slate-700">
            {file ? file.name : 'คลิกเพื่อเลือกไฟล์ Excel / CSV (data of invite)'}
          </p>
          <p className="text-xs text-slate-400">รองรับไฟล์ .xlsx, .xls, .csv</p>
        </label>
      </div>

      {status.type === 'success' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{status.message}</p>
            {status.details && (
              <p className="text-xs text-emerald-700 mt-1">
                ประมวลผลทั้งหมด {status.details.totalImported.toLocaleString()} รายการ (แมตช์พนักงาน {status.details.uniqueUsers} คน)
              </p>
            )}
          </div>
        </div>
      )}

      {status.type === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">ข้อผิดพลาด</p>
            <p className="text-xs text-rose-700 mt-0.5 whitespace-pre-wrap">{status.message}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleUploadAndReconcile}
        disabled={!file || loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 flex justify-center items-center gap-2 transition-colors text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            กำลังอ่านไฟล์และคำนวณกระทบยอด...
          </>
        ) : (
          'นำเข้าและคำนวณกระทบยอด'
        )}
      </button>
    </div>
  )
}