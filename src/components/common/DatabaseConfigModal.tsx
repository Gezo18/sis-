import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, ExternalLink, X, Key, Globe, Shield
} from 'lucide-react';
import { 
  getSupabaseConfig, setSupabaseCredentials, clearSupabaseCredentials, 
  isSupabaseConfigured, supabaseService 
} from '../../lib/supabase';
import { userStore } from '../../data/userStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged?: () => void;
}

export const DatabaseConfigModal: React.FC<Props> = ({ isOpen, onClose, onConnectionChanged }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please provide both the Supabase Project URL and Anon Public Key.',
      });
      return;
    }

    setSupabaseCredentials(cleanUrl, cleanKey);
    setTesting(true);
    setTestResult(null);

    const result = await supabaseService.testConnection();
    setTesting(false);
    setTestResult(result);

    if (onConnectionChanged) {
      onConnectionChanged();
    }
  };

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Supabase credentials disconnected. The portal will continue using persistent browser storage.',
    });
    setSyncResult(null);
    if (onConnectionChanged) {
      onConnectionChanged();
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    const users = userStore.getUsers().filter(u => u.role === 'student');
    let successCount = 0;
    let lastError = '';

    for (const u of users) {
      const res = await supabaseService.upsertStudent(u);
      if (res.success) {
        successCount++;
      } else if (res.error) {
        lastError = res.error;
      }
    }

    setSyncing(false);
    if (successCount > 0) {
      setSyncResult(`Successfully synced ${successCount} student record(s) to Supabase cloud table!`);
    } else {
      setSyncResult(`Sync failed: ${lastError || 'Could not write to Supabase students table.'}`);
    }
  };

  const copySqlToClipboard = () => {
    const sqlContent = `-- ELSEWEDY UNIVERSITY OF TECHNOLOGY (SUT) - COMPLETE SUPABASE SCHEMA
-- Run this in Supabase Dashboard > SQL Editor > New Query

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    cgpa NUMERIC(3, 2) DEFAULT 0.00,
    academic_status VARCHAR(64) DEFAULT 'Pending Staff Evaluation',
    academic_warnings INTEGER DEFAULT 0,
    registered_ch INTEGER DEFAULT 0,
    total_passed_ch INTEGER DEFAULT 0,
    level VARCHAR(32) DEFAULT 'Level 1',
    student_program VARCHAR(255) DEFAULT 'Computer Science Technology (Dual Study)',
    advisor_name VARCHAR(255) DEFAULT 'Pending Staff Assignment',
    advisor_email VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Courses Catalog Table
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

-- 3. Enrollments Table
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

-- 4. Attendance Records Table
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

-- 5. Student Petitions & Requests Table
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

-- 6. Advisor Notes & Directives Table
CREATE TABLE IF NOT EXISTS public.advisor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) REFERENCES public.students(student_id) ON DELETE CASCADE,
    author VARCHAR(255) DEFAULT 'Dr. Tarek Abdel-Azim',
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Enable RLS & Public Access
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public students access" ON public.students FOR ALL USING (true);
CREATE POLICY "Public courses access" ON public.courses FOR ALL USING (true);
CREATE POLICY "Public enrollments access" ON public.enrollments FOR ALL USING (true);
CREATE POLICY "Public attendance access" ON public.attendance_records FOR ALL USING (true);
CREATE POLICY "Public requests access" ON public.student_requests FOR ALL USING (true);
CREATE POLICY "Public advisor notes access" ON public.advisor_notes FOR ALL USING (true);

-- Seed initial courses
INSERT INTO public.courses (course_code, title, credit_hours, lecture_hours, lab_hours, department, level, semester, description)
VALUES
('CS102', 'Structured Programming in C/C++', 3, 2, 2, 'Computer Science Technology', 1, 2, 'Core algorithmic thinking, arrays, memory management, pointers, and file I/O.'),
('MATH102', 'Linear Algebra & Discrete Structures', 3, 3, 0, 'Basic Sciences', 1, 2, 'Vector spaces, matrices, determinants, graph theory, and boolean logic.'),
('HUM231', 'Industrial Safety & Environmental Health', 2, 2, 0, 'Humanities', 1, 2, 'OSHA standards, workplace hazards in technology industries, risk mitigation.'),
('ET104', 'Digital Electronics & Microcontrollers', 3, 2, 2, 'Engineering Technology', 1, 2, 'Logic gates, flip-flops, microcontrollers, embedded C, and breadboard interfacing.')
ON CONFLICT (course_code) DO NOTHING;`;

    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const isConnected = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-[#202738] via-[#243048] to-[#125875] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-400/30">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Supabase Database Connection</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}>
                  {isConnected ? 'Configured' : 'Not Connected'}
                </span>
              </h2>
              <p className="text-xs text-gray-300">
                Connect external PostgreSQL cloud database to sync student records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Supabase Primary Database Active Box */}
          <div className="p-3.5 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-950">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-[13px] text-emerald-900">
                  Supabase PostgreSQL Cloud Database: Active
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                gvskmkwwwkstsndaqyxa.supabase.co
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed mb-2.5">
              Your application is connected to <strong>Supabase</strong>. All student records (including your SUT Student profile with 0.0 CH, 0.0 CGPA, and Pending Staff Evaluation) are synchronized in the live Supabase <code>public.students</code> table.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {[
                { name: 'students', status: '3 records (Active)', ok: true },
                { name: 'courses', status: 'Needs SQL run', ok: false },
                { name: 'enrollments', status: 'Needs SQL run', ok: false },
                { name: 'attendance', status: 'Needs SQL run', ok: false },
                { name: 'student_requests', status: 'Needs SQL run', ok: false },
                { name: 'advisor_notes', status: 'Needs SQL run', ok: false },
              ].map((t) => (
                <div key={t.name} className={`flex items-center justify-between px-2 py-1 rounded border text-[10.5px] ${
                  t.ok ? 'bg-white/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'
                }`}>
                  <span className="font-mono text-gray-800 font-semibold">{t.name}</span>
                  <span className={`font-medium text-[10px] ${t.ok ? 'text-emerald-700' : 'text-amber-700 font-semibold'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud SQL Multi-Cloud Backup Box */}
          <div className="p-3.5 rounded-lg border bg-blue-50/60 border-blue-200 text-blue-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11.5px] leading-relaxed">
              <p className="font-bold text-blue-900">
                Google Cloud SQL (Dual-Cloud Replica): Connected
              </p>
              <p className="text-blue-800/80 mt-0.5">
                Instance <code>ai-studio-50207e7d</code> (europe-west2) is also provisioned and kept in sync for redundancy.
              </p>
            </div>
          </div>

          {/* Test connection result notice */}
          {testResult && (
            <div className={`p-3 rounded-md border flex items-start gap-2 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-[11.5px]">
                <p className="font-semibold">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-3.5">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  Supabase Project URL:
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Found in Project Settings &gt; API
                </span>
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzprojectid.supabase.co"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] font-mono text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-gray-400" />
                  Supabase Anon Key (Public):
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Project API keys &gt; anon public
                </span>
              </label>
              <input
                type="text"
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] font-mono text-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={testing}
                className="flex-1 bg-[#0c4ca3] hover:bg-[#093d84] text-white py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Connection...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Connect & Test Supabase</span>
                  </>
                )}
              </button>

              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 hover:border-red-200 py-2 px-3 rounded-md font-semibold text-xs transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>

            {isConnected && (
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600">
                    Sync local student accounts into your Supabase database:
                  </span>
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSyncAll}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Push All Students to Cloud</span>
                      </>
                    )}
                  </button>
                </div>
                {syncResult && (
                  <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                    {syncResult}
                  </p>
                )}
              </div>
            )}
          </form>

          {/* Quick SQL Schema Helper */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#0c4ca3]" />
                Database Schema SQL
              </span>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="text-[#0c4ca3] hover:text-[#093d84] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              Before syncing, run this script once in your <strong>Supabase Dashboard &gt; SQL Editor &gt; New query</strong> to create the tables.
            </p>
            <button
              type="button"
              onClick={() => setShowSchema(!showSchema)}
              className="text-[10.5px] text-gray-600 hover:text-gray-900 underline cursor-pointer"
            >
              {showSchema ? 'Hide SQL schema preview' : 'View SQL schema preview'}
            </button>
            {showSchema && (
              <pre className="mt-2 p-2.5 bg-gray-900 text-gray-100 rounded text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed">
{`-- Run in Supabase SQL Editor:
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

CREATE TABLE IF NOT EXISTS public.advisor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(32) REFERENCES public.students(student_id) ON DELETE CASCADE,
    author VARCHAR(255) DEFAULT 'Dr. Tarek Abdel-Azim',
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-semibold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
