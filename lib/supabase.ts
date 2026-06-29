import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'implicit' },
})

export type Grade = 'S' | 'A+' | 'A' | 'A-' | 'B'
export type LessonType = '전공' | '오디션' | '부전공' | '전문반' | '취미' | '단체'
export type EvalStatus = 'submitted' | 'approved'

export interface Instructor {
  id: string
  user_id: string | null
  name: string
  phone: string
  email: string | null
  grade: Grade
  is_active: boolean
  created_at: string
}

export interface Student {
  id: string
  name: string
  phone: string | null
  is_active: boolean
  created_at: string
}

export interface GradeRate {
  id: string
  grade: Grade
  lesson_type: LessonType
  rate: number
}

export interface Assignment {
  id: string
  instructor_id: string
  student_id: string
  lesson_type: LessonType
  day_of_week: number | null
  start_time: string | null
  is_active: boolean
  created_at: string
  instructor?: Instructor
  student?: Student
}

export interface GroupClass {
  id: string
  instructor_id: string
  name: string
  day_of_week: number | null
  start_time: string | null
  is_active: boolean
  created_at: string
  instructor?: Instructor
  group_students?: { student: Student }[]
}

export interface Evaluation {
  id: string
  instructor_id: string
  date: string
  lesson_type: LessonType
  student_id: string | null
  attended: boolean | null
  group_id: string | null
  group_name: string | null
  content: string
  next_goal: string | null
  status: EvalStatus
  approved_at: string | null
  created_at: string
  instructor?: Instructor
  student?: Student
  group?: GroupClass
}
