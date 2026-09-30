'use client'

import { Employee } from '@/lib/supabase'
import { Edit, Trash2, Award, Phone, User } from 'lucide-react'

interface Props {
  employees: Employee[]
  onEdit?: (employee: Employee) => void
  onDelete?: (id: string) => void
  showContactInfo?: boolean // สวิตช์เปิด/ปิดการแสดงเบอร์โทร (เปิดในหน้า Employees)
}

export default function CommissionTable({
  employees,
  onEdit,
  onDelete,
  showContactInfo = true,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
          <tr>
            <th className="p-3.5 w-12 text-center">ลำดับ</th>
            <th className="p-3.5">User Number</th>
            <th className="p-3.5">ชื่อ-นามสกุล</th>
            <th className="p-3.5">ชื่อเล่น</th>
            {showContactInfo && <th className="p-3.5">เบอร์โทรศัพท์</th>}
            <th className="p-3.5 text-center">ยอดเชิญเพื่อนสำเร็จ</th>
            {(onEdit || onDelete) && <th className="p-3.5 text-right">จัดการ</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.length === 0 ? (
            <tr>
              <td colSpan={showContactInfo ? 7 : 6} className="p-8 text-center text-slate-400">
                ยังไม่มีข้อมูลพนักงาน
              </td>
            </tr>
          ) : (
            employees.map((emp, index) => {
              const phoneNumber = emp.phone_number || emp.phone

              return (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400 text-center">{index + 1}</td>
                  <td className="p-3.5 font-mono font-semibold text-blue-600">
                    {emp.user_number}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>{emp.full_name}</span>
                      {emp.nickname && (
                        <span className="inline-block text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          ({emp.nickname})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-700">
                    {emp.nickname ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-semibold">
                        <User className="w-3 h-3 text-blue-500" />
                        {emp.nickname}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  {showContactInfo && (
                    <td className="p-3.5 font-mono text-slate-600">
                      {phoneNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {phoneNumber}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  )}
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      {emp.invitation_success.toLocaleString()} คน
                    </span>
                  </td>
                  {(onEdit || onDelete) && (
                    <td className="p-3.5 text-right space-x-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(emp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(emp.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}