'use client'

import { useState, useEffect } from 'react'
import { supabase, Employee } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import DailyBoardReconcileModal from '@/components/DailyBoardReconcileModal'
import { useLanguage } from '@/lib/i18n'
import {
  Layers,
  RefreshCw,
  Trash2,
  UserPlus,
  Plus,
  Upload,
  FileSpreadsheet,
  X,
  Calendar,
  Edit2,
  Check,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square,
  Download,
  Users,
} from 'lucide-react'

interface KPIRecord {
  id?: string
  record_date: string
  staff_name: string
  kpi_achieved: number
  kpi_target: number
  pending_ekyc: number
  has_kpi: boolean
}

interface StaffInputRow {
  tempId: string
  staff_name: string
  kpi_achieved: number | ''
  has_kpi: boolean
}

interface InviteItem {
  recommender: string
  recommended: string
  timestamp: string
}

export default function DailyBoardPage() {
  const { t } = useLanguage()
  const [records, setRecords] = useState<KPIRecord[]>([])
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([])
  const [eKycCounts, setEKycCounts] = useState<Record<string, number>>({})
  
  const [rawInviteData, setRawInviteData] = useState<InviteItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rawInviteData_cache_v2')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          return []
        }
      }
    }
    return []
  })

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const [staffRows, setStaffRows] = useState<StaffInputRow[]>([
    {
      tempId: '1',
      staff_name: '',
      kpi_achieved: '',
      has_kpi: true,
    },
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    staff_name: string
    kpi_achieved: number | ''
    has_kpi: boolean
  }>({
    staff_name: '',
    kpi_achieved: '',
    has_kpi: true,
  })

  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportDate, setExportDate] = useState<string>('')
  const [teamCount, setTeamCount] = useState<number>(2)
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string>>({})

  const fetchEmployeesList = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true })

    if (!error && data) {
      setEmployeesList(data)
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('daily_kpi_records')
      .select('*')
      .order('record_date', { ascending: true })

    if (!error && data) {
      setRecords(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployeesList()
    fetchRecords()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && rawInviteData.length > 0) {
      localStorage.setItem('rawInviteData_cache_v2', JSON.stringify(rawInviteData))
    }
  }, [rawInviteData])

  const handleReconcileConfirm = async (
    boardExcelFile: File,
    selectedImportUserIds: string[],
    importKpiTargets: Record<string, number>
  ): Promise<string | null> => {
    if (!selectedDate) return t('board.selectDate')

    try {
      const dataBuffer = await boardExcelFile.arrayBuffer()
      const workbook = XLSX.read(Buffer.from(dataBuffer), { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]

      if (!sheetName) throw new Error(t('board.noSheet'))

      const worksheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 })

      if (!rawData || rawData.length <= 1) {
        throw new Error(t('board.emptyFile'))
      }

      const userCounts: Record<string, number> = {}
      const inviteDataList: InviteItem[] = []

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as any[]
        if (!row || row.length === 0) continue

        const recommenderVal = row[0]
        const recommendedVal = row[1]
        const timeVal = row[9] || row[10] || new Date().toLocaleString('th-TH')

        if (recommenderVal !== undefined && recommenderVal !== null) {
          const recStr = String(recommenderVal).trim()
          const targetStr =
            recommendedVal !== undefined && recommendedVal !== null
              ? String(recommendedVal).trim()
              : ''
          const timeStr = String(timeVal).trim()

          if (recStr && recStr !== 'undefined' && recStr !== 'null') {
            userCounts[recStr] = (userCounts[recStr] || 0) + 1
            inviteDataList.push({
              recommender: recStr,
              recommended: targetStr,
              timestamp: timeStr,
            })
          }
        }
      }

      setEKycCounts(userCounts)
      setRawInviteData(inviteDataList)

      if (selectedImportUserIds.length === 0) {
        throw new Error(t('board.selectUser'))
      }

      const selectedEmployees = employeesList.filter((emp) =>
        selectedImportUserIds.includes(String(emp.id))
      )

      const recordsToInsert: Omit<KPIRecord, 'id'>[] = []

      selectedEmployees.forEach((emp) => {
        const uNum = String(emp.user_number || '').trim()
        const matchedKpiCount = userCounts[uNum] || 0
        const target = Math.max(
          0,
          Number(importKpiTargets[String(emp.id)] ?? 35) || 0
        )

        if (matchedKpiCount > 0) {
          recordsToInsert.push({
            record_date: selectedDate,
            staff_name: emp.full_name,
            kpi_achieved: matchedKpiCount,
            kpi_target: target,
            pending_ekyc: 0,
            has_kpi: true,
          })
        }
      })

      if (recordsToInsert.length === 0) {
        throw new Error(
          t('board.noMatch')
        )
      }

      const { error } = await supabase
        .from('daily_kpi_records')
        .insert(recordsToInsert)

      if (error) throw new Error(error.message)

      setStatusMessage({
        type: 'success',
        message: t('board.createdOk', { date: selectedDate, n: recordsToInsert.length }),
      })

      fetchRecords()
      return null
    } catch (err: any) {
      return err?.message || t('board.reconcileFail')
    }
  }

  const handleAddRow = () => {
    setStaffRows((prev) => [
      ...prev,
      {
        tempId: Date.now().toString(),
        staff_name: '',
        kpi_achieved: '',
        has_kpi: true,
      },
    ])
  }

  const handleRemoveRow = (tempId: string) => {
    if (staffRows.length === 1) return
    setStaffRows((prev) => prev.filter((row) => row.tempId !== tempId))
  }

  const handleSelectStaff = (tempId: string, selectedFullName: string) => {
    const selectedEmp = employeesList.find((e) => e.full_name === selectedFullName)
    const empUserNum = String(selectedEmp?.user_number || '').trim()
    const autoKpiCount = empUserNum ? eKycCounts[empUserNum] || 0 : 0

    setStaffRows((prev) =>
      prev.map((row) => {
        if (row.tempId === tempId) {
          return {
            ...row,
            staff_name: selectedFullName,
            kpi_achieved: autoKpiCount > 0 ? autoKpiCount : row.kpi_achieved,
          }
        }
        return row
      })
    )
  }

  const handleRowChange = (
    tempId: string,
    field: keyof StaffInputRow,
    value: any
  ) => {
    setStaffRows((prev) =>
      prev.map((row) => {
        if (row.tempId === tempId) {
          const updated = { ...row, [field]: value }
          if (field === 'has_kpi' && value === false) {
            updated.kpi_achieved = 0
          }
          return updated
        }
        return row
      })
    )
  }

  const handleSubmitManualStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    const validRows = staffRows.filter((r) => r.staff_name.trim() !== '')

    if (validRows.length === 0 || !selectedDate) return

    const recordsToInsert = validRows.map((row) => ({
      record_date: selectedDate,
      staff_name: row.staff_name.trim(),
      kpi_achieved: row.has_kpi ? Number(row.kpi_achieved) || 0 : 0,
      kpi_target: 35,
      pending_ekyc: 0,
      has_kpi: row.has_kpi,
    }))

    const { error } = await supabase
      .from('daily_kpi_records')
      .insert(recordsToInsert)

    if (!error) {
      setStaffRows([
        {
          tempId: Date.now().toString(),
          staff_name: '',
          kpi_achieved: '',
          has_kpi: true,
        },
      ])
      setStatusMessage({
        type: 'success',
        message: t('board.addedOk', { date: selectedDate }),
      })
      fetchRecords()
    } else {
      console.error('Error inserting records:', error)
    }
  }

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleSelectDay = (dayRecords: KPIRecord[]) => {
    const dayIds = dayRecords.map((r) => r.id).filter((id): id is string => !!id)
    const allSelected = dayIds.every((id) => selectedRecordIds.includes(id))

    if (allSelected) {
      setSelectedRecordIds((prev) => prev.filter((id) => !dayIds.includes(id)))
    } else {
      setSelectedRecordIds((prev) => Array.from(new Set([...prev, ...dayIds])))
    }
  }

  const handleDeleteSelectedRecords = async () => {
    if (selectedRecordIds.length === 0) return

    if (
      confirm(
        t('board.confirmDeleteSelected', { n: selectedRecordIds.length })
      )
    ) {
      const { error } = await supabase
        .from('daily_kpi_records')
        .delete()
        .in('id', selectedRecordIds)

      if (!error) {
        setRecords((prev) => prev.filter((r) => !r.id || !selectedRecordIds.includes(r.id)))
        setSelectedRecordIds([])
        setStatusMessage({
          type: 'success',
          message: t('board.deletedSelected'),
        })
      } else {
        alert(t('board.deleteFail', { msg: error.message }))
      }
    }
  }

  const handleDeleteEntireDay = async (dateStr: string) => {
    const dayLabel = formatDateLabel(dateStr)
    if (
      confirm(
        t('board.confirmDeleteDay', { day: dayLabel })
      )
    ) {
      const { error } = await supabase
        .from('daily_kpi_records')
        .delete()
        .eq('record_date', dateStr)

      if (!error) {
        setRecords((prev) => prev.filter((r) => r.record_date !== dateStr))
        const dayIds = records
          .filter((r) => r.record_date === dateStr)
          .map((r) => r.id)
          .filter((id): id is string => !!id)

        setSelectedRecordIds((prev) => prev.filter((id) => !dayIds.includes(id)))
        setStatusMessage({
          type: 'success',
          message: t('board.deletedDay', { day: dayLabel }),
        })
      } else {
        alert(t('board.deleteDayFail', { msg: error.message }))
      }
    }
  }

  const handleOpenExportModal = (dateStr: string) => {
    setExportDate(dateStr)
    const dayRecords = records.filter((r) => r.record_date === dateStr)

    const initialAssignments: Record<string, string> = {}
    dayRecords.forEach((rec, idx) => {
      const teamNum = (idx % teamCount) + 1
      initialAssignments[rec.staff_name] = String(teamNum)
    })

    setTeamAssignments(initialAssignments)
    setIsExportModalOpen(true)
  }

  const handleTeamCountChange = (newCount: number) => {
    setTeamCount(newCount)
    const dayRecords = records.filter((r) => r.record_date === exportDate)
    const updatedAssignments: Record<string, string> = {}
    dayRecords.forEach((rec, idx) => {
      const teamNum = (idx % newCount) + 1
      updatedAssignments[rec.staff_name] = String(teamNum)
    })
    setTeamAssignments(updatedAssignments)
  }

  const handleAutoDistributeTeams = () => {
    const dayRecords = records.filter((r) => r.record_date === exportDate)
    const updatedAssignments: Record<string, string> = {}
    dayRecords.forEach((rec, idx) => {
      const teamNum = (idx % teamCount) + 1
      updatedAssignments[rec.staff_name] = String(teamNum)
    })
    setTeamAssignments(updatedAssignments)
  }

  const handleDownloadExcelReport = () => {
    const dayRecords = records.filter((r) => r.record_date === exportDate)
    if (dayRecords.length === 0) return

    const workbook = XLSX.utils.book_new()

    const teamsMap: Record<string, KPIRecord[]> = {}
    dayRecords.forEach((rec) => {
      const teamName = teamAssignments[rec.staff_name] || '1'
      if (!teamsMap[teamName]) teamsMap[teamName] = []
      teamsMap[teamName].push(rec)
    })

    Object.entries(teamsMap).forEach(([teamName, teamStaffList]) => {
      const sheetData: any[][] = []

      sheetData.push([
        t('xl.uid'),
        t('xl.time'),
        '',
        t('xl.teamList'),
        t('xl.userNumber'),
      ])

      const teamUserNumbers: string[] = []
      const staffInfoList: { nameLabel: string; userNum: string }[] = []

      teamStaffList.forEach((staff) => {
        const emp = employeesList.find((e) => e.full_name === staff.staff_name)
        const uNum = emp ? String(emp.user_number || '').trim() : ''
        const nameLabel = emp?.nickname
          ? `${emp.nickname.toUpperCase()}`
          : staff.staff_name

        if (uNum) teamUserNumbers.push(uNum)
        staffInfoList.push({ nameLabel, userNum: uNum })
      })

      const matchedInvites = rawInviteData.filter((item) =>
        teamUserNumbers.includes(item.recommender)
      )

      const maxRows = Math.max(matchedInvites.length, staffInfoList.length, 1)

      for (let i = 0; i < maxRows; i++) {
        const invite = matchedInvites[i] || { recommended: '', timestamp: '' }
        const staffInfo = staffInfoList[i] || { nameLabel: '', userNum: '' }

        sheetData.push([
          invite.recommended,
          invite.timestamp,
          '',
          staffInfo.nameLabel,
          staffInfo.userNum,
        ])
      }

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

      const borderStyle = {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } },
      }

      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:E1')

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!worksheet[cellAddress]) continue

          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {}
          worksheet[cellAddress].s.border = borderStyle

          if (R === 0) {
            if (C !== 2) {
              worksheet[cellAddress].s.fill = { fgColor: { rgb: 'FFF2CC' } }
              worksheet[cellAddress].s.font = { bold: true, color: { rgb: '000000' }, sz: 11 }
              worksheet[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center', wrapText: true }
            }
          } else {
            worksheet[cellAddress].s.font = { sz: 10 }
            if (C === 0 || C === 1 || C === 4) {
              worksheet[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' }
            } else if (C === 3) {
              worksheet[cellAddress].s.alignment = { horizontal: 'left', vertical: 'center' }
            }
          }
        }
      }

      worksheet['!cols'] = [
        { wch: 32 },
        { wch: 22 },
        { wch: 4 },
        { wch: 24 },
        { wch: 30 },
      ]

      XLSX.utils.book_append_sheet(workbook, worksheet, t('board.team', { n: teamName }))
    })

    const inviteSheetData: string[][] = [[
      'Recommender user number',
      'Recommended user number',
      'Activity number',
      'Reward status',
      'Recommendation status',
      'Reward Result Note',
      'Recommend Result Note',
      'Reward No',
      'Recommended Reward No',
      'creation time'
    ]]

    if (rawInviteData.length > 0) {
      rawInviteData.forEach((item) => {
        inviteSheetData.push([
          item.recommender,
          item.recommended,
          '01002',
          'Reward Success',
          'Referral Success',
          'Reward succeeded',
          'Recommendation succeeded',
          '',
          '',
          item.timestamp
        ])
      })
    }

    const inviteWorksheet = XLSX.utils.aoa_to_sheet(inviteSheetData)
    inviteWorksheet['!cols'] = Array(10).fill({ wch: 24 })
    XLSX.utils.book_append_sheet(workbook, inviteWorksheet, 'data of invite')

    const fileName = `Daily_KPI_Teams_Report_${exportDate}.xlsx`
    XLSX.writeFile(workbook, fileName)

    setIsExportModalOpen(false)
  }

  const handleStartEdit = (staff: KPIRecord) => {
    if (!staff.id) return
    setEditingId(staff.id)
    setEditForm({
      staff_name: staff.staff_name,
      kpi_achieved: staff.kpi_achieved,
      has_kpi: staff.has_kpi,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editForm.staff_name.trim()) return

    const updatedRecord = {
      staff_name: editForm.staff_name.trim(),
      kpi_achieved: editForm.has_kpi ? Number(editForm.kpi_achieved) || 0 : 0,
      pending_ekyc: 0,
      has_kpi: editForm.has_kpi,
    }

    const { error } = await supabase
      .from('daily_kpi_records')
      .update(updatedRecord)
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchRecords()
    } else {
      console.error('Error updating record:', error)
    }
  }

  const handleDeleteRecord = async (id?: string) => {
    if (!id) return
    if (confirm(t('board.confirmDeleteOne'))) {
      await supabase.from('daily_kpi_records').delete().eq('id', id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      setSelectedRecordIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const formatEmployeeLabel = (emp: Employee) => {
    return emp.nickname
      ? `${emp.nickname} - ${emp.full_name}`
      : emp.full_name
  }

  const getDisplayStaffName = (staffName: string) => {
    const emp = employeesList.find((e) => e.full_name === staffName)
    if (emp && emp.nickname) {
      return `${emp.nickname} - ${emp.full_name}`
    }
    return staffName
  }

  const groupedRecords = records.reduce((acc, curr) => {
    if (!acc[curr.record_date]) acc[curr.record_date] = []
    acc[curr.record_date].push(curr)
    return acc
  }, {} as Record<string, KPIRecord[]>)

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr)
    const day = d.getDate()
    const month = d.toLocaleString('en-US', { month: 'long' })
    return `${day} ${month}`
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t('board.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('board.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            fetchEmployeesList()
            fetchRecords()
          }}
          className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Control Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
        {/* Date Selector */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('board.pickDate')}
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Reconcile Excel Card */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-300">{t('board.reconcileTitle')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {t('board.reconcileDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusMessage({ type: null, message: '' })
                fetchEmployeesList()
                setIsReconcileModalOpen(true)
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs shrink-0"
            >
              <Upload className="w-4 h-4" />
              {t('board.reconcileBtn')}
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {statusMessage.type === 'success' && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusMessage.message}</span>
          </div>
        )}

        {statusMessage.type === 'error' && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{statusMessage.message}</span>
          </div>
        )}

        {/* Manual Add Form */}
        <form onSubmit={handleSubmitManualStaff} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {t('board.option2', { n: staffRows.length })}
            </p>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {t('board.staffInSystem', { n: employeesList.length })}
            </span>
          </div>

          {staffRows.map((row, index) => (
            <div
              key={row.tempId}
              className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-colors"
            >
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 w-5 text-center">
                {index + 1}.
              </span>

              <div className="flex-1 min-w-[200px]">
                <select
                  required
                  value={row.staff_name}
                  onChange={(e) => handleSelectStaff(row.tempId, e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors"
                >
                  <option value="" className="dark:bg-slate-800">{t('board.selectStaff')}</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.full_name} className="dark:bg-slate-800">
                      {formatEmployeeLabel(emp)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  id={`hasKpi-${row.tempId}`}
                  checked={row.has_kpi}
                  onChange={(e) =>
                    handleRowChange(row.tempId, 'has_kpi', e.target.checked)
                  }
                  className="w-3.5 h-3.5 rounded-xs text-blue-600 dark:text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor={`hasKpi-${row.tempId}`}
                  className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none"
                >
                  {row.has_kpi ? t('board.hasKpi') : t('board.noKpi')}
                </label>
              </div>

              <div className="w-28">
                <input
                  type="number"
                  min="0"
                  disabled={!row.has_kpi}
                  placeholder={row.has_kpi ? 'KPI (0)' : 'NO KPI'}
                  value={row.has_kpi ? row.kpi_achieved : ''}
                  onChange={(e) =>
                    handleRowChange(
                      row.tempId,
                      'kpi_achieved',
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveRow(row.tempId)}
                disabled={staffRows.length === 1}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors disabled:opacity-30 ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('board.addAnother')}
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              {t('board.saveStaff', { n: staffRows.filter((r) => r.staff_name.trim()).length })}
            </button>
          </div>
        </form>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedRecordIds.length > 0 && (
        <div className="bg-rose-900 dark:bg-rose-950 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 border border-rose-800 dark:border-rose-900">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckSquare className="w-4 h-4 text-rose-300" />
            <span>
              {t('board.selectedPre')}<strong>{selectedRecordIds.length}</strong>{t('board.selectedPost')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRecordIds([])}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 dark:bg-rose-900 dark:hover:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {t('board.clearSelect')}
            </button>
            <button
              onClick={handleDeleteSelectedRecords}
              className="px-3.5 py-1 bg-white dark:bg-slate-100 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              {t('board.deleteSelected', { n: selectedRecordIds.length })}
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-900 dark:border-slate-700 shadow-xl overflow-hidden transition-colors">
        <div className="bg-slate-950 dark:bg-slate-950 text-white font-black text-center py-3 text-lg tracking-wider uppercase border-b border-slate-800">
          DAILY KPI TRACKER
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-center border-b border-slate-300 dark:border-slate-700">
                <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-48">{t('board.colDate')}</th>
                <th className="p-3 border-r border-slate-300 dark:border-slate-700">{t('board.colStaff')}</th>
                <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-44">
                  KPI (Achieved / Target)
                </th>
                <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-36">
                  {t('board.passFail')}
                </th>
                <th className="p-3 w-24">{t('common.manage')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedRecords).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    {t('board.emptyDay')}
                  </td>
                </tr>
              ) : (
                Object.entries(groupedRecords).map(([dateStr, dateStaffList]) => {
                  const totalKpiAchieved = dateStaffList.reduce(
                    (a, b) => a + (b.has_kpi ? b.kpi_achieved : 0),
                    0
                  )
                  const totalTarget = dateStaffList
                    .filter((s) => s.has_kpi)
                    .reduce((sum, staff) => sum + (Number(staff.kpi_target) || 0), 0)
                  const isDayPassed =
                    totalKpiAchieved >= totalTarget && totalTarget > 0

                  const dayIds = dateStaffList
                    .map((r) => r.id)
                    .filter((id): id is string => !!id)
                  const isAllDaySelected =
                    dayIds.length > 0 &&
                    dayIds.every((id) => selectedRecordIds.includes(id))

                  return (
                    <tr key={dateStr} className="border-b-2 border-slate-800 dark:border-slate-700">
                      {/* Left Column: Date & Actions */}
                      <td className="p-3 font-bold text-center border-r-2 border-slate-800 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 align-top space-y-2">
                        <div className="text-sm text-rose-600 dark:text-rose-400 font-extrabold">
                          {formatDateLabel(dateStr)}
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenExportModal(dateStr)}
                            className="w-full text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-md font-semibold flex items-center justify-center gap-1 transition-colors border border-emerald-200 dark:border-emerald-800/60"
                            title={t('board.exportTitleAttr')}
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{t('board.exportExcel')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSelectDay(dateStaffList)}
                            className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium transition-colors"
                            title={t('board.selectDayTitle')}
                          >
                            {isAllDaySelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            )}
                            <span>{t('board.selectDay', { n: dateStaffList.length })}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEntireDay(dateStr)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors border border-rose-200/60 dark:border-rose-900/60"
                            title={t('board.deleteDayTitle')}
                          >
                            <Trash2 className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                            <span>{t('board.deleteDay')}</span>
                          </button>
                        </div>
                      </td>

                      {/* Right Inner Table: Staff Rows & Total */}
                      <td colSpan={4} className="p-0 align-top">
                        <table className="w-full text-xs">
                          <tbody>
                            {dateStaffList.map((staff, sIdx) => {
                              const isEditing = editingId === staff.id
                              const isStaffPassed =
                                staff.kpi_achieved >= staff.kpi_target
                              const staffBg =
                                sIdx % 2 === 0
                                  ? 'bg-amber-50/40 dark:bg-amber-950/10'
                                  : 'bg-blue-50/40 dark:bg-blue-950/10'
                              const isSelected = !!staff.id && selectedRecordIds.includes(staff.id)

                              return isEditing ? (
                                <tr
                                  key={staff.id}
                                  className="border-b border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40"
                                >
                                  <td className="p-2 border-r border-slate-300 dark:border-slate-700">
                                    <select
                                      value={editForm.staff_name}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          staff_name: e.target.value,
                                        })
                                      }
                                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-500 rounded-md text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                                    >
                                      <option value="" className="dark:bg-slate-800">{t('board.selectStaff')}</option>
                                      {employeesList.map((emp) => (
                                        <option key={emp.id} value={emp.full_name} className="dark:bg-slate-800">
                                          {formatEmployeeLabel(emp)}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 w-44 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      disabled={!editForm.has_kpi}
                                      value={editForm.has_kpi ? editForm.kpi_achieved : ''}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          kpi_achieved:
                                            e.target.value === ''
                                              ? ''
                                              : Number(e.target.value),
                                        })
                                      }
                                      className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-500 rounded-md text-xs text-center font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden mx-auto block disabled:bg-slate-200 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600"
                                    />
                                  </td>

                                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 w-36 text-center">
                                    <label className="inline-flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editForm.has_kpi}
                                        onChange={(e) =>
                                          setEditForm({
                                            ...editForm,
                                            has_kpi: e.target.checked,
                                          })
                                        }
                                        className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500 rounded-xs"
                                      />
                                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                                        {t('board.hasKpi')}
                                      </span>
                                    </label>
                                  </td>

                                  <td className="p-2 text-center w-24">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() =>
                                          staff.id && handleSaveEdit(staff.id)
                                        }
                                        className="p-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 rounded-md transition-colors"
                                        title={t('common.save')}
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                                        title={t('common.cancel')}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <tr
                                  key={staff.id || sIdx}
                                  className={`border-b border-slate-200 dark:border-slate-800 transition-colors ${
                                    isSelected
                                      ? 'bg-rose-50/80 dark:bg-rose-950/30'
                                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                                  }`}
                                >
                                  <td
                                    className={`p-2.5 border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 ${staffBg}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {staff.id && (
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() =>
                                            staff.id &&
                                            handleToggleSelectRecord(staff.id)
                                          }
                                          className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500 rounded-xs cursor-pointer"
                                        />
                                      )}
                                      <span>{getDisplayStaffName(staff.staff_name)}</span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 font-mono font-bold text-center text-slate-800 dark:text-slate-200 w-44">
                                    {staff.has_kpi ? `${staff.kpi_achieved} / ${staff.kpi_target}` : '-'}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-36 font-bold">
                                    {!staff.has_kpi ? (
                                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-xs text-[11px]">
                                        NO KPI
                                      </span>
                                    ) : isStaffPassed ? (
                                      <span className="bg-emerald-600 dark:bg-emerald-600 text-white px-2 py-0.5 rounded-xs text-[11px]">
                                        {t('board.pass')}
                                      </span>
                                    ) : (
                                      <span className="bg-red-600 dark:bg-rose-700 text-white px-2 py-0.5 rounded-xs text-[11px]">
                                        {t('board.notPass')}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-center w-24">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleStartEdit(staff)}
                                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                                        title={t('common.edit')}
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteRecord(staff.id)
                                        }
                                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                                        title={t('common.delete')}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}

                            {/* Total Row */}
                            <tr className="bg-slate-200/90 dark:bg-slate-800/90 font-bold border-t border-slate-400 dark:border-slate-700">
                              <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                                Total
                              </td>
                              <td
                                className={`p-2.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono ${
                                  !isDayPassed
                                    ? 'bg-red-600 dark:bg-rose-700 text-white'
                                    : 'bg-emerald-600 dark:bg-emerald-600 text-white'
                                }`}
                              >
                                {totalKpiAchieved}
                              </td>
                              <td
                                className={`p-2.5 border-r border-slate-300 dark:border-slate-700 text-center ${
                                  isDayPassed
                                    ? 'bg-emerald-600 dark:bg-emerald-600 text-white'
                                    : 'bg-red-600 dark:bg-rose-700 text-white'
                                }`}
                              >
                                {isDayPassed ? t('board.pass') : t('board.notPass')}
                              </td>
                              <td className="p-2.5"></td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-5 transition-colors">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  {t('board.exportTitle', { date: formatDateLabel(exportDate) })}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('board.exportDesc')}
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                aria-label={t('modal.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-colors">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {t('board.teamCount')}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={teamCount}
                    onChange={(e) => handleTeamCountChange(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-800 dark:text-slate-100 outline-none transition-colors"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num} className="dark:bg-slate-800">
                        {t('board.teamsN', { n: num })}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAutoDistributeTeams}
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg font-semibold transition-colors text-[11px]"
                  >
                    {t('board.autoDistribute')}
                  </button>
                </div>
              </div>

              {/* Team Assignment List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                <p className="font-bold text-slate-700 dark:text-slate-300 sticky top-0 bg-white dark:bg-slate-900 py-1 transition-colors">
                  {t('board.assignTeams', { n: records.filter((r) => r.record_date === exportDate).length })}
                </p>

                {records
                  .filter((r) => r.record_date === exportDate)
                  .map((rec) => {
                    const emp = employeesList.find((e) => e.full_name === rec.staff_name)
                    const label = emp?.nickname
                      ? `${emp.nickname.toUpperCase()} (${rec.staff_name})`
                      : rec.staff_name

                    return (
                      <div
                        key={rec.id || rec.staff_name}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            User: {emp?.user_number || '-'} | KPI: {rec.kpi_achieved}/{rec.kpi_target}
                          </p>
                        </div>

                        <select
                          value={teamAssignments[rec.staff_name] || '1'}
                          onChange={(e) =>
                            setTeamAssignments({
                              ...teamAssignments,
                              [rec.staff_name]: e.target.value,
                            })
                          }
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none transition-colors"
                        >
                          {Array.from({ length: teamCount }).map((_, i) => (
                            <option key={i + 1} value={String(i + 1)} className="dark:bg-slate-800">
                              {t('board.team', { n: i + 1 })}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcelReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  {t('board.downloadXlsx')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Modal Component */}
      <DailyBoardReconcileModal
        isOpen={isReconcileModalOpen}
        selectedDate={selectedDate}
        employeesList={employeesList}
        onClose={() => setIsReconcileModalOpen(false)}
        onConfirm={handleReconcileConfirm}
      />
    </div>
  )
}