import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  name: string
  badge_number: string
  role: 'admin' | 'user'
  station_id: string
  phone?: string
  created_at: string
}

export type Attendance = {
  id: string
  user_id: string
  punch_type: 'in' | 'out'
  timestamp: string
  latitude?: number
  longitude?: number
  photo_url?: string
  status: 'active' | 'inactive'
  created_at: string
  profiles?: Profile
}

export type LeaveRequest = {
  id: string
  user_id: string
  start_date: string
  end_date: string
  reason: string
  attachment_url?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_reason?: string
  approved_by?: string
  created_at: string
  updated_at: string
  profiles?: Profile
}