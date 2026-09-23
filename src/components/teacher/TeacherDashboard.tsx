import React, { useState } from 'react';
import { UserAccount, StudentProfile, Course, AttendanceRecord } from '../../types';
import { userStore } from '../../data/userStore';
import { SutLogo } from '../common/SutLogo';
import { 
  Users, Search, Edit3, CheckCircle, AlertTriangle, ShieldCheck, 
  GraduationCap, BookOpen, Clock, FileText, Save, Eye, LogOut, 
  RefreshCw, MessageSquare, Check, X, Award, AlertCircle, Database
} from 'lucide-react';
import { SupabaseStatusModal } from '../supabase/SupabaseStatusModal';
import { supabaseService } from '../../lib/supabase';

interface Props {
  currentUser: UserAccount;
  onLogout: () => void;
  onSwitchToStudentView: (student: UserAccount) => void;
  onSwitchToPortal: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({
  currentUser,
  onLogout,
  onSwitchToStudentView,
  onSwitchToPortal,
}) => {
  const [students, setStudents] = useState<UserAccount[]>(userStore.getAllStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'probation' | 'good' | 'requests'>('all');
  
  // Selected student for editing
  const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);
  
  // Edit form state
  const [editProfile, setEditProfile] = useState<StudentProfile | null>(null);
  const [editCourses, setEditCourses] = useState<Course[]>([]);
  const [editAttendance, setEditAttendance] = useState<AttendanceRecord[]>([]);
  const [advisorNoteText, setAdvisorNoteText] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'profile' | 'courses' | 'attendance' | 'requests' | 'notes'>('profile');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const isSupabaseLive = supabaseService.isConfigured();

  const refreshStudents = () => {
    const updated = userStore.getAllStudents();
    setStudents(updated);
    if (selectedStudent) {
      const refreshed = updated.find(s => s.id === selectedStudent.id);
      if (refreshed) {
        setSelectedStudent(refreshed);
        setEditProfile(refreshed.studentProfile ? { ...refreshed.studentProfile } : null);
        setEditCourses(refreshed.courses ? JSON.parse(JSON.stringify(refreshed.courses)) : []);
        setEditAttendance(refreshed.attendance ? JSON.parse(JSON.stringify(refreshed.attendance)) : []);
      }
    }
  };

  const handleSelectStudentForEdit = (student: UserAccount) => {
    setSelectedStudent(student);
    setEditProfile(student.studentProfile ? { ...student.studentProfile } : null);
    setEditCourses(student.courses ? JSON.parse(JSON.stringify(student.courses)) : []);
    setEditAttendance(student.attendance ? JSON.parse(JSON.stringify(student.attendance)) : []);
    setAdvisorNoteText('');
    setActiveEditTab('profile');
  };

  const handleSaveStudentChanges = () => {
    if (!selectedStudent || !editProfile) return;

    const cgpaNum = Number(editProfile.cgpa);
    const finalProfile: StudentProfile = {
      ...editProfile,
      cgpa: cgpaNum,
      academicStatus: editProfile.academicStatus || (cgpaNum > 0 && cgpaNum < 2.0 ? 'Academic Probation (1)' : 'Good Standing'),
    };

    const res = userStore.updateStudentByTeacher(
      editProfile.studentId,
      {
        profileUpdates: finalProfile,
        courses: editCourses,
        attendance: editAttendance,
        newAdvisorNote: advisorNoteText.trim() ? advisorNoteText.trim() : undefined,
      },
      currentUser.name
    );

    if (res.success) {
      setNotification(`Academic records for ${finalProfile.studentName} have been successfully updated!`);
      refreshStudents();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const [reviewModal, setReviewModal] = useState<{
    requestId: string;
    requestType: string;
    status: 'Approved' | 'Rejected';
    comment: string;
  } | null>(null);

  const handleOpenReview = (requestId: string, requestType: string, status: 'Approved' | 'Rejected') => {
    setReviewModal({
      requestId,
      requestType,
      status,
      comment: `Reviewed and ${status.toLowerCase()} by Advisor ${currentUser.name}.`,
    });
  };

  const handleConfirmReview = () => {
    if (!reviewModal || !editProfile) return;
    userStore.reviewStudentRequest(
      editProfile.studentId,
      reviewModal.requestId,
      reviewModal.status,
      reviewModal.comment,
      currentUser.name
    );
    refreshStudents();
    setNotification(`Request marked as ${reviewModal.status}.`);
    setReviewModal(null);
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter students list
  const filteredStudents = students.filter(s => {
    const prof = s.studentProfile;
    if (!prof) return false;
    const matchesSearch = 
      prof.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.studentId.includes(searchQuery) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.studentProgram.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'probation') return prof.academicStatus.toLowerCase().includes('probation');
    if (filterStatus === 'good') return prof.academicStatus.toLowerCase().includes('good');
    if (filterStatus === 'requests') return (s.requests && s.requests.some(r => r.status === 'Pending' || r.status === 'Under Review'));
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-[#202738] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-[#cfd6df] shadow-2xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div onClick={onSwitchToPortal} className="cursor-pointer" title="SUT Portal">
              <SutLogo className="h-11" />
            </div>
            <div className="border-l border-gray-300 pl-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#125875] text-white text-[11px] font-bold px-2.5 py-0.5 rounded tracking-wide uppercase">
                  Faculty & Advisor Console
                </span>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  Academic Term 2025/2026
                </span>
              </div>
              <h1 className="text-sm font-bold text-gray-800">
                Student Account Management & Grade Oversight
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-[#0c4ca3] flex items-center justify-end gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentUser.name}</span>
              </div>
              <div className="text-[11px] text-gray-500">
                {currentUser.academicTitle || 'Appointed Academic Advisor'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors flex items-center gap-1.5 border text-xs ${
                isSupabaseLive 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
              }`}
              title="Inspect Supabase PostgreSQL Cloud Integration & Schema"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isSupabaseLive ? 'Supabase: Active' : 'Supabase Config'}</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToPortal}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium cursor-pointer transition-colors"
            >
              Campus Portal
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold shadow-md animate-in fade-in flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-5 w-full grow grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Student Directory & Search (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-[#d4dbe3] p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#202738] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0c4ca3]" />
                <span>Registered Students Directory</span>
              </h2>
              <span className="text-xs bg-blue-50 text-[#0c4ca3] px-2 py-0.5 rounded font-bold">
                {students.length} Total Accounts
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, ID (e.g. 250103180), or email..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-[#0c4ca3]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[11px] mb-3">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded cursor-pointer font-medium ${
                  filterStatus === 'all' ? 'bg-[#0c4ca3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('probation')}
                className={`px-2.5 py-1 rounded cursor-pointer font-medium ${
                  filterStatus === 'probation' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Probation ({students.filter(s => s.studentProfile?.academicStatus.includes('Probation')).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('good')}
                className={`px-2.5 py-1 rounded cursor-pointer font-medium ${
                  filterStatus === 'good' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Good Standing ({students.filter(s => s.studentProfile?.academicStatus.includes('Good')).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('requests')}
                className={`px-2.5 py-1 rounded cursor-pointer font-medium ${
                  filterStatus === 'requests' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                Pending Petitions
              </button>
            </div>

            {/* Student List Items */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No students matching your search criteria.
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const prof = s.studentProfile!;
                  const isSelected = selectedStudent?.id === s.id;
                  const isProbation = prof.academicStatus.includes('Probation');

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStudentForEdit(s)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#0c4ca3] bg-blue-50/50 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                            <span>{prof.studentName}</span>
                            {s.id === 'usr_student_ahmed' && (
                              <span className="text-[10px] bg-blue-100 text-[#0c4ca3] px-1.5 py-0.2 rounded font-semibold">
                                Primary SIS
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-semibold text-gray-700">ID: {prof.studentId}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{s.email}</span>
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1">
                            {prof.studentProgram} • <span className="font-semibold">{prof.level}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-gray-900">
                            CGPA: <span className={prof.cgpa < 2.0 ? 'text-amber-700' : 'text-emerald-700'}>{prof.cgpa.toFixed(2)}</span>
                          </div>
                          <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isProbation ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isProbation ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle className="w-2.5 h-2.5" />}
                            <span>{prof.academicStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">
                          {s.requests?.length || 0} Petitions • {prof.registeredCH} Registered CH
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSwitchToStudentView(s);
                            }}
                            className="text-[#0c4ca3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View SIS</span>
                          </button>
                          <span className="text-gray-300">|</span>
                          <span className="text-[#6fa324] font-semibold flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Records</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Student Editor (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {selectedStudent && editProfile ? (
            <div className="bg-white rounded-lg border border-[#d4dbe3] shadow-2xs overflow-hidden flex flex-col">
              
              {/* Header of Edit Panel */}
              <div className="p-4 bg-linear-to-r from-[#202738] to-[#125875] text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      {editProfile.studentName}
                    </h2>
                    <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded font-mono font-bold">
                      ID: {editProfile.studentId}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-200 mt-0.5">
                    Account: {selectedStudent.email} • Program: {editProfile.studentProgram}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitchToStudentView(selectedStudent)}
                    className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="View exactly how this student sees their portal"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect SIS View</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStudentChanges}
                    className="px-3 py-1.5 bg-[#6fa324] hover:bg-[#5f8e1e] text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs for Editing */}
              <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold px-2">
                <button
                  type="button"
                  onClick={() => setActiveEditTab('profile')}
                  className={`py-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                    activeEditTab === 'profile'
                      ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Profile & Academic Standing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditTab('courses')}
                  className={`py-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                    activeEditTab === 'courses'
                      ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Courses & Grades ({editCourses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditTab('attendance')}
                  className={`py-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                    activeEditTab === 'attendance'
                      ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Attendance & Warnings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditTab('requests')}
                  className={`py-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                    activeEditTab === 'requests'
                      ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Petitions & Requests ({selectedStudent.requests?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditTab('notes')}
                  className={`py-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                    activeEditTab === 'notes'
                      ? 'border-[#0c4ca3] text-[#0c4ca3] bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Advisor Log ({selectedStudent.advisorNotes?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5 overflow-y-auto max-h-[600px] text-xs space-y-4">
                
                {/* 1. PROFILE & ACADEMIC STANDING */}
                {activeEditTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Full Student Name:</label>
                        <input
                          type="text"
                          value={editProfile.studentName}
                          onChange={(e) => setEditProfile({ ...editProfile, studentName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Student University ID:</label>
                        <input
                          type="text"
                          value={editProfile.studentId}
                          onChange={(e) => setEditProfile({ ...editProfile, studentId: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-mono font-bold bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Cumulative GPA (CGPA):</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="4.0"
                            value={editProfile.cgpa}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditProfile({
                                ...editProfile,
                                cgpa: val,
                              });
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-xs font-bold text-[#0c4ca3]"
                          />
                          <span className={`text-[11px] font-bold px-2 py-1 rounded whitespace-nowrap ${
                            editProfile.cgpa > 0 && editProfile.cgpa < 2.0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {editProfile.cgpa === 0 ? 'Pending' : editProfile.cgpa < 2.0 ? 'Probation' : 'Good Standing'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Academic Status:</label>
                        <select
                          value={editProfile.academicStatus || 'Pending Staff Evaluation'}
                          onChange={(e) => setEditProfile({ ...editProfile, academicStatus: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                        >
                          <option value="Pending Staff Evaluation">Pending Staff Evaluation</option>
                          <option value="Good Standing">Good Standing</option>
                          <option value="Academic Probation (1)">Academic Probation (1)</option>
                          <option value="Academic Probation (2)">Academic Probation (2)</option>
                          <option value="Academic Probation (3)">Academic Probation (3)</option>
                          <option value="Dean's Honor List">Dean's Honor List</option>
                          <option value="Graduated">Graduated</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Academic Warnings Count:</label>
                        <select
                          value={editProfile.academicWarnings}
                          onChange={(e) => setEditProfile({ ...editProfile, academicWarnings: parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded text-xs"
                        >
                          <option value={0}>0 Warnings (Clear)</option>
                          <option value={1}>1 Warning</option>
                          <option value={2}>2 Warnings (Severe Probation)</option>
                          <option value={3}>3 Warnings (Dismissal Hearing)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Total Passed Credit Hours (CH):</label>
                        <input
                          type="number"
                          step="1"
                          value={editProfile.totalPassedCH}
                          onChange={(e) => setEditProfile({ ...editProfile, totalPassedCH: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Registered CH (Current Term):</label>
                        <input
                          type="number"
                          value={editProfile.registeredCH}
                          onChange={(e) => setEditProfile({ ...editProfile, registeredCH: parseInt(e.target.value) || 0 })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Enrolled Academic Program:</label>
                        <input
                          type="text"
                          value={editProfile.studentProgram}
                          onChange={(e) => setEditProfile({ ...editProfile, studentProgram: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Academic Level:</label>
                        <select
                          value={editProfile.level}
                          onChange={(e) => setEditProfile({ ...editProfile, level: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded text-xs"
                        >
                          <option value="Level 1">Level 1 (Freshman)</option>
                          <option value="Level 2">Level 2 (Sophomore)</option>
                          <option value="Level 3">Level 3 (Junior)</option>
                          <option value="Level 4">Level 4 (Senior)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Assigned Academic Advisor:</label>
                        <input
                          type="text"
                          value={editProfile.advisorName}
                          onChange={(e) => setEditProfile({ ...editProfile, advisorName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Advisor Email:</label>
                        <input
                          type="email"
                          value={editProfile.advisorEmail}
                          onChange={(e) => setEditProfile({ ...editProfile, advisorEmail: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <label className="block font-bold text-gray-700 mb-1">
                        Add New Advisory Instruction / Directive (Visible to Student):
                      </label>
                      <textarea
                        rows={2}
                        value={advisorNoteText}
                        onChange={(e) => setAdvisorNoteText(e.target.value)}
                        placeholder="e.g., Approved retake for MATH101. Maximum allowable load set to 12 credit hours due to probation status."
                        className="w-full p-2.5 border border-gray-300 rounded-md text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 2. COURSES & GRADES */}
                {activeEditTab === 'courses' && (
                  <div className="space-y-3">
                    <p className="text-gray-500 text-[11px]">
                      Instructors and advisors can modify course grades and enrollment statuses for this student:
                    </p>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#f0f4f8] text-gray-700 font-bold border-b border-gray-200">
                          <tr>
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Course Name</th>
                            <th className="p-2.5">CH</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Letter Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {editCourses.map((c, idx) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="p-2 font-mono font-bold text-[#0c4ca3]">{c.code}</td>
                              <td className="p-2 text-gray-800 font-medium">{c.title}</td>
                              <td className="p-2 text-gray-600">{c.creditHours}</td>
                              <td className="p-2">
                                <select
                                  value={c.status}
                                  onChange={(e) => {
                                    const updated = [...editCourses];
                                    updated[idx].status = e.target.value as any;
                                    setEditCourses(updated);
                                  }}
                                  className="p-1 border border-gray-300 rounded text-[11px]"
                                >
                                  <option value="passed">Passed</option>
                                  <option value="registered">Registered (In Progress)</option>
                                  <option value="available">Available</option>
                                  <option value="locked">Locked</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <select
                                  value={c.grade || ''}
                                  onChange={(e) => {
                                    const updated = [...editCourses];
                                    updated[idx].grade = e.target.value;
                                    setEditCourses(updated);
                                  }}
                                  className="p-1 border border-gray-300 rounded font-bold text-xs"
                                >
                                  <option value="">--</option>
                                  <option value="A+">A+</option>
                                  <option value="A">A</option>
                                  <option value="B+">B+</option>
                                  <option value="B">B</option>
                                  <option value="C+">C+</option>
                                  <option value="C">C</option>
                                  <option value="D+">D+</option>
                                  <option value="D">D</option>
                                  <option value="F">F</option>
                                  <option value="IP">IP (In Progress)</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. ATTENDANCE & WARNINGS */}
                {activeEditTab === 'attendance' && (
                  <div className="space-y-3">
                    <p className="text-gray-500 text-[11px]">
                      Override attendance records, excuse medical leaves, or clear absence warnings:
                    </p>
                    <div className="space-y-3">
                      {editAttendance.map((rec, aIdx) => (
                        <div key={rec.courseCode} className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-xs text-[#202738]">
                              {rec.courseCode} - {rec.courseName}
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] font-medium text-gray-600">Warning Status:</label>
                              <select
                                value={rec.warningStatus}
                                onChange={(e) => {
                                  const updated = [...editAttendance];
                                  updated[aIdx].warningStatus = e.target.value as any;
                                  setEditAttendance(updated);
                                }}
                                className="p-1 border border-gray-300 rounded text-xs font-bold"
                              >
                                <option value="Normal">Normal</option>
                                <option value="Warning 1">Warning 1 (&gt;15%)</option>
                                <option value="Warning 2">Warning 2 (&gt;20%)</option>
                                <option value="Denied">Denied (F-Ab &gt;25%)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="text-[11px] text-gray-500 block">Total Sessions:</span>
                              <input
                                type="number"
                                value={rec.totalSessions}
                                onChange={(e) => {
                                  const updated = [...editAttendance];
                                  updated[aIdx].totalSessions = parseInt(e.target.value) || 0;
                                  setEditAttendance(updated);
                                }}
                                className="w-full p-1 border rounded"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-gray-500 block">Absent Sessions:</span>
                              <input
                                type="number"
                                value={rec.absentSessions}
                                onChange={(e) => {
                                  const updated = [...editAttendance];
                                  const abs = parseInt(e.target.value) || 0;
                                  updated[aIdx].absentSessions = abs;
                                  updated[aIdx].attendedSessions = updated[aIdx].totalSessions - abs;
                                  updated[aIdx].percentage = Math.round((updated[aIdx].attendedSessions / updated[aIdx].totalSessions) * 100);
                                  setEditAttendance(updated);
                                }}
                                className="w-full p-1 border rounded"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-gray-500 block">Attendance Rate:</span>
                              <div className="font-bold text-xs py-1 text-gray-800">
                                {rec.percentage}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. PETITIONS & REQUESTS */}
                {activeEditTab === 'requests' && (
                  <div className="space-y-3">
                    <p className="text-gray-500 text-[11px]">
                      Student requests requiring advisor or faculty approval:
                    </p>
                    {(!selectedStudent.requests || selectedStudent.requests.length === 0) ? (
                      <div className="text-center py-6 text-gray-400">
                        No requests submitted by this student.
                      </div>
                    ) : (
                      selectedStudent.requests.map((req) => (
                        <div key={req.id} className="p-3 border border-gray-200 rounded-lg bg-white shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0c4ca3]">{req.requestType}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600">{req.details}</p>
                          <div className="text-[10px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
                            <span>Submitted: {req.submittedDate}</span>
                            {req.reviewedBy && (
                              <span className="text-emerald-700 font-medium">
                                Reviewed by: {req.reviewedBy} ({req.reviewedAt})
                              </span>
                            )}
                          </div>
                          {req.status === 'Pending' || req.status === 'Under Review' ? (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenReview(req.id, req.requestType, 'Approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve Petition</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(req.id, req.requestType, 'Rejected')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. ADVISOR NOTES */}
                {activeEditTab === 'notes' && (
                  <div className="space-y-3">
                    <p className="text-gray-500 text-[11px]">
                      Historical record of academic advising sessions, probation warnings, and directives:
                    </p>
                    {(!selectedStudent.advisorNotes || selectedStudent.advisorNotes.length === 0) ? (
                      <div className="text-center py-6 text-gray-400">
                        No advisor notes logged for this student.
                      </div>
                    ) : (
                      selectedStudent.advisorNotes.map((note, nIdx) => (
                        <div key={nIdx} className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-[11px] text-gray-700 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-[#0c4ca3] shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>

              {/* Bottom Action Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Updates take effect immediately on student login.
                </span>
                <button
                  type="button"
                  onClick={handleSaveStudentChanges}
                  className="px-4 py-1.5 bg-[#6fa324] hover:bg-[#5f8e1e] text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Changes</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#d4dbe3] p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <Users className="w-12 h-12 text-gray-300" />
              <div>
                <h3 className="text-sm font-bold text-gray-700">No Student Selected</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Select a student from the directory on the left to review their transcript, edit their CGPA, adjust course grades, or approve academic petitions.
                </p>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Review Request Modal Dialog */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full border border-gray-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className={`px-4 py-3 text-white flex justify-between items-center ${
              reviewModal.status === 'Approved' ? 'bg-emerald-700' : 'bg-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {reviewModal.status === 'Approved' ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <X className="w-5 h-5 text-white" />
                )}
                <h3 className="font-bold text-sm">
                  {reviewModal.status === 'Approved' ? 'Approve Student Request' : 'Reject Student Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                <div>
                  <span className="text-gray-500">Request Type:</span>{' '}
                  <strong className="text-gray-800">{reviewModal.requestType}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Target Student:</span>{' '}
                  <strong className="text-gray-800">{editProfile?.studentName}</strong> ({editProfile?.studentId})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Advisor Review Decision Comments:
                </label>
                <textarea
                  rows={3}
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter comments explaining the approval or rejection..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReview}
                  className={`px-4 py-1.5 text-white font-bold rounded cursor-pointer ${
                    reviewModal.status === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {reviewModal.status}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Status and PostgreSQL Schema Modal */}
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
