'use client'

import { useEffect, useState } from 'react'
import { supabase, Employee } from '@/lib/supabase'
import CommissionTable from '@/components/CommissionTable'
import EmployeeModal from '@/components/EmployeeModal'
import { UserPlus, Users, RefreshCw } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch Employees Error:', error)
    } else if (data) {
      setEmployees(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleSaveEmployee = async (employeeData: Partial<Employee>) => {
    // กำหนดค่าเบอร์โทรให้แน่ใจว่าเป็น string (ถ้าไม่มีส่งไปเป็น '')
    const phoneVal = employeeData.phone || (employeeData as any).phone_number || ''

    if (employeeData.id) {
      // แก้ไขพนักงาน
      const { error } = await supabase
        .from('employees')
        .update({
          full_name: employeeData.full_name,
          nickname: employeeData.nickname,
          phone_number: phoneVal,
          user_number: employeeData.user_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeData.id)

      if (error) throw new Error(error.message)
    } else {
      // เพิ่มพนักงานใหม่
      const { error } = await supabase.from('employees').insert([
        {
          full_name: employeeData.full_name,
          nickname: employeeData.nickname,
          phone_number: phoneVal,
          user_number: employeeData.user_number,
          invitation_success: 0,
        },
      ])

      if (error) throw new Error(error.message)
    }

    await fetchEmployees()
  }

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลพนักงานรายนี้ใช่หรือไม่?')) {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) {
        alert(`ไม่สามารถลบพนักงานได้: ${error.message}`)
      } else {
        fetchEmployees()
      }
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            ระบบจัดการพนักงาน
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            เพิ่ม แก้ไข หรือลบรายชื่อพนักงาน ชื่อเล่น เบอร์โทรศัพท์ และ User Number
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmployees}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
          <button
            onClick={() => {
              setSelectedEmployee(null)
              setIsModalOpen(true)
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            เพิ่มพนักงานใหม่
          </button>
        </div>
      </div>

      <CommissionTable
        employees={employees}
        onEdit={(emp) => {
          setSelectedEmployee(emp)
          setIsModalOpen(true)
        }}
        onDelete={handleDeleteEmployee}
      />

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
      />
    </div>
  )
}