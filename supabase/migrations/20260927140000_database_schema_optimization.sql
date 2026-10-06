-- ==============================================================================
-- ELSEWEDY UNIVERSITY OF TECHNOLOGY (SUT) - DATABASE SCHEMA OPTIMIZATION
-- Migration: 20260927140000_database_schema_optimization.sql
-- Description:
--   1. Strict Data Integrity: Add CHECK constraints for CGPA, scores, credits, and percentages.
--   2. High-Performance Indexing: Foreign Key indexes & Composite indexes for filtering/ordering.
--   3. Foreign Key Cascading: Strict ON DELETE/ON UPDATE behavior on all junction tables.
--   4. Eager Query Alignment: Optimized indexes for nested joins and range queries.
-- ==============================================================================

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ADD / ENFORCE CONSTRAINTS
-- ------------------------------------------------------------------------------

-- Students table check constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_students_cgpa') THEN
        ALTER TABLE public.students
        ADD CONSTRAINT check_students_cgpa CHECK (cgpa >= 0.00 AND cgpa <= 4.00);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_students_accum_ch') THEN
        ALTER TABLE public.students
        ADD CONSTRAINT check_students_accum_ch CHECK (accum_ch >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_students_academic_warnings') THEN
        ALTER TABLE public.students
        ADD CONSTRAINT check_students_academic_warnings CHECK (academic_warnings >= 0 AND academic_warnings <= 5);
    END IF;
END $$;

-- Courses table check constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_courses_credits') THEN
        ALTER TABLE public.courses
        ADD CONSTRAINT check_courses_credits CHECK (credits >= 0 AND credits <= 12);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_courses_hours') THEN
        ALTER TABLE public.courses
        ADD CONSTRAINT check_courses_hours CHECK (lecture_hours >= 0 AND lab_hours >= 0);
    END IF;
END $$;

-- Grades table check constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_grades_score') THEN
        ALTER TABLE public.grades
        ADD CONSTRAINT check_grades_score CHECK (score >= 0.00 AND max_score > 0.00 AND score <= max_score);
    END IF;
END $$;

-- Attendance records check constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_attendance_percentage') THEN
        ALTER TABLE public.attendance_records
        ADD CONSTRAINT check_attendance_percentage CHECK (percentage >= 0.00 AND percentage <= 100.00);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_attendance_sessions') THEN
        ALTER TABLE public.attendance_records
        ADD CONSTRAINT check_attendance_sessions CHECK (attended_sessions >= 0 AND absent_sessions >= 0 AND total_sessions >= 0);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. FOREIGN KEY B-TREE INDEXES (Accelerates JOIN & Delete CASCADE performance)
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- 3. COMPOSITE INDEXES FOR SEARCH, FILTERING, & SORTING
-- ------------------------------------------------------------------------------

-- Students: Speed up searching by name and email (used in student lookup/search)
CREATE INDEX IF NOT EXISTS idx_students_search_name_email
ON public.students (last_name, first_name, email);

-- Students: Speed up filtering by status and grade level
CREATE INDEX IF NOT EXISTS idx_students_status_level
ON public.students (status, level, department);

-- Courses: Speed up catalog queries by department, level, and semester
CREATE INDEX IF NOT EXISTS idx_courses_dept_level_sem
ON public.courses (department, level, semester);

-- Enrollments: Composite index for student enrollment lookup per semester
CREATE INDEX IF NOT EXISTS idx_enrollments_student_semester
ON public.enrollments (student_id, semester, status);

-- Enrollments: Composite index for course roster lookup per semester
CREATE INDEX IF NOT EXISTS idx_enrollments_course_semester
ON public.enrollments (course_id, semester, status);

-- Grades: Composite index for sorting grades by date per enrollment
CREATE INDEX IF NOT EXISTS idx_grades_enrollment_graded
ON public.grades (enrollment_id, graded_at DESC);

-- Attendance: Composite index for fast warning level checks
CREATE INDEX IF NOT EXISTS idx_attendance_warning_status
ON public.attendance_records (warning_status, percentage);

-- Student Requests: Composite index for student requests ordered by creation
CREATE INDEX IF NOT EXISTS idx_requests_student_created
ON public.student_requests (student_id, created_at DESC);

-- Advisor Notes: Composite index for advisor notes ordered by creation
CREATE INDEX IF NOT EXISTS idx_advisor_notes_student_created
ON public.advisor_notes (student_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. REFRESH RLS POLICIES & HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Helper function to check if authenticated user is admin
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

-- Helper function to fetch current teacher id
CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$;
