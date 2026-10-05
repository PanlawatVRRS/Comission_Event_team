'use client'

import { Employee } from '@/lib/supabase'
import { Edit, Trash2, Award, Phone, User } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

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
  const { t } = useLanguage()

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-3.5 w-12 text-center">{t('table.no')}</th>
            <th className="p-3.5">{t('table.userNumber')}</th>
            <th className="p-3.5">{t('table.fullName')}</th>
            <th className="p-3.5">{t('table.nickname')}</th>
            {showContactInfo && <th className="p-3.5">{t('table.phone')}</th>}
            <th className="p-3.5 text-center">{t('table.invites')}</th>
            {(onEdit || onDelete) && <th className="p-3.5 text-right">{t('common.manage')}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {employees.length === 0 ? (
            <tr>
              <td
                colSpan={showContactInfo ? 7 : 6}
                className="p-8 text-center text-slate-400 dark:text-slate-500"
              >
                {t('table.empty')}
              </td>
            </tr>
          ) : (
            employees.map((emp, index) => {
              const phoneNumber = emp.phone_number || emp.phone

              return (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3.5 font-mono text-slate-400 dark:text-slate-500 text-center">
                    {index + 1}
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {emp.user_number}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span>{emp.full_name}</span>
                      {emp.nickname && (
                        <span className="inline-block text-[11px] font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          ({emp.nickname})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                    {emp.nickname ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 rounded-lg font-semibold">
                        <User className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                        {emp.nickname}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  {showContactInfo && (
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {phoneNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {phoneNumber}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>
                  )}
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                      <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {t('common.people', { n: (emp.invitation_success || 0).toLocaleString() })}
                    </span>
                  </td>
                  {(onEdit || onDelete) && (
                    <td className="p-3.5 text-right space-x-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(emp)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(emp.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title={t('common.delete')}
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