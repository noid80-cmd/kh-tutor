import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'implicit' },
})

export type Role = 'admin' | 'instructor'
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'makeup'
export type ChangeStatus = 'pending' | 'approved' | 'rejected'

export interface Instructor {
  id: string
  user_id: string | null
  name: string
  phone: string
  rate_per_lesson: number
  is_active: boolean
  created_at: string
}

export interface Student {
  id: string
  name: string
  phone: string
  instructor_id: string
  is_active: boolean
  created_at: string
  instructor?: Instructor
}

export interface LessonSchedule {
  id: string
  student_id: string
  instructor_id: string
  day_of_week: number  // 0=일 1=월 2=화 3=수 4=목 5=금 6=토
  start_time: string   // HH:MM
  duration_minutes: number
  start_date: string
  end_date: string | null
  is_active: boolean
  student?: Student
  instructor?: Instructor
}

export interface Lesson {
  id: string
  schedule_id: string | null
  instructor_id: string
  student_id: string
  date: string
  start_time: string
  duration_minutes: number
  status: LessonStatus
  is_makeup: boolean
  original_lesson_id: string | null
  created_at: string
  instructor?: Instructor
  student?: Student
  class_report?: ClassReport
}

export interface ClassReport {
  id: string
  lesson_id: string
  instructor_id: string
  student_id: string
  date: string
  content: string
  next_goal: string
  student_memo: string
  admin_approved_at: string | null
  created_at: string
}

export interface ChangeRequest {
  id: string
  lesson_id: string
  requested_by: string
  reason: string
  new_date: string | null
  new_time: string | null
  status: ChangeStatus
  created_at: string
  lesson?: Lesson
}
