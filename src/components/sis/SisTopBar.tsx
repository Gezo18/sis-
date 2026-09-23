import React from 'react';
import { SutLogo } from '../common/SutLogo';
import { StudentProfile, UserAccount } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Globe, Bell, LogOut, BookOpen, Calendar, ShieldAlert, User, ShieldCheck, UserCheck, Database } from 'lucide-react';

interface Props {
  student: StudentProfile;
  currentUser: UserAccount | null;
  currentMode: 'sis' | 'portal' | 'teacher';
  onSwitchMode: (mode: 'sis' | 'portal' | 'teacher') => void;
  onNavigateTab?: (tab: string) => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenDatabaseConfig?: () => void;
  onLogout: () => void;
  isAdvisorInspecting?: boolean;
}

export const SisTopBar: React.FC<Props> = ({ 
  student, 
  currentUser,
  currentMode, 
  onSwitchMode, 
  onNavigateTab,
  onOpenAuth,
  onOpenDatabaseConfig,
  onLogout,
  isAdvisorInspecting
}) => {
  const isProbation = student.academicStatus.toLowerCase().includes('probation');
  const isDbConnected = isSupabaseConfigured();

  return (
    <header className="bg-white border-b border-[#cfd6df] shadow-2xs">
      <div className="w-full px-3 py-1.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Elsewedy University of Technology Logo */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => onSwitchMode('portal')}
            className="cursor-pointer hover:opacity-95 transition-opacity"
            title="Elsewedy University of Technology"
          >
            <SutLogo className="h-13" />
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-gray-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#6ea324] px-2.5 py-0.5 rounded shadow-2xs">
              SIS Portal
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Academic Year 2025/2026 • Term 2
            </span>
          </div>
        </div>

        {/* Right: Welcome user + System controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Quick University navigation buttons */}
          <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-gray-200">
            <button
              type="button"
              onClick={() => onSwitchMode('portal')}
              className="px-2.5 py-1 text-gray-600 hover:text-[#0c4ca3] hover:bg-gray-100 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              University Website
            </button>
            <button
              type="button"
              onClick={() => {
                onSwitchMode('portal');
                if (onNavigateTab) onNavigateTab('catalog');
              }}
              className="px-2.5 py-1 text-gray-600 hover:text-[#0c4ca3] hover:bg-gray-100 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Course Catalog
            </button>
          </div>

          {/* Student Welcome display matching screenshot */}
          <div className="flex flex-col items-end">
            <div className="text-[#202738] font-semibold text-[13px] flex items-center gap-1.5">
              <span>Welcome</span>
              <span className="font-bold text-[#0c4ca3]">
                {student.studentName ? student.studentName.split(' ').slice(0, 2).join(' ') : (currentUser?.name || 'Student')}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <span>ID: <strong className="font-mono text-gray-700">{student.studentId || '—'}</strong></span>
              <span className="text-gray-300">•</span>
              <span className={`font-semibold flex items-center gap-1 ${
                isProbation ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {isProbation && <ShieldAlert className="w-3 h-3 text-amber-600" />}
                {student.academicStatus || 'Good Standing'}
              </span>
            </div>
          </div>

          {/* Account Controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
            {onOpenDatabaseConfig && (
              <button
                type="button"
                onClick={onOpenDatabaseConfig}
                className={`px-2 py-1 rounded font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer border ${
                  isDbConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                title="Supabase Database Connection & Status"
              >
                <Database className={`w-3.5 h-3.5 ${isDbConnected ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span className="hidden sm:inline">
                  {isDbConnected ? 'Supabase: Connected' : 'Connect Supabase'}
                </span>
              </button>
            )}

            {currentUser?.role === 'teacher' && (
              <button
                type="button"
                onClick={() => onSwitchMode('teacher')}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Return to Faculty & Advisor Console"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Advisor Console</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="px-2.5 py-1 text-[#0c4ca3] hover:bg-blue-50 border border-blue-200 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="Sign in with Gmail or switch accounts"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch Account</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
