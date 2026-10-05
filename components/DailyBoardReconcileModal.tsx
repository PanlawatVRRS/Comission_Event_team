'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Employee } from '@/lib/supabase'
import { useLanguage, type TKey } from '@/lib/i18n'
import {
  AlertCircle,
  Check,
  CheckSquare,
  FileSpreadsheet,
  Loader2,
  Search,
  Upload,
  Users,
  X,
} from 'lucide-react'

interface DailyBoardReconcileModalProps {
  isOpen: boolean
  selectedDate: string
  employeesList: Employee[]
  onClose: () => void
  onConfirm: (
    file: File,
    selectedUserIds: string[],
    kpiTargets: Record<string, number>
  ) => Promise<string | null>
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function parseReconcilePreview(
  file: File,
  t: (key: TKey, params?: Record<string, string | number>) => string
): Promise<Record<string, number>> {
  const dataBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(Buffer.from(dataBuffer), { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error(t('board.noSheet'))
  }

  const worksheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })

  if (!rawData || rawData.length <= 1) {
    throw new Error(t('board.emptyFile'))
  }

  const counts: Record<string, number> = {}

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue

    const recommenderVal = row[0]
    if (recommenderVal === undefined || recommenderVal === null) continue

    const userNumber = String(recommenderVal).trim()
    if (!userNumber || userNumber === 'undefined' || userNumber === 'null') continue

    counts[userNumber] = (counts[userNumber] || 0) + 1
  }

  return counts
}

export default function DailyBoardReconcileModal({
  isOpen,
  selectedDate,
  employeesList,
  onClose,
  onConfirm,
}: DailyBoardReconcileModalProps) {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [previewCounts, setPreviewCounts] = useState<Record<string, number>>({})
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [kpiTargets, setKpiTargets] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setFile(null)
    setPreviewCounts({})
    setSelectedUserIds([])
    setKpiTargets({})
    setSearch('')
    setIsPreviewing(false)
    setIsSubmitting(false)
    setErrorMessage('')
  }, [isOpen, selectedDate])

  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return employeesList

    return employeesList.filter((emp) => {
      const fullName = String(emp.full_name || '').toLowerCase()
      const nickname = String(emp.nickname || '').toLowerCase()
      const userNumber = String(emp.user_number || '').toLowerCase()
      return (
        fullName.includes(query) ||
        nickname.includes(query) ||
        userNumber.includes(query)
      )
    })
  }, [employeesList, search])

  const selectedEmployees = useMemo(
    () => employeesList.filter((emp) => selectedUserIds.includes(String(emp.id))),
    [employeesList, selectedUserIds]
  )

  const selectedMatchedTotal = selectedEmployees.reduce((sum, emp) => {
    const userNumber = String(emp.user_number || '').trim()
    return sum + (previewCounts[userNumber] || 0)
  }, 0)

  const allUsersSelected =
    employeesList.length > 0 && selectedUserIds.length === employeesList.length

  const handleFileChange = async (nextFile: File | null) => {
    setErrorMessage('')
    setFile(nextFile)
    setPreviewCounts({})

    if (!nextFile) return

    setIsPreviewing(true)
    try {
      const counts = await parseReconcilePreview(nextFile, t)
      setPreviewCounts(counts)
    } catch (error: any) {
      setFile(null)
      setErrorMessage(error?.message || t('rm.readFail'))
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleToggleUser = (id: string, checked: boolean) => {
    setSelectedUserIds((prev) =>
      checked
        ? Array.from(new Set([...prev, id]))
        : prev.filter((item) => item !== id)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedUserIds(checked ? employeesList.map((emp) => String(emp.id)) : [])
  }

  const handleTargetChange = (id: string, rawValue: string) => {
    const parsed = Number(rawValue)
    setKpiTargets((prev) => ({
      ...prev,
      [id]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    }))
  }

  const handleConfirm = async () => {
    setErrorMessage('')

    if (!file) {
      setErrorMessage(t('rm.pickFile'))
      return
    }

    if (selectedUserIds.length === 0) {
      setErrorMessage(t('rm.pickUser'))
      return
    }

    if (isPreviewing) {
      setErrorMessage(t('rm.waitPreview'))
      return
    }

    setIsSubmitting(true)
    const result = await onConfirm(file, selectedUserIds, kpiTargets)

    if (result) {
      setErrorMessage(result)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {t('rm.title')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t('rm.subtitle', { date: selectedDate })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent transition-colors disabled:opacity-40"
            aria-label={t('modal.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="max-h-[calc(90vh-132px)] overflow-y-auto">
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* Section 1: File Upload */}
            <section className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {t('rm.step1')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {t('rm.step1Desc')}
                  </p>
                </div>

                <label
                  htmlFor="daily-board-reconcile-file"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {file ? t('rm.changeFile') : t('rm.chooseFile')}
                </label>
                <input
                  id="daily-board-reconcile-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </div>

              {file && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatFileSize(file.size)}
                      {isPreviewing ? t('rm.reading') : t('rm.readDone')}
                    </p>
                  </div>
                  {isPreviewing ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <Check className="w-4 h-4" />
                      {t('rm.ready')}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section 2: User Selection & Target Input */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {t('rm.step2')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {t('rm.step2Desc')}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-black border border-blue-100 dark:border-blue-800/60">
                  {t('rm.selectedOf', { a: selectedUserIds.length, b: employeesList.length })}
                </span>
              </div>

              {/* Search & Select All */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('rm.searchPh')}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectAll(!allUsersSelected)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  {allUsersSelected ? t('rm.deselectAll') : t('rm.selectAll')}
                </button>
              </div>

              {/* User Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                  <span className="w-8 shrink-0" />
                  <span className="flex-1 min-w-0">User</span>
                  <span className="w-16 shrink-0 text-center">Excel</span>
                  <span className="w-20 shrink-0 text-center">KPI Target</span>
                </div>

                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      {t('rm.noResults')}
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const id = String(emp.id)
                      const userNumber = String(emp.user_number || '').trim()
                      const isSelected = selectedUserIds.includes(id)
                      const matchedCount = previewCounts[userNumber] || 0

                      return (
                        <div
                          key={id}
                          className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleUser(id, e.target.checked)}
                            className="w-5 h-5 accent-emerald-600 dark:accent-emerald-500 cursor-pointer shrink-0 flex-none rounded"
                          />

                          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {emp.nickname ? `${emp.nickname} - ${emp.full_name}` : emp.full_name}
                            </p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate shrink-0 max-w-[220px]">
                              {userNumber || '-'}
                            </span>
                          </div>

                          <div className="w-16 shrink-0 text-center">
                            <span
                              className={`inline-flex min-w-8 h-6 items-center justify-center px-1.5 rounded-md text-[10px] font-black ${
                                matchedCount > 0
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {file ? matchedCount : '-'}
                            </span>
                          </div>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            disabled={!isSelected}
                            value={kpiTargets[id] ?? 25}
                            onChange={(e) => handleTargetChange(id, e.target.value)}
                            className="w-14 h-7 shrink-0 px-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-[11px] font-black text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600"
                          />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Summary Footer inside Section 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                <span>
                  {t('rm.totalPre')}<strong className="text-emerald-700 dark:text-emerald-400">{selectedMatchedTotal}</strong>{t('rm.totalPost')}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold self-start sm:self-auto transition-colors"
                >
                  {t('rm.clearUsers')}
                </button>
              </div>
            </section>

            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors disabled:opacity-40"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || isPreviewing || !file || selectedUserIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('rm.reconciling')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('rm.confirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}