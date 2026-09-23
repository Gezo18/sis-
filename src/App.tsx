import React, { useState, useEffect } from 'react';
import { initialStudentProfile } from './data/mockData';
import { StudentProfile, UserAccount } from './types';
import { userStore } from './data/userStore';

// Auth Components
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';
import { DatabaseConfigModal } from './components/common/DatabaseConfigModal';
import { isSupabaseConfigured } from './lib/supabase';

// Faculty Advisor Console
import { TeacherDashboard } from './components/teacher/TeacherDashboard';

// SIS Components
import { SisTopBar } from './components/sis/SisTopBar';
import { SisSidebar, SisView } from './components/sis/SisSidebar';
import { SisHomePage } from './components/sis/SisHomePage';
import { SisAcademicPlan } from './components/sis/SisAcademicPlan';
import { SisAttendance } from './components/sis/SisAttendance';
import { SisActivityMarks } from './components/sis/SisActivityMarks';
import { SisExamSchedule } from './components/sis/SisExamSchedule';
import { SisRequests } from './components/sis/SisRequests';
import { SisStaff } from './components/sis/SisStaff';
import { SisReports } from './components/sis/SisReports';
import { SisFooter } from './components/sis/SisFooter';

// University Public Components
import { UniversityNavbar } from './components/university/UniversityNavbar';
import { CampusHome } from './components/university/CampusHome';
import { CourseCatalog } from './components/university/CourseCatalog';
import { EventCalendar } from './components/university/EventCalendar';
import { CampusNewsSection } from './components/university/CampusNewsSection';
import { AboutSection } from './components/university/AboutSection';
import { UniversityFooter } from './components/university/UniversityFooter';

