import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// แนะนำให้ใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local ถ้ามี เพื่อข้าม RLS ฝั่ง Server
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'ยังไม่ได้ตั้งค่า SUPABASE URL หรือ KEY ใน .env.local' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. รับไฟล์จาก FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' }, { status: 400 })
    }

    // 2. อ่านไฟล์ Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      return NextResponse.json({ error: 'ไม่พบ Sheet ข้อมูลในไฟล์ Excel' }, { status: 400 })
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลในไฟล์ Excel' }, { status: 400 })
    }

    // 3. อ่านและนับยอด User Number (รองรับหลายชื่อคอลัมน์ และตัดเว้นวรรค)
    const userCounts: Record<string, number> = {}
    let totalValidRows = 0

    rawData.forEach((row) => {
      const keys = Object.keys(row)
      
      // ค้นหาค่าจากคอลัมน์ A หรือคอลัมน์ชื่อ User number / User Number / user_number / ID
      const colAValue =
        row['User number'] ??
        row['User Number'] ??
        row['user_number'] ??
        row['User_Number'] ??
        row['User ID'] ??
        row['User_ID'] ??
        row[keys[0]]

      if (colAValue !== undefined && colAValue !== null) {
        const userNumberStr = String(colAValue).trim()

        if (userNumberStr && userNumberStr !== 'undefined' && userNumberStr !== 'null') {
          userCounts[userNumberStr] = (userCounts[userNumberStr] || 0) + 1
          totalValidRows++
        }
      }
    })

    if (totalValidRows === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูล User number ในไฟล์ Excel กรุณาเช็คหัวตารางคอลัมน์แรก' },
        { status: 400 }
      )
    }

    // 4. รีเซ็ตยอดเก่าในตาราง employees ให้เป็น 0 ทั้งหมดก่อน
    const { error: resetError } = await supabase
      .from('employees')
      .update({ invitation_success: 0, updated_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (resetError) {
      console.error('Reset Error:', resetError)
      return NextResponse.json(
        { error: `ไม่สามารถรีเซ็ตค่าเริ่มต้นใน DB ได้ (ติด RLS): ${resetError.message}` },
        { status: 500 }
      )
    }

    // 5. ดึงรายชื่อพนักงานทั้งหมดใน DB มาแมตช์หา user_number
    const { data: dbEmployees, error: fetchEmpErr } = await supabase
      .from('employees')
      .select('id, user_number')

    if (fetchEmpErr || !dbEmployees) {
      return NextResponse.json(
        { error: `ไม่สามารถดึงตารางพนักงานได้: ${fetchEmpErr?.message}` },
        { status: 500 }
      )
    }

    // 6. วนลูปอัปเดตยอดเข้าตาราง employees
    let matchedCount = 0
    const updatePromises = []

    for (const emp of dbEmployees) {
      const dbUserNumClean = String(emp.user_number || '').trim()
      const count = userCounts[dbUserNumClean] || 0

      if (count > 0) {
        matchedCount++
      }

      updatePromises.push(
        supabase
          .from('employees')
          .update({
            invitation_success: count,
            updated_at: new Date().toISOString(),
          })
          .eq('id', emp.id)
      )
    }

    await Promise.all(updatePromises)

    // 7. บันทึกประวัติสรุปการกระทบยอดรายวันลง reconciliation_logs
    const { error: logErr } = await supabase.from('reconciliation_logs').insert([
      {
        reconcile_date: new Date().toISOString().split('T')[0],
        file_name: file.name,
        total_records: totalValidRows,
        matched_users: matchedCount,
      },
    ])

    if (logErr) {
      console.error('Reconciliation Log Error:', logErr)
    }

    return NextResponse.json({
      success: true,
      totalImported: totalValidRows,
      uniqueUsers: matchedCount,
      message: `ประมวลผลสำเร็จ! พบข้อมูล ${totalValidRows} รายการ ตรงกับพนักงานในระบบ ${matchedCount} คน`,
    })
  } catch (err: any) {
    console.error('API Reconcile Error:', err)
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุบนเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}