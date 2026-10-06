-- ==============================================================================
-- ELSEWEDY UNIVERSITY OF TECHNOLOGY (SUT) - SUPABASE POSTGRESQL SCHEMA
-- Fully Idempotent Schema with Strict Integrity Constraints, High-Performance
-- Composite Indexes, and Fine-Grained Row-Level Security (RLS) Policies
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(128) DEFAULT 'Faculty of Information Technology',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) UNIQUE,
    first_name VARCHAR(128) DEFAULT '',
    last_name VARCHAR(128) DEFAULT '',
    student_name VARCHAR(255) GENERATED ALWAYS AS (
      CASE WHEN first_name <> '' THEN first_name || ' ' || last_name ELSE '' END
    ) STORED,
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE,
    grade_level VARCHAR(64) DEFAULT 'Level 1',
    field VARCHAR(128) DEFAULT 'Field of Engineering Technology',
    program VARCHAR(255) DEFAULT 'Computer Science Technology (Dual Study)',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(32) DEFAULT 'active',
    cgpa NUMERIC(3, 2) DEFAULT 0.00 CONSTRAINT check_students_cgpa CHECK (cgpa >= 0.00 AND cgpa <= 4.00),
    accum_ch INTEGER DEFAULT 0 CONSTRAINT check_students_accum_ch CHECK (accum_ch >= 0),
    academic_status VARCHAR(64) DEFAULT 'Good Standing',
    academic_warnings INTEGER DEFAULT 0 CONSTRAINT check_students_academic_warnings CHECK (academic_warnings >= 0 AND academic_warnings <= 5),
    registered_ch INTEGER DEFAULT 0 CONSTRAINT check_students_registered_ch CHECK (registered_ch >= 0),
    total_passed_ch INTEGER DEFAULT 0 CONSTRAINT check_students_passed_ch CHECK (total_passed_ch >= 0),
    level INTEGER DEFAULT 1 CONSTRAINT check_students_level CHECK (level >= 1 AND level <= 5),
    student_program VARCHAR(255) DEFAULT 'Computer Science Technology (Dual Study)',
    faculty_department VARCHAR(255) DEFAULT 'Faculty of Information Technology',
    advisor_name VARCHAR(255) DEFAULT 'Dr. Tarek Abdel-Azim',
    advisor_email VARCHAR(255) DEFAULT 'tarek.azim@sut.edu.eg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    course_code VARCHAR(32) GENERATED ALWAYS AS (code) STORED,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) GENERATED ALWAYS AS (name) STORED,
    credits INTEGER DEFAULT 3 CONSTRAINT check_courses_credits CHECK (credits >= 0 AND credits <= 12),
    credit_hours INTEGER GENERATED ALWAYS AS (credits) STORED,
    lecture_hours INTEGER DEFAULT 2 CONSTRAINT check_courses_lec CHECK (lecture_hours >= 0),
    lab_hours INTEGER DEFAULT 2 CONSTRAINT check_courses_lab CHECK (lab_hours >= 0),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    department VARCHAR(128) DEFAULT 'Computer Science Technology',
    level INTEGER DEFAULT 1 CONSTRAINT check_courses_level CHECK (level >= 1 AND level <= 5),
    semester INTEGER DEFAULT 1 CONSTRAINT check_courses_semester CHECK (semester >= 1 AND semester <= 10),
    prerequisites TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    semester VARCHAR(64) DEFAULT 'Spring 2026',
    status VARCHAR(32) DEFAULT 'enrolled',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    grade VARCHAR(8),
    points NUMERIC(3, 2) CONSTRAINT check_enrollments_points CHECK (points IS NULL OR (points >= 0.00 AND points <= 4.00)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, course_id, semester)
);

-- 6. Create Grades Table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    grade_type VARCHAR(64) DEFAULT 'Assignment',
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) DEFAULT 100.0,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_grades_score CHECK (score >= 0.00 AND max_score > 0.00 AND score <= max_score)
);