import { UserCheck, UserPlus, LogIn, GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => userStore.getCurrentUser());
  const [inspectedStudent, setInspectedStudent] = useState<UserAccount | null>(null);

  const [student, setStudent] = useState<StudentProfile>(() => {
    const current = userStore.getCurrentUser();
    if (current?.role === 'student' && current.studentProfile) return current.studentProfile;
    // If faculty or guest, default to demo student Ahmed
    const demo = userStore.getUsers().find(u => u.studentProfile?.studentId === '250103180');
    if (demo?.studentProfile) return demo.studentProfile;
    return initialStudentProfile;
  });

  const [appMode, setAppMode] = useState<'sis' | 'portal' | 'teacher'>(() => {
    const current = userStore.getCurrentUser();
    if (current?.role === 'teacher') return 'teacher';
    return 'sis';
  });

  const [activeSisView, setActiveSisView] = useState<SisView>('home');
  const [activeUniTab, setActiveUniTab] = useState<'home' | 'catalog' | 'events' | 'news' | 'about'>('home');

  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Sync student profile when user logs in or is edited
  const refreshUserData = () => {
    const freshUser = userStore.getCurrentUser();
    setCurrentUser(freshUser);
    if (inspectedStudent) {
      const refreshedInspected = userStore.getUsers().find(u => u.id === inspectedStudent.id);
      if (refreshedInspected) {
        setInspectedStudent(refreshedInspected);
        if (refreshedInspected.studentProfile) {
          setStudent(refreshedInspected.studentProfile);
        }
      }
    } else if (freshUser?.role === 'student' && freshUser.studentProfile) {
      setStudent(freshUser.studentProfile);
    }
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setInspectedStudent(null);
    if (user.role === 'teacher') {
      setAppMode('teacher');
    } else {
      if (user.studentProfile) {
        setStudent(user.studentProfile);
      }
      setAppMode('sis');
      setActiveSisView('home');
    }
  };

  const handleLogout = () => {
    userStore.setCurrentUser(null);
    setCurrentUser(null);
    setInspectedStudent(null);
    const demo = userStore.getUsers().find(u => u.studentProfile?.studentId === '250103180');
    setStudent(demo?.studentProfile || initialStudentProfile);
    setAppMode('sis');
    setActiveSisView('home');
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleOpenSisToRegister = (courseCode: string) => {
    setActiveSisView('req-register-add-drop');
    setAppMode('sis');
  };

  // When opening the site without an active session, display the Login Page immediately
  if (!currentUser && appMode !== 'portal') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f3f5f8] text-gray-900 font-sans">
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBrowsePublicSite={() => setAppMode('portal')}
          onOpenDatabaseConfig={() => setIsDbModalOpen(true)}
        />
        <DatabaseConfigModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          onConnectionChanged={refreshUserData}
        />
      </div>
    );
  }

  // Active student session or inspected student account
  const activeStudentAccount = inspectedStudent || (currentUser?.role === 'student' ? currentUser : null);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] text-gray-900 font-sans selection:bg-[#6fa324] selection:text-white">
      {/* Top Global Quick-Switch Ribbon */}
      <div className="bg-[#1b212f] text-white px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-gray-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-gray-200">
            {appMode === 'sis'
              ? 'Student Information System (SIS)'
              : appMode === 'teacher'
              ? 'Faculty & Academic Advisor Console'
              : 'University Public Website & Catalog'}
          </span>
          <span className="text-gray-500 hidden sm:inline">•</span>
          <span className="text-gray-400 hidden sm:inline">
            {currentUser ? (
              <>
                Account: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email})
                {currentUser.role === 'teacher' && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-semibold text-[10px]">
                    Faculty Advisor
                  </span>
                )}
              </>
            ) : (
              <span className="text-amber-300 font-medium">Guest Session</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'teacher' && (
            <button
              type="button"
              onClick={() => {
                setInspectedStudent(null);
                setAppMode('teacher');
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                appMode === 'teacher'
                  ? 'bg-amber-400 text-gray-950 font-black shadow-xs'
                  : 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Advisor Console</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAppMode(appMode === 'sis' ? 'portal' : 'sis')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
              appMode === 'sis' ? 'bg-emerald-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            SIS Portal
          </button>

          <button
            type="button"
            onClick={() => setAppMode('portal')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
              appMode === 'portal' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            Public Website
          </button>

          <button
            type="button"
            onClick={() => handleOpenAuth('signin')}
            className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-white text-gray-900 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-1"
          >
            <LogIn className="w-3 h-3" />
            <span>Switch / Sign In</span>
          </button>
        </div>
      </div>

      {/* RENDER MODE: FACULTY & ADVISOR CONSOLE */}
      {appMode === 'teacher' && currentUser && (
        <TeacherDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchToPortal={() => setAppMode('portal')}
          onSwitchToStudentView={(selectedStudentUser) => {
            if (selectedStudentUser.studentProfile) {
              setStudent(selectedStudentUser.studentProfile);
            }
            setInspectedStudent(selectedStudentUser);
            setAppMode('sis');
            setActiveSisView('home');
          }}
        />
      )}

      {/* RENDER MODE: SIS STUDENT INFORMATION SYSTEM */}
      {appMode === 'sis' && (
        <div className="flex-1 flex flex-col bg-white">
          {/* Advisor Inspection Ribbon */}
          {currentUser?.role === 'teacher' && (
            <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-[#125875] text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between shadow-md gap-2 border-b border-blue-800">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-gray-950 text-[10.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Advisor Inspection View
                </span>
                <span className="text-gray-200">
                  Previewing Student SIS Portal for: <strong className="text-white">{student.studentName}</strong> (ID: {student.studentId}).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectedStudent(null);
                  setAppMode('teacher');
                }}
                className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-3 py-1 rounded text-xs cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Faculty Console</span>
              </button>
            </div>
          )}

          <SisTopBar
            student={student}
            currentUser={currentUser}
            currentMode="sis"
            onSwitchMode={(mode) => setAppMode(mode as any)}
            onNavigateTab={(tab) => {
              setActiveUniTab(tab as any);
              setAppMode('portal');
            }}
            onOpenAuth={handleOpenAuth}
            onOpenDatabaseConfig={() => setIsDbModalOpen(true)}
            onLogout={handleLogout}
            isAdvisorInspecting={Boolean(inspectedStudent || currentUser?.role === 'teacher')}
          />

          <div className="flex-1 flex flex-col md:flex-row">
            <SisSidebar
              activeView={activeSisView}
              onSelectView={(view) => setActiveSisView(view)}
            />

            <main className="flex-1 overflow-x-auto">
              {activeSisView === 'home' && (
                <SisHomePage
                  student={student}
                  onNavigate={(view) => setActiveSisView(view)}
                />
              )}

              {activeSisView === 'academic-plan' && (
                <SisAcademicPlan
                  student={student}
                  currentUser={activeStudentAccount}
                  onDataUpdated={refreshUserData}
                />
              )}

              {activeSisView === 'attendance' && (
                <SisAttendance
                  student={student}
                  currentUser={activeStudentAccount}
                  onDataUpdated={refreshUserData}
                />
              )}

              {activeSisView === 'activity-marks' && (
                <SisActivityMarks
                  student={student}
                  currentUser={activeStudentAccount}
                />
              )}

              {activeSisView === 'exam-schedule' && (
                <SisExamSchedule student={student} />
              )}

              {activeSisView.startsWith('req-') && (
                <SisRequests
                  student={student}
                  currentUser={activeStudentAccount}
                  activeRequestView={activeSisView}
                  onNavigate={(view) => setActiveSisView(view)}
                  onDataUpdated={refreshUserData}
                />
              )}

              {activeSisView === 'staff' && (
                <SisStaff student={student} />
              )}

              {activeSisView === 'reports' && (
                <SisReports
                  student={student}
                  currentUser={activeStudentAccount}
                />
              )}
            </main>
          </div>

          <SisFooter />
        </div>
      )}

      {/* RENDER MODE: UNIVERSITY PUBLIC WEBSITE & COURSE CATALOG */}
      {appMode === 'portal' && (
        <div className="flex-1 flex flex-col">
          <UniversityNavbar
            activeTab={activeUniTab}
            onSelectTab={(tab) => setActiveUniTab(tab)}
            onOpenSis={() => setAppMode('sis')}
            student={student}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
          />

          <main className="flex-1">
            {activeUniTab === 'home' && (
              <CampusHome
                student={student}
                onOpenSis={() => setAppMode('sis')}
                onSelectTab={(tab) => setActiveUniTab(tab)}
              />
            )}

            {activeUniTab === 'catalog' && (
              <CourseCatalog onOpenSisToRegister={handleOpenSisToRegister} />
            )}

            {activeUniTab === 'events' && (
              <EventCalendar />
            )}

            {activeUniTab === 'news' && (
              <CampusNewsSection />
            )}

            {activeUniTab === 'about' && (
              <AboutSection />
            )}
          </main>

          <UniversityFooter
            onOpenSis={() => setAppMode('sis')}
            onNavigateTab={(tab) => setActiveUniTab(tab)}
          />
        </div>
      )}

      {/* AUTH MODAL (Login with Gmail & Password / Create New Student Account) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* DATABASE CONFIGURATION MODAL (Supabase connection) */}
      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onConnectionChanged={refreshUserData}
      />
    </div>
  );
}
