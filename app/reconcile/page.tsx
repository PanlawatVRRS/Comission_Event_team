'use client'

import { useState } from 'react'
import InviteImportModal from '@/components/InviteImportModal'
import { CheckCircle } from 'lucide-react'

export default function ReconcilePage() {
  const [reconciled, setReconciled] = useState(false)

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ระบบคำนวณกระทบยอด (Reconciliation)</h1>
        <p className="text-xs text-slate-500 mt-1">
          อัปโหลดไฟล์ data of invite เพื่อนำ User number (Col A) ไปนับกระทบยอดเข้า daily commission (Col E)
        </p>
      </div>

      <InviteImportModal onReconcileSuccess={() => setReconciled(true)} />

      {reconciled && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm max-w-xl mx-auto">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>กระทบยอดสำเร็จ! คุณสามารถกลับไปตรวจสอบผลลัพธ์ที่หน้า Dashboard ได้แล้ว</span>
        </div>
      )}
    </div>
  )
}