-- 7. Create Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 14 CONSTRAINT check_attendance_total CHECK (total_sessions >= 0),
    attended_sessions INTEGER DEFAULT 14 CONSTRAINT check_attendance_attended CHECK (attended_sessions >= 0),
    absent_sessions INTEGER DEFAULT 0 CONSTRAINT check_attendance_absent CHECK (absent_sessions >= 0),
    percentage NUMERIC(5, 2) DEFAULT 100.0 CONSTRAINT check_attendance_pct CHECK (percentage >= 0.00 AND percentage <= 100.00),
    warning_status VARCHAR(32) DEFAULT 'Normal',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, course_id)
);

-- 8. Create Student Academic Petitions & Requests
CREATE TABLE IF NOT EXISTS public.student_requests (
    id VARCHAR(64) PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    request_type VARCHAR(128) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Under Review',
    submitted_date DATE DEFAULT CURRENT_DATE,
    comments TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Advisor Directives & Meeting Notes
CREATE TABLE IF NOT EXISTS public.advisor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    author VARCHAR(255) DEFAULT 'Dr. Tarek Abdel-Azim',
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- FOREIGN KEY & COMPOSITE INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ------------------------------------------------------------------------------

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins (user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers (user_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses (teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON public.grades (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance_records (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON public.attendance_records (course_id);
CREATE INDEX IF NOT EXISTS idx_requests_student_id ON public.student_requests (student_id);
CREATE INDEX IF NOT EXISTS idx_advisor_notes_student_id ON public.advisor_notes (student_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_students_search_name_email ON public.students (last_name, first_name, email);
CREATE INDEX IF NOT EXISTS idx_students_status_level ON public.students (status, level, faculty_department);
CREATE INDEX IF NOT EXISTS idx_courses_dept_level_sem ON public.courses (department, level, semester);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_semester ON public.enrollments (student_id, semester, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_semester ON public.enrollments (course_id, semester, status);
CREATE INDEX IF NOT EXISTS idx_grades_enrollment_graded ON public.grades (enrollment_id, graded_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_warning_status ON public.attendance_records (warning_status, percentage);
CREATE INDEX IF NOT EXISTS idx_requests_student_created ON public.student_requests (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisor_notes_student_created ON public.advisor_notes (student_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_notes ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ) OR (
    SELECT NOT EXISTS (SELECT 1 FROM public.teachers WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ═══════════════════════════════════════════════
-- RLS Policies (Idempotent)
-- ═══════════════════════════════════════════════

-- Admins
DROP POLICY IF EXISTS "Admins: full access for admins" ON public.admins;
CREATE POLICY "Admins: full access for admins"
  ON public.admins FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Students
DROP POLICY IF EXISTS "Students: select for authenticated"   ON public.students;
DROP POLICY IF EXISTS "Students: insert for teachers and admins" ON public.students;
DROP POLICY IF EXISTS "Students: update for admins only"     ON public.students;
DROP POLICY IF EXISTS "Students: delete for admins only"     ON public.students;

CREATE POLICY "Students: select for authenticated"
  ON public.students FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Students: insert for teachers and admins"
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Students: update for admins only"
  ON public.students FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Students: delete for admins only"
  ON public.students FOR DELETE TO authenticated
  USING (public.is_admin());

-- Teachers
DROP POLICY IF EXISTS "Teachers: select for authenticated"   ON public.teachers;
DROP POLICY IF EXISTS "Teachers: insert for admins"          ON public.teachers;
DROP POLICY IF EXISTS "Teachers: update own profile or admin" ON public.teachers;
DROP POLICY IF EXISTS "Teachers: delete for admins only"     ON public.teachers;

CREATE POLICY "Teachers: select for authenticated"
  ON public.teachers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Teachers: insert for admins"
  ON public.teachers FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Teachers: update own profile or admin"
  ON public.teachers FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Teachers: delete for admins only"
  ON public.teachers FOR DELETE TO authenticated
  USING (public.is_admin());

-- Courses
DROP POLICY IF EXISTS "Courses: select for authenticated"    ON public.courses;
DROP POLICY IF EXISTS "Courses: insert for teachers and admins" ON public.courses;
DROP POLICY IF EXISTS "Courses: update for teacher or admin" ON public.courses;
DROP POLICY IF EXISTS "Courses: delete for teacher or admin" ON public.courses;

CREATE POLICY "Courses: select for authenticated"
  ON public.courses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Courses: insert for teachers and admins"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR teacher_id = public.current_teacher_id());

CREATE POLICY "Courses: update for teacher or admin"
  ON public.courses FOR UPDATE TO authenticated
  USING (public.is_admin() OR teacher_id = public.current_teacher_id())
  WITH CHECK (public.is_admin() OR teacher_id = public.current_teacher_id());

CREATE POLICY "Courses: delete for teacher or admin"
  ON public.courses FOR DELETE TO authenticated
  USING (public.is_admin() OR teacher_id = public.current_teacher_id());

-- Enrollments
DROP POLICY IF EXISTS "Enrollments: select for authenticated" ON public.enrollments;
DROP POLICY IF EXISTS "Enrollments: insert for own course or admin" ON public.enrollments;
DROP POLICY IF EXISTS "Enrollments: update for own course or admin" ON public.enrollments;
DROP POLICY IF EXISTS "Enrollments: delete for own course or admin" ON public.enrollments;

CREATE POLICY "Enrollments: select for authenticated"
  ON public.enrollments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enrollments: insert for own course or admin"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    course_id IN (SELECT id FROM public.courses WHERE teacher_id = public.current_teacher_id())
  );

CREATE POLICY "Enrollments: update for own course or admin"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    course_id IN (SELECT id FROM public.courses WHERE teacher_id = public.current_teacher_id())
  )
  WITH CHECK (
    public.is_admin() OR
    course_id IN (SELECT id FROM public.courses WHERE teacher_id = public.current_teacher_id())
  );

CREATE POLICY "Enrollments: delete for own course or admin"
  ON public.enrollments FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    course_id IN (SELECT id FROM public.courses WHERE teacher_id = public.current_teacher_id())
  );

-- Grades
DROP POLICY IF EXISTS "Grades: select for authenticated"       ON public.grades;
DROP POLICY IF EXISTS "Grades: teacher inserts for own courses" ON public.grades;
DROP POLICY IF EXISTS "Grades: teacher updates for own courses" ON public.grades;
DROP POLICY IF EXISTS "Grades: teacher deletes for own courses" ON public.grades;

CREATE POLICY "Grades: select for authenticated"
  ON public.grades FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Grades: teacher inserts for own courses"
  ON public.grades FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      JOIN public.courses c ON c.id = e.course_id
      WHERE c.teacher_id = public.current_teacher_id()
    )
  );

CREATE POLICY "Grades: teacher updates for own courses"
  ON public.grades FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      JOIN public.courses c ON c.id = e.course_id
      WHERE c.teacher_id = public.current_teacher_id()
    )
  )
  WITH CHECK (
    public.is_admin() OR
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      JOIN public.courses c ON c.id = e.course_id
      WHERE c.teacher_id = public.current_teacher_id()
    )
  );

CREATE POLICY "Grades: teacher deletes for own courses"
  ON public.grades FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      JOIN public.courses c ON c.id = e.course_id
      WHERE c.teacher_id = public.current_teacher_id()
    )
  );

-- Attendance, Requests & Notes
DROP POLICY IF EXISTS "Attendance: manage for teacher and admin" ON public.attendance_records;
DROP POLICY IF EXISTS "Requests: manage for teacher and admin" ON public.student_requests;
DROP POLICY IF EXISTS "Advisor notes: manage for teacher and admin" ON public.advisor_notes;

CREATE POLICY "Attendance: manage for teacher and admin"
  ON public.attendance_records FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Requests: manage for teacher and admin"
  ON public.student_requests FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Advisor notes: manage for teacher and admin"
  ON public.advisor_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
