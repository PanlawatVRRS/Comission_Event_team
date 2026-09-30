'use client'

import { useState, useEffect } from 'react'
import { supabase, Employee } from '@/lib/supabase'
import * as XLSX from 'xlsx'
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
  Loader2,
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
  const [boardExcelFile, setBoardExcelFile] = useState<File | null>(null)
  const [importingBoard, setImportingBoard] = useState(false)
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

  const handleImportExcelToCreateBoard = async () => {
    if (!boardExcelFile || !selectedDate) return

    setImportingBoard(true)
    setStatusMessage({ type: null, message: '' })

    try {
      const dataBuffer = await boardExcelFile.arrayBuffer()
      const workbook = XLSX.read(Buffer.from(dataBuffer), { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]

      if (!sheetName) throw new Error('ไม่พบข้อมูล Sheet ในไฟล์ Excel')

      const worksheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 })

      if (!rawData || rawData.length <= 1) {
        throw new Error('ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์ว่างเปล่า')
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
          const targetStr = recommendedVal !== undefined && recommendedVal !== null ? String(recommendedVal).trim() : ''
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

      const recordsToInsert: Omit<KPIRecord, 'id'>[] = []

      employeesList.forEach((emp) => {
        const uNum = String(emp.user_number || '').trim()
        const matchedKpiCount = userCounts[uNum] || 0

        if (matchedKpiCount > 0) {
          recordsToInsert.push({
            record_date: selectedDate,
            staff_name: emp.full_name,
            kpi_achieved: matchedKpiCount,
            kpi_target: 35,
            pending_ekyc: 0,
            has_kpi: true,
          })
        }
      })

      if (recordsToInsert.length === 0) {
        throw new Error(
          'ไม่พบรายการ Recommender user number ใน Excel ที่ตรงกับ User Number ของพนักงานในระบบ'
        )
      }

      const { error } = await supabase
        .from('daily_kpi_records')
        .insert(recordsToInsert)

      if (error) throw new Error(error.message)

      setStatusMessage({
        type: 'success',
        message: `สร้างบอร์ดประจำวันที่ ${selectedDate} สำเร็จ! นำเข้าข้อมูล Recommender และ Creation Time เรียบร้อย (${recordsToInsert.length} คน)`,
      })

      setBoardExcelFile(null)
      fetchRecords()
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel',
      })
    } finally {
      setImportingBoard(false)
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
        message: `เพิ่มพนักงานลงบอร์ดประจำวันที่ ${selectedDate} เรียบร้อยแล้ว`,
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
        `คุณต้องการลบรายการที่เลือกจำนวน ${selectedRecordIds.length} รายการ ใช่หรือไม่?`
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
          message: 'ลบรายการที่เลือกเรียบร้อยแล้ว',
        })
      } else {
        alert(`เกิดข้อผิดพลาดในการลบ: ${error.message}`)
      }
    }
  }

  const handleDeleteEntireDay = async (dateStr: string) => {
    const dayLabel = formatDateLabel(dateStr)
    if (
      confirm(
        `⚠️ เตือน: คุณต้องการลบข้อมูลบอร์ดประจำวันที่ "${dayLabel}" ทั้งหมดใช่หรือไม่?`
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
          message: `ลบข้อมูลบอร์ดประจำวันที่ ${dayLabel} เรียบร้อยแล้ว`,
        })
      } else {
        alert(`เกิดข้อผิดพลาดในการลบข้อมูลประจำวัน: ${error.message}`)
      }
    }
  }

  const handleOpenExportModal = (dateStr: string) => {
    setExportDate(dateStr)
    const dayRecords = records.filter((r) => r.record_date === dateStr)

    const initialAssignments: Record<string, string> = {}
    dayRecords.forEach((rec, idx) => {
      const teamNum = (idx % teamCount) + 1
      initialAssignments[rec.staff_name] = `ทีม ${teamNum}`
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
      updatedAssignments[rec.staff_name] = `ทีม ${teamNum}`
    })
    setTeamAssignments(updatedAssignments)
  }

  const handleAutoDistributeTeams = () => {
    const dayRecords = records.filter((r) => r.record_date === exportDate)
    const updatedAssignments: Record<string, string> = {}
    dayRecords.forEach((rec, idx) => {
      const teamNum = (idx % teamCount) + 1
      updatedAssignments[rec.staff_name] = `ทีม ${teamNum}`
    })
    setTeamAssignments(updatedAssignments)
  }

  // ส่งออก Excel: พร้อมใส่สีหัวตารางเหลืองพาสเทลและจัดรูปแบบตารางอย่างสวยงาม
  const handleDownloadExcelReport = () => {
    const dayRecords = records.filter((r) => r.record_date === exportDate)
    if (dayRecords.length === 0) return

    const workbook = XLSX.utils.book_new()

    const teamsMap: Record<string, KPIRecord[]> = {}
    dayRecords.forEach((rec) => {
      const teamName = teamAssignments[rec.staff_name] || 'ทีม 1'
      if (!teamsMap[teamName]) teamsMap[teamName] = []
      teamsMap[teamName].push(rec)
    })

    Object.entries(teamsMap).forEach(([teamName, teamStaffList]) => {
      const sheetData: any[][] = []

      sheetData.push([
        'U ID สำหรับกระทบยอด',
        'เวลาสำเร็จ',
        '',
        'รายชื่อทีม Event ภาคสนาม',
        'User Number พนักงาน',
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

      // ตกแต่งสไตล์ Excel (แถบหัวตารางสีเหลืองพาสเทล, เส้นขอบ, จัดตำแหน่ง)
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
              worksheet[cellAddress].s.fill = { fgColor: { rgb: 'FFF2CC' } } // สีเหลืองพาสเทล
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
        { wch: 32 }, // U ID สำหรับกระทบยอด
        { wch: 22 }, // เวลาสำเร็จ
        { wch: 4 },  // ช่องว่าง
        { wch: 24 }, // รายชื่อทีม Event ภาคสนาม
        { wch: 30 }, // User Number พนักงาน
      ]

      XLSX.utils.book_append_sheet(workbook, worksheet, teamName)
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
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            กระดานสรุปผลรายวัน (Daily KPI Board)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            นำเข้าไฟล์ Excel กระทบยอดเพื่อลงยอด KPI อัตโนมัติ จัดกลุ่มทีมแยก Sheet และส่งออกรายงานอย่างสวยงาม
          </p>
        </div>

        <button
          onClick={() => {
            fetchEmployeesList()
            fetchRecords()
          }}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เลือกวันที่ต้องการสร้างบอร์ด
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-3">
          <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            ทางเลือกที่ 1: นำเข้าไฟล์ Excel เพื่อกระทบยอดและสร้างบอร์ดประจำวัน
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                id="board-excel-input"
                className="hidden"
                onChange={(e) => setBoardExcelFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="board-excel-input"
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-medium text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {boardExcelFile
                    ? boardExcelFile.name
                    : 'คลิกเพื่อเลือกไฟล์ Excel กระทบยอดประจำวัน'}
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleImportExcelToCreateBoard}
              disabled={!boardExcelFile || importingBoard}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
            >
              {importingBoard ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังกระทบยอด...
                </>
              ) : (
                'กระทบยอด & ลงบอร์ด KPI'
              )}
            </button>
          </div>
        </div>

        {statusMessage.type === 'success' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage.message}</span>
          </div>
        )}

        {statusMessage.type === 'error' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{statusMessage.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmitManualStaff} className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              ทางเลือกที่ 2: เลือกและเพิ่มพนักงานด้วยตนเอง ({staffRows.length} คน)
            </p>
            <span className="text-[11px] text-slate-400">
              พนักงานในระบบ {employeesList.length} คน
            </span>
          </div>

          {staffRows.map((row, index) => (
            <div
              key={row.tempId}
              className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80"
            >
              <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                {index + 1}.
              </span>

              <div className="flex-1 min-w-[200px]">
                <select
                  required
                  value={row.staff_name}
                  onChange={(e) => handleSelectStaff(row.tempId, e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- เลือกพนักงาน --</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.full_name}>
                      {formatEmployeeLabel(emp)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id={`hasKpi-${row.tempId}`}
                  checked={row.has_kpi}
                  onChange={(e) =>
                    handleRowChange(row.tempId, 'has_kpi', e.target.checked)
                  }
                  className="w-3.5 h-3.5 rounded-xs text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor={`hasKpi-${row.tempId}`}
                  className="text-xs text-slate-700 font-semibold cursor-pointer select-none"
                >
                  {row.has_kpi ? 'มี KPI' : 'ไม่มี KPI'}
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
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveRow(row.tempId)}
                disabled={staffRows.length === 1}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่มพนักงานอีกคน
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              บันทึกพนักงาน ({staffRows.filter((r) => r.staff_name.trim()).length} คน)
            </button>
          </div>
        </form>
      </div>

      {selectedRecordIds.length > 0 && (
        <div className="bg-rose-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckSquare className="w-4 h-4 text-rose-300" />
            <span>
              เลือกอยู่ <strong>{selectedRecordIds.length}</strong> รายการ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRecordIds([])}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              ยกเลิกเลือก
            </button>
            <button
              onClick={handleDeleteSelectedRecords}
              className="px-3.5 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              ลบรายการที่เลือก ({selectedRecordIds.length})
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-xl overflow-hidden">
        <div className="bg-slate-950 text-white font-black text-center py-3 text-lg tracking-wider uppercase">
          DAILY KPI TRACKER
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold text-center border-b border-slate-300">
                <th className="p-3 border-r border-slate-300 w-48">วันที่</th>
                <th className="p-3 border-r border-slate-300">พนักงาน</th>
                <th className="p-3 border-r border-slate-300 w-44">
                  KPI (Target = 35)
                </th>
                <th className="p-3 border-r border-slate-300 w-36">
                  ผ่าน / ไม่ผ่าน
                </th>
                <th className="p-3 w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedRecords).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    ยังไม่มีข้อมูลรายวัน กรอกข้อมูลด้านบนหรืออัปโหลด Excel เพื่อสร้างบอร์ด
                  </td>
                </tr>
              ) : (
                Object.entries(groupedRecords).map(([dateStr, dateStaffList]) => {
                  const totalKpiAchieved = dateStaffList.reduce(
                    (a, b) => a + (b.has_kpi ? b.kpi_achieved : 0),
                    0
                  )
                  const totalTarget =
                    dateStaffList.filter((s) => s.has_kpi).length * 35
                  const isDayPassed =
                    totalKpiAchieved >= totalTarget && totalTarget > 0

                  const dayIds = dateStaffList
                    .map((r) => r.id)
                    .filter((id): id is string => !!id)
                  const isAllDaySelected =
                    dayIds.length > 0 &&
                    dayIds.every((id) => selectedRecordIds.includes(id))

                  return (
                    <tr key={dateStr} className="border-b-2 border-slate-800">
                      <td className="p-3 font-bold text-center border-r-2 border-slate-800 bg-slate-50 align-top space-y-2">
                        <div className="text-sm text-rose-600 font-extrabold">
                          {formatDateLabel(dateStr)}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenExportModal(dateStr)}
                            className="w-full text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-semibold flex items-center justify-center gap-1 transition-colors border border-emerald-200"
                            title="ดาวน์โหลดไฟล์ Excel แยกทีม"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ส่งออก Excel</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSelectDay(dateStaffList)}
                            className="text-[11px] text-slate-600 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
                            title="เลือกพนักงานทั้งหมดของวันนี้"
                          >
                            {isAllDaySelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>เลือกทั้งวัน ({dateStaffList.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEntireDay(dateStr)}
                            className="text-[11px] text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors border border-rose-200/60"
                            title="ลบข้อมูลบอร์ดประจำวันนี้ทั้งหมด"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>ลบทั้งวัน</span>
                          </button>
                        </div>
                      </td>

                      <td colSpan={4} className="p-0 align-top">
                        <table className="w-full text-xs">
                          <tbody>
                            {dateStaffList.map((staff, sIdx) => {
                              const isEditing = editingId === staff.id
                              const isStaffPassed =
                                staff.kpi_achieved >= staff.kpi_target
                              const staffBg =
                                sIdx % 2 === 0
                                  ? 'bg-amber-50/40'
                                  : 'bg-blue-50/40'
                              const isSelected = !!staff.id && selectedRecordIds.includes(staff.id)

                              return isEditing ? (
                                <tr
                                  key={staff.id}
                                  className="border-b border-blue-300 bg-blue-50/70"
                                >
                                  <td className="p-2 border-r border-slate-300">
                                    <select
                                      value={editForm.staff_name}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          staff_name: e.target.value,
                                        })
                                      }
                                      className="w-full px-2 py-1 bg-white border border-blue-400 rounded-md text-xs font-semibold focus:outline-hidden"
                                    >
                                      <option value="">-- เลือกพนักงาน --</option>
                                      {employeesList.map((emp) => (
                                        <option key={emp.id} value={emp.full_name}>
                                          {formatEmployeeLabel(emp)}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="p-2 border-r border-slate-300 w-44 text-center">
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
                                      className="w-24 px-2 py-1 bg-white border border-blue-400 rounded-md text-xs text-center font-mono font-bold focus:outline-hidden mx-auto block disabled:bg-slate-200"
                                    />
                                  </td>

                                  <td className="p-2 border-r border-slate-300 w-36 text-center">
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
                                        className="w-3.5 h-3.5 text-blue-600 rounded-xs"
                                      />
                                      <span className="text-[11px] text-slate-700 font-semibold">
                                        มี KPI
                                      </span>
                                    </label>
                                  </td>

                                  <td className="p-2 text-center w-24">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() =>
                                          staff.id && handleSaveEdit(staff.id)
                                        }
                                        className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                                        title="บันทึก"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-1 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"
                                        title="ยกเลิก"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <tr
                                  key={staff.id || sIdx}
                                  className={`border-b border-slate-200 transition-colors ${
                                    isSelected
                                      ? 'bg-rose-50/80'
                                      : 'hover:bg-slate-50/80'
                                  }`}
                                >
                                  <td
                                    className={`p-2.5 border-r border-slate-300 font-semibold text-slate-800 ${staffBg}`}
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
                                          className="w-3.5 h-3.5 text-rose-600 rounded-xs cursor-pointer"
                                        />
                                      )}
                                      <span>{getDisplayStaffName(staff.staff_name)}</span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 border-r border-slate-300 font-mono font-bold text-center w-44">
                                    {staff.has_kpi ? staff.kpi_achieved : '-'}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-300 text-center w-36 font-bold">
                                    {!staff.has_kpi ? (
                                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-xs text-[11px]">
                                        NO KPI
                                      </span>
                                    ) : isStaffPassed ? (
                                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-xs text-[11px]">
                                        ผ่าน
                                      </span>
                                    ) : (
                                      <span className="bg-red-600 text-white px-2 py-0.5 rounded-xs text-[11px]">
                                        ไม่ผ่าน
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-center w-24">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleStartEdit(staff)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="แก้ไข"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteRecord(staff.id)
                                        }
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                        title="ลบ"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}

                            <tr className="bg-slate-200/90 font-bold border-t border-slate-400">
                              <td className="p-2.5 border-r border-slate-300 text-slate-800">
                                Total
                              </td>
                              <td
                                className={`p-2.5 border-r border-slate-300 text-center font-mono ${
                                  !isDayPassed
                                    ? 'bg-red-600 text-white'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {totalKpiAchieved}
                              </td>
                              <td
                                className={`p-2.5 border-r border-slate-300 text-center ${
                                  isDayPassed
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {isDayPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
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

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  การจัดกลุ่มทีมและส่งออก Excel แยก Sheet ({formatDateLabel(exportDate)})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  กำหนดทีมพนักงานเพื่อสร้างไฟล์ Excel แยกตามรายชื่อทีมและดึง U ID ลูกค้าที่ตรงกัน
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  จำนวนทีมทั้งหมด:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={teamCount}
                    onChange={(e) => handleTeamCountChange(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} ทีม
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAutoDistributeTeams}
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold transition-colors text-[11px]"
                  >
                    แบ่งทีมเท่าๆ กัน
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                <p className="font-bold text-slate-700 sticky top-0 bg-white py-1">
                  กำหนดทีมของพนักงาน ({records.filter((r) => r.record_date === exportDate).length} คน)
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
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{label}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            User: {emp?.user_number || '-'} | KPI: {rec.kpi_achieved}
                          </p>
                        </div>

                        <select
                          value={teamAssignments[rec.staff_name] || 'ทีม 1'}
                          onChange={(e) =>
                            setTeamAssignments({
                              ...teamAssignments,
                              [rec.staff_name]: e.target.value,
                            })
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          {Array.from({ length: teamCount }).map((_, i) => (
                            <option key={i + 1} value={`ทีม ${i + 1}`}>
                              ทีม {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcelReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลดไฟล์ Excel (.xlsx)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}