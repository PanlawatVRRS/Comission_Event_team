import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Employee {
  id: string
  full_name: string
  nickname?: string
  phone?: string
  phone_number?: string
  user_number: string
  invitation_success: number
  created_at?: string
  updated_at?: string
}

export interface ReconciliationLog {
  id: string
  reconcile_date: string
  file_name: string
  total_records: number
  matched_users: number
  created_at: string
}