-- ==============================================================================
-- ELSEWEDY UNIVERSITY OF TECHNOLOGY (SUT) - SUPABASE POSTGRESQL SCHEMA
-- Fixed: Secure Row Level Security (RLS) Policies
-- Ready for copy-paste in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

-- 1. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    cgpa NUMERIC(3, 2) DEFAULT 0.00,
    academic_status VARCHAR(64) DEFAULT 'Good Standing',
    academic_warnings INTEGER DEFAULT 0,
    registered_ch INTEGER DEFAULT 0,
    total_passed_ch INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    student_program VARCHAR(255) DEFAULT 'Computer Science Technology (Dual Study)',
    faculty_department VARCHAR(255) DEFAULT 'Faculty of Information Technology',
    advisor_name VARCHAR(255) DEFAULT 'Dr. Tarek Abdel-Azim',
    advisor_email VARCHAR(255) DEFAULT 'tarek.azim@sut.edu.eg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(32) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    credit_hours INTEGER NOT NULL,
    lecture_hours INTEGER DEFAULT 2,
    lab_hours INTEGER DEFAULT 2,
    department VARCHAR(128) NOT NULL,
    level INTEGER DEFAULT 1,
    semester INTEGER DEFAULT 1,
    prerequisites TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Student Course Enrollments & Grades
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) REFERENCES public.students(student_id) ON DELETE CASCADE,
    course_code VARCHAR(32) REFERENCES public.courses(course_code) ON DELETE CASCADE,
    semester VARCHAR(64) DEFAULT 'Spring 2026',
    status VARCHAR(32) DEFAULT 'registered',
    grade VARCHAR(8),
    points NUMERIC(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, course_code, semester)
);

-- 4. Create Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) REFERENCES public.students(student_id) ON DELETE CASCADE,
    course_code VARCHAR(32) REFERENCES public.courses(course_code) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 14,
    attended_sessions INTEGER DEFAULT 14,
    absent_sessions INTEGER DEFAULT 0,
    percentage NUMERIC(5, 2) DEFAULT 100.0,
    warning_status VARCHAR(32) DEFAULT 'Normal',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, course_code)
);

-- 5. Create Student Academic Petitions & Requests
CREATE TABLE IF NOT EXISTS public.student_requests (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(32) REFERENCES public.students(student_id) ON DELETE CASCADE,
    request_type VARCHAR(128) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Under Review',
    submitted_date DATE DEFAULT CURRENT_DATE,
    comments TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Advisor Directives & Meeting Notes
CREATE TABLE IF NOT EXISTS public.advisor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) REFERENCES public.students(student_id) ON DELETE CASCADE,
    author VARCHAR(255) DEFAULT 'Dr. Tarek Abdel-Azim',
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. Enable Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_notes ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 7a. Drop the old insecure "public" policies (safe to run — errors ignored
--     if they don't exist yet)
-- ==============================================================================
DROP POLICY IF EXISTS "Public read students" ON public.students;
DROP POLICY IF EXISTS "Public insert/update students" ON public.students;
DROP POLICY IF EXISTS "Public read courses" ON public.courses;
DROP POLICY IF EXISTS "Public read enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Public read attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Public read requests" ON public.student_requests;
DROP POLICY IF EXISTS "Public read advisor_notes" ON public.advisor_notes;

-- ==============================================================================
-- 7b. Helper function: check if the current user is an advisor/admin
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_advisor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = auth.email()
      AND email LIKE '%@sut.edu.eg'
  );
$$;

-- ==============================================================================
-- 7c. Helper function: get the student_id for the currently authenticated user
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS VARCHAR
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.student_id
  FROM public.students s
  JOIN auth.users u ON s.email = u.email
  WHERE u.id = auth.uid();
$$;

-- ==============================================================================
-- 7d. SECURE RLS POLICIES — least privilege, no anonymous access
-- ==============================================================================

-- ── STUDENTS ──────────────────────────────────────────────────────────────
CREATE POLICY "students_select_own_or_advisor"
  ON public.students FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "students_modify_advisor_only"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_advisor())
  WITH CHECK (public.is_advisor());

-- ── COURSES ───────────────────────────────────────────────────────────────
CREATE POLICY "courses_select_authenticated"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "courses_modify_advisor_only"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.is_advisor())
  WITH CHECK (public.is_advisor());

-- ── ENROLLMENTS ───────────────────────────────────────────────────────────
CREATE POLICY "enrollments_select_own_or_advisor"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "enrollments_modify_advisor_only"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.is_advisor())
  WITH CHECK (public.is_advisor());

-- ── ATTENDANCE RECORDS ────────────────────────────────────────────────────
CREATE POLICY "attendance_select_own_or_advisor"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "attendance_modify_advisor_only"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (public.is_advisor())
  WITH CHECK (public.is_advisor());

-- ── STUDENT REQUESTS ──────────────────────────────────────────────────────
CREATE POLICY "requests_select_own_or_advisor"
  ON public.student_requests FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "requests_insert_own"
  ON public.student_requests FOR INSERT
  TO authenticated
  WITH CHECK (student_id = public.current_student_id());

CREATE POLICY "requests_update_advisor_only"
  ON public.student_requests FOR UPDATE
  TO authenticated
  USING (public.is_advisor())
  WITH CHECK (public.is_advisor());

CREATE POLICY "requests_delete_advisor_only"
  ON public.student_requests FOR DELETE
  TO authenticated
  USING (public.is_advisor());

-- ── ADVISOR NOTES ─────────────────────────────────────────────────────────
CREATE POLICY "advisor_notes_select_own_or_advisor"
  ON public.advisor_notes FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "advisor_notes_modify_advisor_only"
  ON public.advisor_notes FOR ALL
  TO authenticated
  USING (public.is_advisor())
  WITH CHECK (public.is_advisor());

-- ==============================================================================
-- 8. Seed Initial Data
-- ==============================================================================
INSERT INTO public.students (student_id, email, student_name, cgpa, academic_status, academic_warnings, registered_ch, total_passed_ch, level, student_program, advisor_name, advisor_email)
VALUES
('2300067', 'ahmed.eljeziry@gmail.com', 'Ahmed Elsayed Ahmed Hassan Eljeziry', 1.90, 'Academic Probation', 1, 11, 28, 1, 'Computer Science Technology (Dual Study)', 'Dr. Tarek Abdel-Azim', 'tarek.azim@sut.edu.eg')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.courses (course_code, title, credit_hours, lecture_hours, lab_hours, department, level, semester, description)
VALUES
('CS102', 'Structured Programming in C/C++', 3, 2, 2, 'Computer Science Technology', 1, 2, 'Core algorithmic thinking, arrays, memory management, pointers, and file I/O.'),
('MATH102', 'Linear Algebra & Discrete Structures', 3, 3, 0, 'Basic Sciences', 1, 2, 'Vector spaces, matrices, determinants, graph theory, and boolean logic.'),
('HUM231', 'Industrial Safety & Environmental Health', 2, 2, 0, 'Humanities', 1, 2, 'OSHA standards, workplace hazards in technology industries, risk mitigation.'),
('ET104', 'Digital Electronics & Microcontrollers', 3, 2, 2, 'Engineering Technology', 1, 2, 'Logic gates, flip-flops, microcontrollers, embedded C, and breadboard interfacing.')
ON CONFLICT (course_code) DO NOTHING;

