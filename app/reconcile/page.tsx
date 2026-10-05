'use client'

import { useState } from 'react'
import InviteImportModal from '@/components/InviteImportModal'
import { useLanguage } from '@/lib/i18n'
import { CheckCircle } from 'lucide-react'

export default function ReconcilePage() {
  const { t } = useLanguage()
  const [reconciled, setReconciled] = useState(false)

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {t('reconcile.title')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('reconcile.subtitle')}
        </p>
      </div>

      <InviteImportModal onReconcileSuccess={() => setReconciled(true)} />

      {reconciled && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm max-w-xl mx-auto">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t('reconcile.success')}</span>
        </div>
      )}
    </div>
  )
}