-- KH Tutor 데이터베이스 스키마

-- 강사
CREATE TABLE instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  phone text NOT NULL,
  rate_per_lesson integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 학생
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  instructor_id uuid NOT NULL REFERENCES instructors(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 정규 수업 스케줄
CREATE TABLE lesson_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  instructor_id uuid NOT NULL REFERENCES instructors(id),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  start_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 개별 수업 (실제 발생 수업)
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES lesson_schedules(id),
  instructor_id uuid NOT NULL REFERENCES instructors(id),
  student_id uuid NOT NULL REFERENCES students(id),
  date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'makeup')),
  is_makeup boolean NOT NULL DEFAULT false,
  original_lesson_id uuid REFERENCES lessons(id),
  created_at timestamptz DEFAULT now()
);

-- 수업 평가서
CREATE TABLE class_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id),
  instructor_id uuid NOT NULL REFERENCES instructors(id),
  student_id uuid NOT NULL REFERENCES students(id),
  date date NOT NULL,
  content text NOT NULL,
  next_goal text,
  student_memo text,
  admin_approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE instructors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_reports   ENABLE ROW LEVEL SECURITY;

-- 관리자 이메일 체크 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT auth.email() = 'noid80@hanmail.net'
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS 정책: 강사는 본인 데이터만, 관리자는 전체
CREATE POLICY "강사 조회" ON instructors FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "관리자 전체 관리" ON instructors FOR ALL USING (is_admin());

CREATE POLICY "학생 조회" ON students FOR SELECT USING (
  is_admin() OR instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);
CREATE POLICY "관리자 학생 관리" ON students FOR ALL USING (is_admin());

CREATE POLICY "스케줄 조회" ON lesson_schedules FOR SELECT USING (
  is_admin() OR instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);
CREATE POLICY "관리자 스케줄 관리" ON lesson_schedules FOR ALL USING (is_admin());

CREATE POLICY "수업 조회" ON lessons FOR SELECT USING (
  is_admin() OR instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);
CREATE POLICY "관리자 수업 관리" ON lessons FOR ALL USING (is_admin());
CREATE POLICY "강사 수업 상태 업데이트" ON lessons FOR UPDATE USING (
  instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);

CREATE POLICY "평가서 조회" ON class_reports FOR SELECT USING (
  is_admin() OR instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);
CREATE POLICY "강사 평가서 작성" ON class_reports FOR INSERT WITH CHECK (
  instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);
CREATE POLICY "관리자 평가서 관리" ON class_reports FOR ALL USING (is_admin());
