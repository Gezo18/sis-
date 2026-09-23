import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, X, RefreshCw } from 'lucide-react';
import { supabaseService, getSupabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const isConfigured = supabaseService.isConfigured();
  const projectUrl = supabaseService.getProjectUrl();

  const handleCopySchema = () => {
    const schemaSql = `-- ==============================================================================
-- ELSEWEDY UNIVERSITY OF TECHNOLOGY (SUT) - SUPABASE POSTGRESQL SCHEMA
-- Secure Row Level Security (RLS) Policies — least privilege
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

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_notes ENABLE ROW LEVEL SECURITY;

-- 7a. Drop old insecure "public" policies (safe to re-run)
DROP POLICY IF EXISTS "Public read students" ON public.students;
DROP POLICY IF EXISTS "Public insert/update students" ON public.students;
DROP POLICY IF EXISTS "Public read courses" ON public.courses;
DROP POLICY IF EXISTS "Public read enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Public read attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Public read requests" ON public.student_requests;
DROP POLICY IF EXISTS "Public read advisor_notes" ON public.advisor_notes;

-- 7b. Helper: check if current user is an advisor (university email domain)
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

-- 7c. Helper: get student_id for the currently authenticated user
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

-- 7d. SECURE RLS POLICIES — least privilege, no anonymous access

-- Students: read own row or advisor; modify advisor-only
CREATE POLICY "students_select_own_or_advisor"
  ON public.students FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "students_modify_advisor_only"
  ON public.students FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

-- Courses: read for all authenticated; modify advisor-only
CREATE POLICY "courses_select_authenticated"
  ON public.courses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "courses_modify_advisor_only"
  ON public.courses FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

-- Enrollments: read own or advisor; modify advisor-only
CREATE POLICY "enrollments_select_own_or_advisor"
  ON public.enrollments FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "enrollments_modify_advisor_only"
  ON public.enrollments FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

-- Attendance: read own or advisor; modify advisor-only
CREATE POLICY "attendance_select_own_or_advisor"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "attendance_modify_advisor_only"
  ON public.attendance_records FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

-- Student requests: read own or advisor; insert own; update/delete advisor-only
CREATE POLICY "requests_select_own_or_advisor"
  ON public.student_requests FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "requests_insert_own"
  ON public.student_requests FOR INSERT TO authenticated
  WITH CHECK (student_id = public.current_student_id());

CREATE POLICY "requests_update_advisor_only"
  ON public.student_requests FOR UPDATE TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "requests_delete_advisor_only"
  ON public.student_requests FOR DELETE TO authenticated
  USING (public.is_advisor());

-- Advisor notes: read own or advisor; modify advisor-only
CREATE POLICY "advisor_notes_select_own_or_advisor"
  ON public.advisor_notes FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "advisor_notes_modify_advisor_only"
  ON public.advisor_notes FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

-- 8. Seed Initial Data
INSERT INTO public.students (student_id, email, student_name, cgpa, academic_status, academic_warnings, registered_ch, total_passed_ch, level, student_program, advisor_name, advisor_email)
VALUES ('2300067', 'ahmed.eljeziry@gmail.com', 'Ahmed Elsayed Ahmed Hassan Eljeziry', 1.90, 'Academic Probation', 1, 11, 28, 1, 'Computer Science Technology (Dual Study)', 'Dr. Tarek Abdel-Azim', 'tarek.azim@sut.edu.eg')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.courses (course_code, title, credit_hours, lecture_hours, lab_hours, department, level, semester, description)
VALUES
('CS102', 'Structured Programming in C/C++', 3, 2, 2, 'Computer Science Technology', 1, 2, 'Core algorithmic thinking, arrays, memory management, pointers, and file I/O.'),
('MATH102', 'Linear Algebra & Discrete Structures', 3, 3, 0, 'Basic Sciences', 1, 2, 'Vector spaces, matrices, determinants, graph theory, and boolean logic.'),
('HUM231', 'Industrial Safety & Environmental Health', 2, 2, 0, 'Humanities', 1, 2, 'OSHA standards, workplace hazards in technology industries, risk mitigation.'),
('ET104', 'Digital Electronics & Microcontrollers', 3, 2, 2, 'Engineering Technology', 1, 2, 'Logic gates, flip-flops, microcontrollers, embedded C, and breadboard interfacing.')
ON CONFLICT (course_code) DO NOTHING;`;

    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const supabase = getSupabase();
    if (!supabase) {
      setTesting(false);
      setTestResult({
        success: false,
        message: 'Supabase client is not initialized. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
      });
      return;
    }

    try {
      const { count, error } = await supabase.from('students').select('*', { count: 'exact', head: true });
      if (error) {
        setTestResult({
          success: false,
          message: `Connection error: ${error.message}. Please verify your tables were created using the SQL schema below.`,
        });
      } else {
        setTestResult({
          success: true,
          message: `Successfully connected to Supabase! Accessible students table detected (${count ?? 0} records).`,
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `Network failure: ${e.message || 'Unable to reach Supabase API.'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#125875] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#0e4359]">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Supabase PostgreSQL Database Integration
              </h3>
              <p className="text-[11px] text-gray-300">
                Cloud persistence for SUT student records, course catalog, and faculty advising
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-[13px] text-gray-700">
          {/* Status Box */}
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${
            isConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}>
            {isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  {isConfigured ? 'Supabase Connected' : 'Supabase Client Ready (Local Storage Active)'}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  isConfigured ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isConfigured ? 'Live Cloud' : 'Local Fallback'}
                </span>
              </div>
              <p className="mt-1 text-gray-600 leading-relaxed">
                {isConfigured
                  ? `Active project URL: ${projectUrl}. Changes to student accounts, grades, and advisor directives will sync to Supabase.`
                  : 'The Supabase client is installed and configured in your codebase. Because environment variables (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) are not set yet, the app is running smoothly using durable local browser storage.'}
              </p>

              {isConfigured && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'Testing connection...' : 'Test Supabase Connection'}</span>
                  </button>
                </div>
              )}

              {testResult && (
                <div className={`mt-2 p-2 rounded text-xs font-medium border ${
                  testResult.success ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-white border-red-300 text-red-700'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-2.5">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Setup Checklist for Supabase</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600 pl-1">
              <li>
                Create a project at{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-700 hover:underline inline-flex items-center gap-0.5 font-semibold"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Go to the <strong>SQL Editor</strong> in your Supabase dashboard and run the schema script below.
              </li>
              <li>
                In the Settings menu or <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">.env.example</code>, add:
                <div className="bg-gray-800 text-gray-200 p-2 rounded mt-1 font-mono text-[11px] select-all">
                  VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
                </div>
              </li>
              <li>
                Your app will automatically synchronize student registration, teacher edits, grades, and attendance!
              </li>
            </ol>
          </div>

          {/* Copyable SQL Schema */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">PostgreSQL Schema (Secure RLS — Ready for Supabase SQL Editor)</span>
              <button
                type="button"
                onClick={handleCopySchema}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-semibold cursor-pointer border border-gray-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <pre className="bg-[#1e2330] text-gray-200 p-3 rounded text-[11px] font-mono max-h-48 overflow-y-auto border border-gray-800">
{`-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_notes ENABLE ROW LEVEL SECURITY;

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public read students" ON public.students;
DROP POLICY IF EXISTS "Public insert/update students" ON public.students;
-- ... (drops for all tables)

-- Helper: is the current user an advisor?
CREATE OR REPLACE FUNCTION public.is_advisor()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users
    WHERE email = auth.email() AND email LIKE '%@sut.edu.eg');
$$;

-- Helper: get student_id for current user
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS VARCHAR LANGUAGE sql SECURITY DEFINER AS $$
  SELECT s.student_id FROM public.students s
  JOIN auth.users u ON s.email = u.email
  WHERE u.id = auth.uid();
$$;

-- SECURE POLICIES (least privilege, authenticated only)
-- Students: read own row or advisor; modify advisor-only
CREATE POLICY "students_select_own_or_advisor"
  ON public.students FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_advisor());

CREATE POLICY "students_modify_advisor_only"
  ON public.students FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

-- ... (same pattern for all other tables)`}
            </pre>
            <p className="text-[11px] text-gray-500">
              The full schema file is also saved at <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">supabase/schema.sql</code>.
              <strong className="text-gray-700"> Click "Copy SQL Schema" for the complete script with all secure policies.</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0c4ca3] hover:bg-[#093a7d] text-white rounded font-medium text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
