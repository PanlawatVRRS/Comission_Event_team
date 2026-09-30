'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Employee } from '@/lib/supabase'
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

async function parseReconcilePreview(file: File): Promise<Record<string, number>> {
  const dataBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(Buffer.from(dataBuffer), { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('ไม่พบข้อมูล Sheet ในไฟล์ Excel')
  }

  const worksheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })

  if (!rawData || rawData.length <= 1) {
    throw new Error('ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์ว่างเปล่า')
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
      const counts = await parseReconcilePreview(nextFile)
      setPreviewCounts(counts)
    } catch (error: any) {
      setFile(null)
      setErrorMessage(error?.message || 'ไม่สามารถอ่านไฟล์ Excel ได้')
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
      setErrorMessage('กรุณาเลือกไฟล์ Excel สำหรับกระทบยอด')
      return
    }

    if (selectedUserIds.length === 0) {
      setErrorMessage('กรุณาเลือก User อย่างน้อย 1 คน')
      return
    }

    if (isPreviewing) {
      setErrorMessage('กรุณารอให้ระบบอ่านไฟล์ Excel เสร็จก่อน')
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
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                กระทบยอด Daily KPI
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                วันที่ {selectedDate} · เลือกไฟล์ + User + KPI Target แล้วจึงยืนยัน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors disabled:opacity-40"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-132px)] overflow-y-auto">
          <div className="p-4 sm:p-5 space-y-4">
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-emerald-950 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    1. เลือกไฟล์ Excel กระทบยอด
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ระบบจะอ่าน Recommender User Number จากคอลัมน์แรกเพื่อแสดงยอดที่จับคู่ได้
                  </p>
                </div>

                <label
                  htmlFor="daily-board-reconcile-file"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  {file ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
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
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-emerald-200">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatFileSize(file.size)}
                      {isPreviewing ? ' · กำลังอ่านไฟล์...' : ' · อ่านไฟล์แล้ว'}
                    </p>
                  </div>
                  {isPreviewing ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                      <Check className="w-4 h-4" />
                      พร้อมตรวจสอบ
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    2. เลือก User และกำหนด KPI Target
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    เลือกเฉพาะคนที่ต้องการกระทบยอดได้ ไม่จำเป็นต้องเลือกทุกคน
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
                  เลือกแล้ว {selectedUserIds.length} / {employeesList.length} คน
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ ชื่อเล่น หรือ User Number..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectAll(!allUsersSelected)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  {allUsersSelected ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                  <span className="w-8 shrink-0" />
                  <span className="flex-1 min-w-0">User</span>
                  <span className="w-16 shrink-0 text-center">Excel</span>
                  <span className="w-20 shrink-0 text-center">KPI Target</span>
                </div>

                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      ไม่พบพนักงานที่ค้นหา
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
                            isSelected ? 'bg-emerald-50/70' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleUser(id, e.target.checked)}
                            className="w-5 h-5 accent-emerald-600 cursor-pointer shrink-0 flex-none"
                          />

                          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                            <p className="text-[11px] font-bold text-slate-800 truncate">
                              {emp.nickname ? `${emp.nickname} - ${emp.full_name}` : emp.full_name}
                            </p>
                            <span className="text-[9px] text-slate-400 font-mono truncate shrink-0 max-w-[220px]">
                              {userNumber || '-'}
                            </span>
                          </div>

                          <div className="w-16 shrink-0 text-center">
                            <span
                              className={`inline-flex min-w-8 h-6 items-center justify-center px-1.5 rounded-md text-[10px] font-black ${
                                matchedCount > 0
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-400'
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
                            className="w-14 h-7 shrink-0 px-1.5 bg-white border border-slate-200 rounded-lg text-center text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
                <span>
                  ยอด Excel ของ User ที่เลือกทั้งหมด: <strong className="text-emerald-700">{selectedMatchedTotal}</strong> รายการ
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-rose-600 hover:text-rose-700 font-bold self-start sm:self-auto"
                >
                  ล้างการเลือก User
                </button>
              </div>
            </section>

            {errorMessage && (
              <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors disabled:opacity-40"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || isPreviewing || !file || selectedUserIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังกระทบยอด...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                ยืนยันกระทบยอด & ลง Daily Board
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
