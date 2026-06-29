-- ============================================================
-- KH Tutor 스키마 v2
-- ============================================================

-- 강사
CREATE TABLE IF NOT EXISTS instructors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id),
  name       text NOT NULL,
  phone      text NOT NULL,
  email      text,
  grade      text NOT NULL DEFAULT 'B' CHECK (grade IN ('S', 'A', 'B', 'C')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 학생
CREATE TABLE IF NOT EXISTS students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  phone      text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 등급별 단가표
CREATE TABLE IF NOT EXISTS grade_rates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade       text NOT NULL CHECK (grade IN ('S', 'A', 'B', 'C')),
  lesson_type text NOT NULL CHECK (lesson_type IN ('전공', '부전공', '전문반', '취미', '단체')),
  rate        integer NOT NULL DEFAULT 0,
  UNIQUE (grade, lesson_type)
);

-- 강사-학생 배정 (정규 스케줄)
CREATE TABLE IF NOT EXISTS assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_type   text NOT NULL CHECK (lesson_type IN ('전공', '부전공', '전문반', '취미')),
  day_of_week   integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- 단체수업
CREATE TABLE IF NOT EXISTS group_classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  name          text NOT NULL,
  day_of_week   integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- 단체수업 학생
CREATE TABLE IF NOT EXISTS group_students (
  group_id   uuid NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, student_id)
);

-- 수업 평가서
CREATE TABLE IF NOT EXISTS evaluations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES instructors(id),
  date          date NOT NULL,
  lesson_type   text NOT NULL CHECK (lesson_type IN ('전공', '부전공', '전문반', '취미', '단체')),
  student_id    uuid REFERENCES students(id),
  attended      boolean,
  group_id      uuid REFERENCES group_classes(id),
  group_name    text,
  content       text NOT NULL DEFAULT '',
  next_goal     text,
  status        text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved')),
  approved_at   timestamptz,
  created_at    timestamptz DEFAULT now(),
  CHECK (
    (student_id IS NOT NULL AND group_id IS NULL AND group_name IS NULL) OR
    (group_id IS NOT NULL AND student_id IS NULL AND group_name IS NULL) OR
    (group_name IS NOT NULL AND student_id IS NULL AND group_id IS NULL)
  )
);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE instructors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_classes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations    ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT auth.email() = 'noid80@hanmail.net'
$$;

CREATE OR REPLACE FUNCTION my_instructor_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM instructors WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "강사 조회"         ON instructors FOR SELECT USING (user_id = auth.uid() OR (email = auth.email() AND user_id IS NULL) OR is_admin());
CREATE POLICY "어드민 강사 관리"   ON instructors FOR ALL    USING (is_admin());

CREATE POLICY "학생 조회" ON students FOR SELECT USING (
  is_admin() OR
  id IN (SELECT student_id FROM assignments WHERE instructor_id = my_instructor_id() AND is_active) OR
  id IN (SELECT gs.student_id FROM group_students gs JOIN group_classes gc ON gs.group_id = gc.id WHERE gc.instructor_id = my_instructor_id())
);
CREATE POLICY "어드민 학생 관리" ON students FOR ALL USING (is_admin());

CREATE POLICY "단가 조회"         ON grade_rates FOR SELECT USING (true);
CREATE POLICY "어드민 단가 관리"   ON grade_rates FOR ALL    USING (is_admin());

CREATE POLICY "배정 조회"         ON assignments FOR SELECT USING (is_admin() OR instructor_id = my_instructor_id());
CREATE POLICY "어드민 배정 관리"   ON assignments FOR ALL    USING (is_admin());

CREATE POLICY "단체수업 조회"      ON group_classes FOR SELECT USING (is_admin() OR instructor_id = my_instructor_id());
CREATE POLICY "어드민 단체수업 관리" ON group_classes FOR ALL  USING (is_admin());

CREATE POLICY "단체학생 조회"      ON group_students FOR SELECT USING (
  is_admin() OR group_id IN (SELECT id FROM group_classes WHERE instructor_id = my_instructor_id())
);
CREATE POLICY "어드민 단체학생 관리" ON group_students FOR ALL USING (is_admin());

CREATE POLICY "평가서 조회"       ON evaluations FOR SELECT USING (is_admin() OR instructor_id = my_instructor_id());
CREATE POLICY "강사 평가서 작성"  ON evaluations FOR INSERT  WITH CHECK (instructor_id = my_instructor_id());
CREATE POLICY "강사 평가서 수정"  ON evaluations FOR UPDATE  USING (instructor_id = my_instructor_id() AND status = 'submitted');
CREATE POLICY "어드민 평가서 관리" ON evaluations FOR ALL    USING (is_admin());

-- ── 기본 단가 ─────────────────────────────────────────────────

INSERT INTO grade_rates (grade, lesson_type, rate) VALUES
  ('S','전공',40000),('S','부전공',35000),('S','전문반',32000),('S','취미',30000),('S','단체',27000),
  ('A','전공',35000),('A','부전공',30000),('A','전문반',28000),('A','취미',26000),('A','단체',23000),
  ('B','전공',30000),('B','부전공',27000),('B','전문반',25000),('B','취미',22000),('B','단체',20000),
  ('C','전공',25000),('C','부전공',22000),('C','전문반',20000),('C','취미',18000),('C','단체',15000)
ON CONFLICT (grade, lesson_type) DO NOTHING;
