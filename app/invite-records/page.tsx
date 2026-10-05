'use client'

import { useEffect, useState } from 'react'
import { supabase, ReconciliationLog } from '@/lib/supabase'
import { useLanguage } from '@/lib/i18n'
import { History, FileSpreadsheet, Calendar, CheckCircle2, RefreshCw } from 'lucide-react'

export default function HistoryPage() {
  const { t, locale } = useLanguage()
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t('history.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('history.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">{t('history.colDate')}</th>
              <th className="p-4">{t('history.colFile')}</th>
              <th className="p-4 text-center">{t('history.colTotal')}</th>
              <th className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                {t('history.colMatched')}
              </th>
              <th className="p-4 text-right">{t('history.colTime')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  {t('history.loading')}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  {t('history.empty')}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      {new Date(log.reconcile_date).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                      {log.file_name}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    {t('common.items', { n: log.total_records.toLocaleString() })}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('common.people', { n: log.matched_users.toLocaleString() })}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-xs text-slate-400 dark:text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    {t('common.timeSuffix')}
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