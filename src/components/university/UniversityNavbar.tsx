import React from 'react';
import { SutLogo } from '../common/SutLogo';
import { StudentProfile, UserAccount } from '../../types';
import { BookOpen, Calendar, Newspaper, UserCheck, Search, ChevronRight, GraduationCap, Building2, User, ShieldCheck } from 'lucide-react';

interface Props {
  activeTab: 'home' | 'catalog' | 'events' | 'news' | 'about';
  onSelectTab: (tab: 'home' | 'catalog' | 'events' | 'news' | 'about') => void;
  onOpenSis: () => void;
  student: StudentProfile;
  currentUser: UserAccount | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export const UniversityNavbar: React.FC<Props> = ({ 
  activeTab, 
  onSelectTab, 
  onOpenSis, 
  student,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      {/* Top micro-bar */}
      <div className="bg-[#202738] text-gray-300 text-[11px] px-4 py-1 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span>Tenth of Ramadan City, Knowledge Hub, Egypt</span>
          <span className="hidden sm:inline text-gray-500">•</span>
          <span className="hidden sm:inline">Admissions Hotline: <strong>19788</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyan-300 font-medium">B.Tech Dual Study Polytechnic Degree</span>
          <span className="text-gray-500">•</span>
          <button
            type="button"
            onClick={() => onOpenAuth('signin')}
            className="text-white hover:text-emerald-400 font-semibold cursor-pointer flex items-center gap-1"
          >
            <User className="w-3 h-3 text-cyan-300" />
            <span>{currentUser ? `Signed in (${currentUser.name.split(' ')[0]})` : 'Sign In with Gmail'}</span>
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div
          onClick={() => onSelectTab('home')}
          className="cursor-pointer hover:opacity-95 transition-opacity"
        >
          <SutLogo className="h-12 sm:h-14" />
        </div>

        {/* Navigation links */}
        <nav className="hidden lg:flex items-center gap-1 text-[13.5px] font-medium text-gray-700">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-[#0c4ca3] font-bold bg-blue-50' : 'hover:text-[#0c4ca3] hover:bg-gray-50'
            }`}
          >
            Campus Home
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('catalog')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'catalog' ? 'text-[#0c4ca3] font-bold bg-blue-50' : 'hover:text-[#0c4ca3] hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#0c4ca3]" />
            Course Catalog
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('events')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'events' ? 'text-[#0c4ca3] font-bold bg-blue-50' : 'hover:text-[#0c4ca3] hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#0c4ca3]" />
            Event Calendar
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('news')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'news' ? 'text-[#0c4ca3] font-bold bg-blue-50' : 'hover:text-[#0c4ca3] hover:bg-gray-50'
            }`}
          >
            <Newspaper className="w-4 h-4 text-[#0c4ca3]" />
            Campus News
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('about')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'about' ? 'text-[#0c4ca3] font-bold bg-blue-50' : 'hover:text-[#0c4ca3] hover:bg-gray-50'
            }`}
          >
            About SUT
          </button>
        </nav>

        {/* Action Buttons: Direct Access to SIS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-launch-sis"
            onClick={onOpenSis}
            className="bg-[#6fa324] hover:bg-[#5f8e1e] text-white px-3 sm:px-4 py-2 rounded font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer group"
          >
            <UserCheck className="w-4 h-4" />
            <div className="text-left leading-tight hidden sm:block">
              <span className="block text-[11px] font-normal opacity-90">Student Portal (SIS)</span>
              <span className="block text-xs font-bold">
                {student.studentName ? `${student.studentName.split(' ')[0]} (${student.studentId})` : 'Student Portal'}
              </span>
            </div>
            <span className="sm:hidden">SIS Portal</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};
