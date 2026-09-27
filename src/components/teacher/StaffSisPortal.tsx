import React, { useState } from 'react';
import { UserAccount, StudentProfile, Course, AttendanceRecord } from '../../types';
import { userStore } from '../../data/userStore';
import { SutLogo } from '../common/SutLogo';
import { 
  Home, BookOpen, RefreshCw, Power, Menu, Search, Printer, 
  FileSpreadsheet, FileText, Check, X, AlertTriangle, ShieldCheck, 
  Send, UserPlus, Calendar, Clock, ChevronRight, MessageSquare, 
  Users, CheckCircle2, Award, Download, User
} from 'lucide-react';
import { createStudent } from '../../lib/students';
import { TeacherDataView } from './TeacherDataView';
import { DatabaseStudentsDirectory } from './DatabaseStudentsDirectory';

interface Props {
  currentUser: UserAccount;
  onLogout: () => void;
  onSwitchToStudentView: (student: UserAccount) => void;
  onSwitchToPortal: () => void;
  onOpenSupabaseModal?: () => void;
}

// Student record dynamically loaded from SUT user database
export interface SutStudentRow {
  id: string;
  studentId: string;
  field: string;
  name: string;
  email: string;
  program: string;
  cgpa: number;
  accumCh: number;
  level: string;
  blocked?: boolean;
  absences?: number;
  totalSessions?: number;
  advisorName?: string;
  advisorEmail?: string;
  courses: Course[];
  rawUser: UserAccount;
}

function loadStudentsFromUserStore(): SutStudentRow[] {
  const users = userStore.getAllStudents();
  return users.map(u => {
    const p = u.studentProfile;
    const absences = (u.attendance || []).reduce((sum, a) => sum + (a.absentSessions || 0), 0);
    const totalSessions = (u.attendance || []).reduce((sum, a) => sum + (a.totalSessions || 14), 0);
    return {
      id: u.id,
      studentId: p?.studentId || '25010' + u.id.slice(-4),
      field: p?.field || 'Field of Engineering Technology',
      name: p?.studentName || u.name,
      email: u.email,
      program: p?.studentProgram || 'Computer Science Technology Program',
      cgpa: p?.cgpa ?? 3.5,
      accumCh: p?.totalPassedCH ?? 18,
      level: p?.level || 'Level 1',
      blocked: p?.academicStatus?.toLowerCase().includes('probation') || false,
      absences,
      totalSessions: totalSessions || 14,
      advisorName: p?.advisorName || 'Pending Staff Assignment',
      advisorEmail: p?.advisorEmail || '',
      courses: u.courses || [],
      rawUser: u,
    };
  });
}

export const StaffSisPortal: React.FC<Props> = ({
  currentUser,
  onLogout,
  onSwitchToStudentView,
  onSwitchToPortal,
  onOpenSupabaseModal,
}) => {
  // Navigation State corresponding to photos
  const [activeMenuSection, setActiveMenuSection] = useState<string>('students-data');
  const [activeSubMenu, setActiveSubMenu] = useState<string>('student-register-course');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Roster of SUT students derived from real store
  const [sutStudents, setSutStudents] = useState<SutStudentRow[]>(() => loadStudentsFromUserStore());

  const reloadStoreStudents = () => {
    setSutStudents(loadStudentsFromUserStore());
  };

  const teacherName = currentUser.teacherProfile?.teacherName || currentUser.name || 'Dr. Hend Adel Ahmed Fouad';
  const teacherEmail = currentUser.teacherProfile?.email || currentUser.email || 'hend.fouad@sut.edu.eg';

  // Filter state for Photo 3 (Student Register Course)
  const [selectedCourse, setSelectedCourse] = useState('CET442 - Selected Topic in Data Science');
  const [selectedSection, setSelectedSection] = useState('All');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state for Photo 4 (Academic Advising)
  const [advisingField, setAdvisingField] = useState('Field of Electrical Engineering');
  const [advisingYear, setAdvisingYear] = useState('2026/2027');
  const [advisingSemester, setAdvisingSemester] = useState('Fall');
  const [advisingStudentId, setAdvisingStudentId] = useState('');
  const [advisingStudentName, setAdvisingStudentName] = useState('');
  const [advisingCgpaMin, setAdvisingCgpaMin] = useState('');
  const [advisingCgpaMax, setAdvisingCgpaMax] = useState('');
  const [advisingBlockFilter, setAdvisingBlockFilter] = useState<'all' | 'block' | 'unblock'>('all');

  // Attendance tracking state
  const [attendanceDate, setAttendanceDate] = useState('2026-09-24');
  const [attendanceSession, setAttendanceSession] = useState<'lecture' | 'lab'>('lecture');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});

  // Grading state
  const [studentGrades, setStudentGrades] = useState<Record<string, { midterm: number; practical: number; finalExam: number }>>({});

  // Moodle Messaging state (Photo 6)
  const [activeContact, setActiveContact] = useState<string>('SUT Student');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Student', text: 'Good morning Dr. Hend, regarding the CET442 Lab Practical assignment, should we submit the PyTorch notebook directly?', time: '09:42 AM' },
    { sender: 'Dr. Hend Fouad', text: 'Hello, yes please submit both the .ipynb notebook and the model evaluation graphs before Thursday 11:59 PM.', time: '10:05 AM' }
  ]);
  const [newMsgText, setNewMsgText] = useState('');

  // Add Student Form State (User Requirement)
  const [addStudentForm, setAddStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '2005-01-15',
    gradeLevel: 'Level 1',
    studentId: `25010${Math.floor(1000 + Math.random() * 9000)}`,
    program: 'Artificial Intelligence & Data Science Technology Program',
    field: 'Field of Engineering Technology',
    cgpa: '3.500',
    accumCh: '18.000',
  });

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Student Handler
  const handleAddNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStudentForm.firstName || !addStudentForm.lastName || !addStudentForm.email) {
      alert('Please fill out all required fields.');
      return;
    }

    const fullName = `${addStudentForm.firstName} ${addStudentForm.lastName}`;
    
    // Register into persistent userStore
    const regResult = await userStore.registerStudentAccount({
      name: fullName,
      email: addStudentForm.email,
      studentId: addStudentForm.studentId,
      program: addStudentForm.program,
      level: addStudentForm.gradeLevel,
    });

    if (regResult.success) {
      userStore.updateStudentCgpaAndCourses(
        addStudentForm.studentId,
        parseFloat(addStudentForm.cgpa) || 3.5,
        parseFloat(addStudentForm.accumCh) || 18
      );
      // Officially assign to this advisor
      userStore.assignAdvisorToStudent(addStudentForm.studentId, teacherName, teacherEmail);
      // Enroll in current course
      userStore.enrollStudentInTeacherCourse(
        addStudentForm.studentId,
        'CET442',
        'Selected Topic in Data Science',
        teacherName
      );
    }

    reloadStoreStudents();

    try {
      await createStudent({
        first_name: addStudentForm.firstName,
        last_name: addStudentForm.lastName,
        email: addStudentForm.email,
        date_of_birth: addStudentForm.dateOfBirth,
        grade_level: addStudentForm.gradeLevel,
        student_id: addStudentForm.studentId,
        field: addStudentForm.field,
        program: addStudentForm.program,
        cgpa: parseFloat(addStudentForm.cgpa) || 3.5,
        accum_ch: parseFloat(addStudentForm.accumCh) || 18,
      });
    } catch {
      // Local fallback handled smoothly
    }

    showToast(`Student ${fullName} (${addStudentForm.studentId}) successfully registered into SUT database!`);
    setActiveSubMenu('database-students');
    setActiveMenuSection('academic-duties');

    // Reset form
    setAddStudentForm({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '2005-01-15',
      gradeLevel: 'Level 1',
      studentId: `25010${Math.floor(1000 + Math.random() * 9000)}`,
      program: 'Artificial Intelligence & Data Science Technology Program',
      field: 'Field of Engineering Technology',
      cgpa: '3.500',
      accumCh: '18.000',
    });
  };

  // Export to CSV/Excel (Matching Photo 3 excel icon)
  const handleExportExcel = () => {
    const headers = ['Student ID', 'Field', 'Student Name', 'Email', 'Program', 'CGPA', 'Accum CH'];
    const rows = sutStudents.map(s => [
      s.studentId,
      `"${s.field}"`,
      `"${s.name}"`,
      s.email,
      `"${s.program}"`,
      s.cgpa.toFixed(3),
      s.accumCh.toFixed(3)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SUT_CET442_Student_Register_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Student register exported to Excel / CSV successfully.');
  };

  // Print function (Matching Photo 3 print icon)
  const handlePrint = () => {
    window.print();
  };

  // Send message in Moodle chat
  const handleSendMessage = () => {
    if (!newMsgText.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages([...chatMessages, { sender: 'Dr. Hend Fouad', text: newMsgText.trim(), time: timeStr }]);
    setNewMsgText('');
  };

  // Filter students for Student Register Course: only students enrolled in selectedCourse!
  const courseCodeClean = selectedCourse.split('-')[0].trim().toUpperCase();
  const filteredStudents = sutStudents.filter(s => {
    const isEnrolled = s.courses && s.courses.some(c => 
      c.code.toUpperCase() === courseCodeClean && (c.status === 'registered' || c.status === 'passed')
    );
    if (!isEnrolled) return false;

    if (studentSearchQuery) {
      const q = studentSearchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.studentId.includes(q) || s.email.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter advisees for Academic Advising: based on actual student accounts the advisor has added/assigned!
  const adviseeResults = sutStudents.filter(s => {
    // Only students where advisor matches this teacher
    const isAssignedToThisTeacher = s.advisorName && (
      s.advisorName.includes(teacherName) || 
      (teacherName.includes('Hend') && s.advisorName.includes('Hend')) ||
      (s.advisorEmail && s.advisorEmail.toLowerCase() === teacherEmail.toLowerCase())
    );
    if (!isAssignedToThisTeacher) return false;

    if (advisingStudentId && !s.studentId.includes(advisingStudentId.trim())) return false;
    if (advisingStudentName && !s.name.toLowerCase().includes(advisingStudentName.toLowerCase().trim())) return false;
    if (advisingCgpaMin && s.cgpa < parseFloat(advisingCgpaMin)) return false;
    if (advisingCgpaMax && s.cgpa > parseFloat(advisingCgpaMax)) return false;
    if (advisingBlockFilter === 'block' && !s.blocked) return false;
    if (advisingBlockFilter === 'unblock' && s.blocked) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#222933] flex flex-col font-sans text-xs select-none">
      
      {/* ── TOP AUTHENTIC SUT STAFF SIS HEADER ─────────────────── */}
      <header className="bg-white border-b border-[#cfd6df] shadow-xs sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div onClick={onSwitchToPortal} className="cursor-pointer hover:opacity-90" title="Elsewedy University of Technology">
              <SutLogo className="h-10 sm:h-12" />
            </div>
            <div className="hidden md:block border-l border-gray-300 pl-3">
              <div className="text-[13px] font-black text-[#1e2a38] tracking-tight uppercase">
                Elsewedy University of Technology
              </div>
              <div className="text-[11px] text-[#6aa123] font-bold">
                staffsis.sut.edu.eg • Staff Member SIS Portal
              </div>
            </div>
          </div>

          {/* User Welcome & Term & Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[12.5px] font-bold text-[#1e2a38]">
                Welcome{' '}
                <button
                  type="button"
                  onClick={() => setActiveSubMenu('teacher-data')}
                  className="text-[#0c4ca3] hover:underline font-bold cursor-pointer"
                  title="Click to view Teacher Academic Data"
                >
                  {currentUser.name || 'Hend Adel Ahmed Fouad'}
                </button>
                {' '}| <span className="text-[#556376]">Staff Member</span>
              </div>
              <div className="text-[11px] text-gray-500 font-semibold">
                2026/2027 - Fall
              </div>
            </div>

            {/* Icon buttons from Photo 3 */}
            <div className="flex items-center gap-1.5 border-l border-gray-300 pl-3">
              {/* Teacher Academic Data Icon */}
              <button
                type="button"
                onClick={() => setActiveSubMenu('teacher-data')}
                className={`w-7 h-7 rounded text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors ${
                  activeSubMenu === 'teacher-data' ? 'bg-[#6aa123] ring-2 ring-[#6aa123]/40' : 'bg-[#516377] hover:bg-[#435467]'
                }`}
                title="View Teacher Data (Staff Academic Profile)"
              >
                <User className="w-3.5 h-3.5" />
              </button>

              {/* Home Icon */}
              <button
                type="button"
                onClick={onSwitchToPortal}
                className="w-7 h-7 rounded bg-[#c59966] hover:bg-[#b58855] text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                title="Return to SUT Public Campus Home"
              >
                <Home className="w-3.5 h-3.5" />
              </button>

              {/* Book / SIS Icon */}
              <button
                type="button"
                onClick={() => {
                  const studentUser = userStore.getAllStudents()[0];
                  if (studentUser) onSwitchToStudentView(studentUser);
                }}
                className="w-7 h-7 rounded bg-[#7a8b9e] hover:bg-[#68798c] text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                title="Open Student Information System (SIS Preview)"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>

              {/* Refresh / DB Icon */}
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="w-7 h-7 rounded bg-[#4b8fb8] hover:bg-[#3b7fa8] text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                title="Supabase Database Configuration & Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Logout Power Icon */}
              <button
                type="button"
                onClick={onLogout}
                className="w-7 h-7 rounded bg-[#b33939] hover:bg-[#992626] text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                title="Sign Out of Staff Portal"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Sub-Banner Title Bar matching Photo 3 */}
        <div className="bg-[#242c3b] text-white px-4 py-2 flex items-center justify-between border-t border-[#1c222e]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-[#d99b26] hover:bg-[#c2871b] text-white px-2 py-1 rounded cursor-pointer flex items-center justify-center"
              title="Toggle Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="font-bold text-[13px] flex items-center gap-2">
              <span>
                {activeSubMenu === 'teacher-data' && 'Staff Member Academic Profile >> Teacher Data'}
                {activeSubMenu === 'database-students' && 'Student Information Database >> All Students in Database & Course Assignment'}
                {activeSubMenu === 'student-register-course' && 'Student Register Course ▶'}
                {activeSubMenu === 'academic-advising' && 'Academic Advising (Staff) >> Advising data'}
                {activeSubMenu === 'course-attendance' && 'Course Attendence >> Attendance Sheet'}
                {activeSubMenu === 'absence-followup' && 'Student Absence Followup >> Warnings'}
                {activeSubMenu === 'course-grading' && 'Course Grading (Special) >> Marks Entry'}
                {activeSubMenu === 'add-student' && 'Add New Student Record Form ▶'}
                {activeSubMenu === 'faculty-schedule' && 'Faculty Schedule Report ▶'}
                {activeSubMenu === 'absence-warnings' && 'List of students with abscense warnings ▶'}
                {activeSubMenu === 'communicate-students' && 'My E-Services >> Communicate with students (Moodle)'}
                {activeSubMenu === 'bulk-drop' && 'Bulk Drop / Course Administration ▶'}
                {activeSubMenu === 'petitions' && 'Course Drop / Incomplete Request ▶'}
                {activeSubMenu === 'sections' && 'Edit Sections >> Allocation ▶'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveMenuSection('academic-duties');
                setActiveSubMenu('database-students');
              }}
              className="bg-[#0c4ca3] hover:bg-[#093a7d] text-white font-bold px-3 py-1 rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Students in Database</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMenuSection('academic-duties');
                setActiveSubMenu('teacher-data');
              }}
              className="bg-[#d99b26] hover:bg-[#c2871b] text-white font-bold px-3 py-1 rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>Teacher Data</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMenuSection('students-data');
                setActiveSubMenu('add-student');
              }}
              className="bg-[#6aa123] hover:bg-[#5b8c1c] text-white font-bold px-3 py-1 rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register Student</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── TOAST NOTIFICATION ──────────────────────────────────── */}
      {toastMessage && (
        <div className="bg-[#6aa123] text-white px-4 py-2 text-center text-xs font-bold shadow-md animate-in fade-in flex items-center justify-center gap-2 z-50">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── MAIN LAYOUT WITH EXACT SIDEBAR & WORKSPACE ───────────── */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        
        {/* SIDEBAR (Exact Replica of Photos 1, 2, 5, 7, 8) */}
        {sidebarOpen && (
          <aside className="w-64 bg-[#2b3442] text-white shrink-0 border-r border-[#1e2530] flex flex-col">
            
            {/* Sidebar Search with "Go" button */}
            <div className="p-3 bg-[#1e2530] flex items-center gap-1 border-b border-[#364152]">
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white text-gray-800 px-2 py-1 text-xs rounded-xs outline-none"
              />
              <button
                type="button"
                className="bg-[#414d5e] hover:bg-[#4f5d72] text-white px-3 py-1 text-xs font-bold rounded-xs cursor-pointer border border-[#55647a]"
              >
                Go
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto divide-y divide-[#354050] text-[12px]">
              
              {/* » Viewing */}
              <div>
                <div 
                  onClick={() => setActiveMenuSection(activeMenuSection === 'viewing' ? '' : 'viewing')}
                  className="px-3 py-2.5 hover:bg-[#374254] font-bold cursor-pointer flex items-center justify-between text-gray-200"
                >
                  <span>» Viewing</span>
                </div>
                {activeMenuSection === 'viewing' && (
                  <div className="bg-[#242c38] py-1 text-[11.5px]">
                    <div 
                      onClick={() => setActiveSubMenu('teacher-data')}
                      className={`px-5 py-1.5 hover:bg-[#313c4c] cursor-pointer ${activeSubMenu === 'teacher-data' ? 'text-[#86efac] font-bold' : 'text-amber-300'}`}
                    >
                      » Teacher Data (Staff Profile)
                    </div>
                    <div 
                      onClick={() => {
                        const s = userStore.getAllStudents()[0];
                        if (s) onSwitchToStudentView(s);
                      }}
                      className="px-5 py-1.5 hover:bg-[#313c4c] text-cyan-300 cursor-pointer"
                    >
                      » Student SIS View (Preview)
                    </div>
                    <div 
                      onClick={onSwitchToPortal}
                      className="px-5 py-1.5 hover:bg-[#313c4c] text-cyan-300 cursor-pointer"
                    >
                      » Public Campus Website
                    </div>
                  </div>
                )}
              </div>

              {/* » My Academic Duties (Photo 1) */}
              <div>
                <div 
                  onClick={() => setActiveMenuSection(activeMenuSection === 'academic-duties' ? '' : 'academic-duties')}
                  className={`px-3 py-2.5 font-bold cursor-pointer flex items-center justify-between transition-colors ${
                    activeMenuSection === 'academic-duties' ? 'bg-[#73a429] text-white' : 'hover:bg-[#374254] text-gray-200'
                  }`}
                >
                  <span>» My Academic Duties</span>
                </div>

                {activeMenuSection === 'academic-duties' && (
                  <div className="bg-[#242c38] py-1 text-[11.5px] space-y-0.5">
                    <div 
                      onClick={() => setActiveSubMenu('teacher-data')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'teacher-data' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Teacher Data (Staff Profile)
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('database-students')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'database-students' ? 'text-[#86efac] font-bold' : 'text-amber-300'}`}
                    >
                      » All Students in Database & Assign
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('academic-advising')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'academic-advising' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Academic Advising
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('course-attendance')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'course-attendance' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Course Attendence
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('absence-followup')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'absence-followup' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Student Absence Followup
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('course-grading')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'course-grading' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Course Grading (Special)
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('bulk-drop')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'bulk-drop' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » register/ add/ drop
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('petitions')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'petitions' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Course Drop/Incomplete Request
                    </div>
                    <div 
                      onClick={() => {
                        showToast('Course withdraw request form opened.');
                        setActiveSubMenu('petitions');
                      }}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » add course withdraw request
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('petitions')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » approve Course Withdrawal Request
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('petitions')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » approve Change Program request
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('petitions')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » approve Change Field request
                    </div>
                  </div>
                )}
              </div>

              {/* » View Students Data (Photo 2) */}
              <div>
                <div 
                  onClick={() => setActiveMenuSection(activeMenuSection === 'students-data' ? '' : 'students-data')}
                  className={`px-3 py-2.5 font-bold cursor-pointer flex items-center justify-between transition-colors ${
                    activeMenuSection === 'students-data' ? 'bg-[#73a429] text-white' : 'hover:bg-[#374254] text-gray-200'
                  }`}
                >
                  <span>» View Students Data</span>
                </div>

                {activeMenuSection === 'students-data' && (
                  <div className="bg-[#242c38] py-1 text-[11.5px] space-y-0.5">
                    <div 
                      onClick={() => setActiveSubMenu('database-students')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'database-students' ? 'text-[#86efac] font-bold' : 'text-amber-300'}`}
                    >
                      » All Students in Database
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('student-register-course')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'student-register-course' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Student Register Course
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('add-student')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'add-student' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Add New Student (Form)
                    </div>
                  </div>
                )}
              </div>

              {/* » Edit Sections */}
              <div>
                <div 
                  onClick={() => {
                    setActiveMenuSection('edit-sections');
                    setActiveSubMenu('sections');
                  }}
                  className={`px-3 py-2.5 font-bold cursor-pointer flex items-center justify-between transition-colors ${
                    activeMenuSection === 'edit-sections' ? 'bg-[#73a429] text-white' : 'hover:bg-[#374254] text-gray-200'
                  }`}
                >
                  <span>» Edit Sections</span>
                </div>
              </div>

              {/* » Reporting (Photo 7, 8) */}
              <div>
                <div 
                  onClick={() => setActiveMenuSection(activeMenuSection === 'reporting' ? '' : 'reporting')}
                  className={`px-3 py-2.5 font-bold cursor-pointer flex items-center justify-between transition-colors ${
                    activeMenuSection === 'reporting' ? 'bg-[#73a429] text-white' : 'hover:bg-[#374254] text-gray-200'
                  }`}
                >
                  <span>» Reporting</span>
                </div>

                {activeMenuSection === 'reporting' && (
                  <div className="bg-[#242c38] py-1 text-[11.5px] space-y-0.5">
                    <div 
                      onClick={() => setActiveSubMenu('faculty-schedule')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'faculty-schedule' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Faculty Schedule Report
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('absence-warnings')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'absence-warnings' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » List of students with abscense warnings
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('course-attendance')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » Student Course Attendance
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('student-register-course')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » Student Academic Plan
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('academic-advising')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » Student Academic Status
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('sections')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » Student Section Details
                    </div>
                  </div>
                )}
              </div>

              {/* » My E-Services (Photo 5, 6) */}
              <div>
                <div 
                  onClick={() => setActiveMenuSection(activeMenuSection === 'e-services' ? '' : 'e-services')}
                  className={`px-3 py-2.5 font-bold cursor-pointer flex items-center justify-between transition-colors ${
                    activeMenuSection === 'e-services' ? 'bg-[#73a429] text-white' : 'hover:bg-[#374254] text-gray-200'
                  }`}
                >
                  <span>» My E-Services</span>
                </div>

                {activeMenuSection === 'e-services' && (
                  <div className="bg-[#242c38] py-1 text-[11.5px] space-y-0.5">
                    <div 
                      onClick={() => setActiveSubMenu('communicate-students')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'communicate-students' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Communicate with students
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('communicate-students')}
                      className="px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] text-gray-300"
                    >
                      » Reply to Students
                    </div>
                    <div 
                      onClick={() => setActiveSubMenu('bulk-drop')}
                      className={`px-5 py-1.5 cursor-pointer hover:bg-[#313c4c] ${activeSubMenu === 'bulk-drop' ? 'text-[#86efac] font-bold' : 'text-gray-300'}`}
                    >
                      » Bulk Drop Courses
                    </div>
                  </div>
                )}
              </div>

            </nav>

            {/* Bottom info */}
            <div className="p-3 bg-[#1e2530] text-[11px] text-gray-400 border-t border-[#364152]">
              <div>Advisor: <strong className="text-gray-200">Hend Adel Fouad</strong></div>
              <div>Dept: <span className="text-gray-300">Engineering Technology</span></div>
            </div>
          </aside>
        )}

        {/* ── WORKSPACE CONTENT AREA (MATCHING THE SCREENSHOTS) ───────── */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-auto bg-[#eaedf1]">
          
          {/* OPTION 0: TEACHER DATA (EXACT MATCH OF STUDENT PAGE) */}
          {activeSubMenu === 'teacher-data' && (
            <TeacherDataView
              currentUser={currentUser}
              onNavigateToCourse={(courseCode) => {
                setSelectedCourse(courseCode);
                setActiveMenuSection('students-data');
                setActiveSubMenu('student-register-course');
              }}
              onNavigateToAdvisees={() => {
                setActiveMenuSection('academic-duties');
                setActiveSubMenu('academic-advising');
              }}
            />
          )}

          {/* OPTION: DATABASE STUDENTS DIRECTORY & COURSE ASSIGNMENT */}
          {activeSubMenu === 'database-students' && (
            <DatabaseStudentsDirectory
              currentUser={currentUser}
              onSwitchToStudentView={onSwitchToStudentView}
              onOpenAddStudent={() => {
                setActiveMenuSection('students-data');
                setActiveSubMenu('add-student');
              }}
              onNavigateToAdvising={() => {
                setActiveMenuSection('academic-duties');
                setActiveSubMenu('academic-advising');
              }}
              onNavigateToCourseRegister={() => {
                setActiveMenuSection('students-data');
                setActiveSubMenu('student-register-course');
              }}
            />
          )}

          {/* OPTION 1: STUDENT REGISTER COURSE (Photo 3) */}
          {activeSubMenu === 'student-register-course' && (
            <div className="space-y-4">
              
              {/* Filter Card matching Photo 3 */}
              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white text-gray-800"
                    >
                      <option value="CET442 - Selected Topic in Data Science">CET442 - Selected Topic in Data Science</option>
                      <option value="CS102 - Data Structures & Algorithms">CS102 - Data Structures & Algorithms</option>
                      <option value="ET104 - Embedded Systems Engineering">ET104 - Embedded Systems Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white text-gray-800"
                    >
                      <option value="All">All</option>
                      <option value="Section 01">Section 01</option>
                      <option value="Section 02">Section 02</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => showToast(`Search executed for ${selectedCourse}`)}
                      className="bg-[#dfcaa0] hover:bg-[#cfba90] text-gray-900 border border-[#bfae82] px-6 py-1.5 font-bold rounded cursor-pointer shadow-2xs"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Toolbar & Stats matching Photo 3 */}
              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#c4cedb] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-3">
                  <div className="font-bold text-[12px] text-gray-700">
                    No. of results <span className="text-[#0c4ca3] font-black">{filteredStudents.length}</span>
                  </div>

                  {/* Actions & Export Icons from Photo 3 */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuSection('academic-duties');
                        setActiveSubMenu('database-students');
                      }}
                      className="px-2.5 py-1 bg-[#0c4ca3] hover:bg-[#093a7d] text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Assign Students to Course</span>
                    </button>

                    <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white">
                      <option value="">[Select]</option>
                      <option value="select-all">Select All Students</option>
                      <option value="export-pdf">Export Selected to PDF</option>
                    </select>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="p-1.5 bg-[#64748b] hover:bg-[#475569] text-white rounded cursor-pointer shadow-2xs"
                      title="Print Register List"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="p-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded cursor-pointer shadow-2xs"
                      title="Export to Excel Spreadsheet"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => showToast('PDF transcript generation triggered.')}
                      className="p-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded cursor-pointer shadow-2xs"
                      title="Save as PDF Document"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Table matching Photo 3 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11.5px] border-collapse">
                    <thead>
                      <tr className="bg-[#cbd5e1] text-[#1e293b] font-bold border-b border-gray-300">
                        <th className="py-2.5 px-3 border-r border-gray-300">Student ID</th>
                        <th className="py-2.5 px-3 border-r border-gray-300">Field</th>
                        <th className="py-2.5 px-3 border-r border-gray-300">Student Name</th>
                        <th className="py-2.5 px-3 border-r border-gray-300">Email</th>
                        <th className="py-2.5 px-3 border-r border-gray-300">Program</th>
                        <th className="py-2.5 px-3 border-r border-gray-300 text-center">CGPA</th>
                        <th className="py-2.5 px-3 text-center">Accum CH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            <div className="max-w-md mx-auto space-y-2">
                              <p className="font-bold text-gray-700">No students currently registered in {selectedCourse}.</p>
                              <p className="text-[11px] text-gray-500">
                                Open the Database Students Directory to assign students in your database to this course with 1 click.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuSection('academic-duties');
                                  setActiveSubMenu('database-students');
                                }}
                                className="mt-2 px-3 py-1.5 bg-[#0c4ca3] hover:bg-[#093a7d] text-white rounded font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Go to Database Students Directory</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((stud, idx) => (
                          <tr 
                            key={stud.id} 
                            className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'}`}
                          >
                            <td className="py-2 px-3 border-r border-gray-200 font-mono font-bold text-gray-800">
                              {stud.studentId}
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 text-gray-600">
                              {stud.field}
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 font-bold text-[#0c4ca3]">
                              {stud.name}
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 text-gray-600">
                              {stud.email}
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 text-gray-700">
                              {stud.program}
                            </td>
                            <td className="py-2 px-3 border-r border-gray-200 font-bold text-center text-emerald-800">
                              {stud.cgpa.toFixed(3)}
                            </td>
                            <td className="py-2 px-3 font-semibold text-center text-gray-700">
                              {stud.accumCh.toFixed(3)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls matching Photo 3 */}
                <div className="px-4 py-2.5 bg-[#f1f5f9] border-t border-[#c4cedb] flex items-center justify-start gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs cursor-pointer ${
                      currentPage === 1 ? 'bg-[#6aa123] text-white' : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(2)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs cursor-pointer ${
                      currentPage === 2 ? 'bg-[#6aa123] text-white' : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    2
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(3)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs cursor-pointer ${
                      currentPage === 3 ? 'bg-[#6aa123] text-white' : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    3
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* OPTION 2: ACADEMIC ADVISING (Photo 1 & 4) */}
          {activeSubMenu === 'academic-advising' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-5">
                
                {/* Header with two dots icon from Photo 4 */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-1 text-[#d99b26]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d99b26] inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dfcaa0] inline-block"></span>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">Search</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs max-w-4xl">
                  
                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">Academic Advisor:</span>
                    <span className="font-bold text-gray-900">Hend Adel Ahmed Fouad</span>
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">Field:</span>
                    <select
                      value={advisingField}
                      onChange={(e) => setAdvisingField(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1 text-xs bg-white flex-1"
                    >
                      <option value="Field of Electrical Engineering">Field of Electrical Engineering</option>
                      <option value="Field of Engineering Technology">Field of Engineering Technology</option>
                      <option value="Field of Computer Science">Field of Computer Science</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">Academic Year:</span>
                    <select
                      value={advisingYear}
                      onChange={(e) => setAdvisingYear(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1 text-xs bg-white w-40"
                    >
                      <option value="2026/2027">2026/2027</option>
                      <option value="2025/2026">2025/2026</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">Semester Order:</span>
                    <select
                      value={advisingSemester}
                      onChange={(e) => setAdvisingSemester(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1 text-xs bg-white w-40"
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">Student ID:</span>
                    <input
                      type="text"
                      value={advisingStudentId}
                      onChange={(e) => setAdvisingStudentId(e.target.value)}
                      placeholder="e.g. 250103180"
                      className="border border-gray-300 rounded px-2.5 py-1 text-xs flex-1"
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">Student Name:</span>
                    <input
                      type="text"
                      value={advisingStudentName}
                      onChange={(e) => setAdvisingStudentName(e.target.value)}
                      placeholder="e.g. Ahmed"
                      className="border border-gray-300 rounded px-2.5 py-1 text-xs flex-1"
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">CGPA:</span>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        step="0.1"
                        value={advisingCgpaMin}
                        onChange={(e) => setAdvisingCgpaMin(e.target.value)}
                        placeholder="Min"
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <span className="text-gray-500 font-semibold">To</span>
                      <input
                        type="number"
                        step="0.1"
                        value={advisingCgpaMax}
                        onChange={(e) => setAdvisingCgpaMax(e.target.value)}
                        placeholder="Max"
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="w-36 font-semibold text-gray-700">Status:</span>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="blockStatus"
                          checked={advisingBlockFilter === 'all'}
                          onChange={() => setAdvisingBlockFilter('all')}
                        />
                        <span>All</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="blockStatus"
                          checked={advisingBlockFilter === 'block'}
                          onChange={() => setAdvisingBlockFilter('block')}
                        />
                        <span>Block</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="blockStatus"
                          checked={advisingBlockFilter === 'unblock'}
                          onChange={() => setAdvisingBlockFilter('unblock')}
                        />
                        <span>UnBlock</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Green Search Button from Photo 4 + Add Advisee from Database Button */}
                <div className="mt-5 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => showToast(`Advising criteria applied. Found ${adviseeResults.length} advisees.`)}
                    className="bg-[#4d8226] hover:bg-[#406e20] text-white px-5 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Advisees</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuSection('academic-duties');
                      setActiveSubMenu('database-students');
                    }}
                    className="bg-[#0c4ca3] hover:bg-[#093a7d] text-white px-4 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Students to Advising from Database</span>
                  </button>
                </div>

              </div>

              {/* Advisees Results Table */}
              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#c4cedb] flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">Assigned Advisees: {adviseeResults.length}</span>
                    <span className="text-[11px] text-gray-500">({teacherName}'s Advising Roster)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuSection('academic-duties');
                      setActiveSubMenu('database-students');
                    }}
                    className="px-3 py-1 bg-[#6aa123] hover:bg-[#5b8c1c] text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Browse Database & Add Advisees</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11.5px]">
                    <thead className="bg-[#cbd5e1] text-[#1e293b] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Program</th>
                        <th className="py-2.5 px-3 text-center">CGPA</th>
                        <th className="py-2.5 px-3 text-center">Registration Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {adviseeResults.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            <div className="max-w-md mx-auto space-y-2.5">
                              <ShieldCheck className="w-8 h-8 text-gray-400 mx-auto" />
                              <p className="font-bold text-gray-800 text-sm">No advisees currently assigned to your roster.</p>
                              <p className="text-[11.5px] text-gray-500">
                                You can browse all students in the SUT database and assign them to your Academic Advising cohort.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuSection('academic-duties');
                                  setActiveSubMenu('database-students');
                                }}
                                className="px-3.5 py-1.5 bg-[#0c4ca3] hover:bg-[#093a7d] text-white rounded font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Open Database Students Directory</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        adviseeResults.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-bold text-gray-900">{s.studentId}</td>
                            <td className="py-2 px-3">
                              <div className="font-bold text-[#0c4ca3]">{s.name}</div>
                              <div className="text-[10px] text-gray-500">{s.email}</div>
                            </td>
                            <td className="py-2 px-3 text-gray-600">{s.program}</td>
                            <td className="py-2 px-3 font-bold text-center text-emerald-800">{s.cgpa.toFixed(3)}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10.5px] ${
                                s.blocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {s.blocked ? 'Blocked' : 'Active Registration'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = sutStudents.map(item => item.id === s.id ? { ...item, blocked: !item.blocked } : item);
                                    setSutStudents(updated);
                                    showToast(`Student ${s.name} registration ${s.blocked ? 'unblocked' : 'blocked'}.`);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                                    s.blocked ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'
                                  }`}
                                >
                                  {s.blocked ? 'Unblock' : 'Block'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    userStore.removeAdvisorFromStudent(s.studentId);
                                    reloadStoreStudents();
                                    showToast(`Removed ${s.name} from your advisees list.`);
                                  }}
                                  className="px-2 py-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 border border-gray-300 rounded text-[11px] font-semibold cursor-pointer"
                                  title="Remove student from your advisee roster"
                                >
                                  Remove
                                </button>

                                {s.rawUser && (
                                  <button
                                    type="button"
                                    onClick={() => onSwitchToStudentView(s.rawUser)}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#0c4ca3] border border-blue-200 rounded text-[11px] font-bold cursor-pointer"
                                    title="View full Student SIS profile"
                                  >
                                    Inspect SIS
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* OPTION 3: ADD NEW STUDENT FORM (User Explicit Requirement) */}
          {activeSubMenu === 'add-student' && (
            <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-6 max-w-2xl">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
                <UserPlus className="w-5 h-5 text-[#6aa123]" />
                <h2 className="text-sm font-bold text-gray-800">
                  Register New Student (Teacher Data Entry Mode)
                </h2>
              </div>

              <form onSubmit={handleAddNewStudent} className="space-y-4">
                <p className="text-gray-500 text-[11.5px]">
                  Add student details into SUT database and your faculty advising list.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={addStudentForm.firstName}
                      onChange={(e) => setAddStudentForm({ ...addStudentForm, firstName: e.target.value })}
                      placeholder="e.g. Ahmed"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={addStudentForm.lastName}
                      onChange={(e) => setAddStudentForm({ ...addStudentForm, lastName: e.target.value })}
                      placeholder="e.g. Mahmoud"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addStudentForm.email}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                    placeholder="e.g. ahmed.mahmoud@sut.edu.eg"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={addStudentForm.dateOfBirth}
                      onChange={(e) => setAddStudentForm({ ...addStudentForm, dateOfBirth: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Grade Level</label>
                    <select
                      value={addStudentForm.gradeLevel}
                      onChange={(e) => setAddStudentForm({ ...addStudentForm, gradeLevel: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white"
                    >
                      <option value="Level 1">Level 1 (Freshman)</option>
                      <option value="Level 2">Level 2 (Sophomore)</option>
                      <option value="Level 3">Level 3 (Junior)</option>
                      <option value="Level 4">Level 4 (Senior)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={addStudentForm.studentId}
                      onChange={(e) => setAddStudentForm({ ...addStudentForm, studentId: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Initial CGPA</label>
                    <input
                      type="number"
                      step="0.001"
                      value={addStudentForm.cgpa}
                      onChange={(e) => setAddStudentForm({ ...addStudentForm, cgpa: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Accum CH</label>
                    <input
                      type="number"
                      step="1"
                      value={addStudentForm.accumCh}
                      onChange={(e) => setAddStudentForm({ ...addStudentForm, accumCh: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Academic Program</label>
                  <select
                    value={addStudentForm.program}
                    onChange={(e) => setAddStudentForm({ ...addStudentForm, program: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="Artificial Intelligence & Data Science Technology Program">Artificial Intelligence & Data Science Technology Program</option>
                    <option value="Network & Cyber Security Engineering">Network & Cyber Security Engineering</option>
                    <option value="Software Engineering Technology">Software Engineering Technology</option>
                    <option value="Industrial Electronics & Control">Industrial Electronics & Control</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveSubMenu('student-register-course')}
                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#6aa123] hover:bg-[#5b8c1c] text-white font-bold rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Student Record</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* OPTION 4: COURSE ATTENDANCE & SESSIONS */}
          {activeSubMenu === 'course-attendance' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Course</label>
                    <span className="font-bold text-gray-800">CET442 - Selected Topic in Data Science</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Session Date</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Type</label>
                    <select
                      value={attendanceSession}
                      onChange={(e) => setAttendanceSession(e.target.value as any)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      <option value="lecture">Lecture (2 hrs)</option>
                      <option value="lab">Practical Lab (2 hrs)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast(`Attendance submitted for ${attendanceDate} (${attendanceSession}).`)}
                  className="bg-[#6aa123] hover:bg-[#5b8c1c] text-white font-bold px-4 py-1.5 rounded cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Attendance</span>
                </button>
              </div>

              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs overflow-hidden">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="bg-[#cbd5e1] text-[#1e293b] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 text-center">Total Absences</th>
                      <th className="py-2.5 px-3 text-center">Attendance %</th>
                      <th className="py-2.5 px-3 text-right">Mark Today</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      const enrolledInCourse = sutStudents.filter(s => 
                        s.courses && s.courses.some(c => c.code.toUpperCase() === 'CET442' && (c.status === 'registered' || c.status === 'passed'))
                      );
                      if (enrolledInCourse.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              <p className="font-bold text-gray-700">No students currently enrolled in CET442</p>
                              <p className="text-xs text-gray-500 mt-1">Enroll students into this course from the Database Students Directory.</p>
                              <button
                                type="button"
                                onClick={() => setActiveSubMenu('all-students-directory')}
                                className="mt-3 px-3 py-1 bg-[#0c4ca3] hover:bg-[#093d84] text-white text-xs font-bold rounded cursor-pointer transition-colors"
                              >
                                Go to Students Directory →
                              </button>
                            </td>
                          </tr>
                        );
                      }
                      return enrolledInCourse.map((s) => {
                        const status = attendanceRecords[s.studentId] || 'present';
                        const pct = Math.round(((s.totalSessions! - s.absences!) / s.totalSessions!) * 100);
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-bold text-gray-800">{s.studentId}</td>
                            <td className="py-2 px-3 font-bold text-[#0c4ca3]">{s.name}</td>
                            <td className="py-2 px-3 text-center font-bold text-red-700">{s.absences} hrs</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold ${pct >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {pct}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="inline-flex rounded-md shadow-2xs" role="group">
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.studentId]: 'present' })}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-l border border-gray-300 cursor-pointer ${
                                    status === 'present' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.studentId]: 'absent' })}
                                  className={`px-2.5 py-1 text-xs font-bold border-t border-b border-gray-300 cursor-pointer ${
                                    status === 'absent' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.studentId]: 'excused' })}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-r border border-gray-300 cursor-pointer ${
                                    status === 'excused' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Excused
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OPTION 5: ABSENCE FOLLOWUP & WARNINGS (Photo 1 & 7) */}
          {(activeSubMenu === 'absence-followup' || activeSubMenu === 'absence-warnings') && (
            <div className="space-y-4">
              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-1">
                  List of Students with Absence Warnings (B.Tech Regulations)
                </h3>
                <p className="text-gray-500 text-[11px]">
                  Warning 1: 10% Absence (2 lectures) • Warning 2: 15% Absence (3 lectures) • Denied (Hormān): 25% Absence (5 lectures).
                </p>
              </div>

              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs overflow-hidden">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="bg-[#cbd5e1] text-[#1e293b] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3 text-center">Absence Hours</th>
                      <th className="py-2.5 px-3 text-center">Warning Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      const enrolledAbsentees = sutStudents.filter(s => 
                        s.courses && s.courses.some(c => c.code.toUpperCase() === 'CET442') && (s.absences || 0) > 0
                      );
                      if (enrolledAbsentees.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-gray-500 font-semibold">
                              No students registered in CET442 currently have recorded absence warnings.
                            </td>
                          </tr>
                        );
                      }
                      return enrolledAbsentees.map((s) => {
                        const isWarning2 = (s.absences || 0) >= 3;
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-bold text-gray-900">{s.studentId}</td>
                            <td className="py-2 px-3 font-bold text-[#0c4ca3]">{s.name}</td>
                            <td className="py-2 px-3 text-gray-600">{selectedCourse}</td>
                            <td className="py-2 px-3 text-center font-bold text-red-700">{s.absences} hrs</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10.5px] ${
                                isWarning2 ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {isWarning2 ? 'Warning 2 (High Risk)' : 'Warning 1 (Official)'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => showToast(`Official absence notice emailed to ${s.email}`)}
                                className="px-2.5 py-1 bg-[#d99b26] hover:bg-[#c2871b] text-white rounded font-bold cursor-pointer"
                              >
                                Dispatch Notice
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OPTION 6: COURSE GRADING (Photo 1) */}
          {activeSubMenu === 'course-grading' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-gray-800">Course Assessment & Marks Entry</h3>
                  <span className="text-gray-500 text-[11px]">CET442 - Selected Topic in Data Science (Term Fall 2026/2027)</span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('All student marks saved and updated in SUT database!')}
                  className="bg-[#6aa123] hover:bg-[#5b8c1c] text-white font-bold px-4 py-1.5 rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  <span>Submit Final Grades</span>
                </button>
              </div>

              <div className="bg-white border border-[#c4cedb] rounded shadow-2xs overflow-hidden">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="bg-[#cbd5e1] text-[#1e293b] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 text-center">Midterm (20)</th>
                      <th className="py-2.5 px-3 text-center">Lab Practical (20)</th>
                      <th className="py-2.5 px-3 text-center">Final Exam (40)</th>
                      <th className="py-2.5 px-3 text-center">Total (80 + 20)</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      const enrolledToGrade = sutStudents.filter(s => 
                        s.courses && s.courses.some(c => c.code.toUpperCase() === 'CET442' && (c.status === 'registered' || c.status === 'passed'))
                      );
                      if (enrolledToGrade.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-500">
                              <p className="font-bold text-gray-700">No students currently enrolled in CET442 to grade</p>
                              <p className="text-xs text-gray-500 mt-1">Enroll students into this course from the Database Students Directory.</p>
                              <button
                                type="button"
                                onClick={() => setActiveSubMenu('all-students-directory')}
                                className="mt-3 px-3 py-1 bg-[#0c4ca3] hover:bg-[#093d84] text-white text-xs font-bold rounded cursor-pointer transition-colors"
                              >
                                Go to Students Directory to Enroll Students →
                              </button>
                            </td>
                          </tr>
                        );
                      }
                      return enrolledToGrade.map((s) => {
                        const grades = studentGrades[s.studentId] || { midterm: 18, practical: 18, finalExam: 36 };
                        const total = grades.midterm + grades.practical + grades.finalExam + 18;
                        const letter = total >= 90 ? 'A' : total >= 85 ? 'A-' : total >= 80 ? 'B+' : total >= 75 ? 'B' : 'C';
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-bold text-gray-900">{s.studentId}</td>
                            <td className="py-2 px-3 font-bold text-[#0c4ca3]">{s.name}</td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={grades.midterm}
                                onChange={(e) => setStudentGrades({
                                  ...studentGrades,
                                  [s.studentId]: { ...grades, midterm: parseInt(e.target.value) || 0 }
                                })}
                                className="w-14 text-center border border-gray-300 rounded px-1 py-0.5 font-bold"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={grades.practical}
                                onChange={(e) => setStudentGrades({
                                  ...studentGrades,
                                  [s.studentId]: { ...grades, practical: parseInt(e.target.value) || 0 }
                                })}
                                className="w-14 text-center border border-gray-300 rounded px-1 py-0.5 font-bold"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="40"
                                value={grades.finalExam}
                                onChange={(e) => setStudentGrades({
                                  ...studentGrades,
                                  [s.studentId]: { ...grades, finalExam: parseInt(e.target.value) || 0 }
                                })}
                                className="w-14 text-center border border-gray-300 rounded px-1 py-0.5 font-bold"
                              />
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-gray-900">{total} / 100</td>
                            <td className="py-2 px-3 text-center font-black text-emerald-700">{letter}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OPTION 7: FACULTY SCHEDULE REPORT (Photo 7 & 8) */}
          {activeSubMenu === 'faculty-schedule' && (
            <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <div>
                  <h3 className="font-bold text-sm text-gray-800">Faculty Schedule Report</h3>
                  <span className="text-gray-500 text-[11px]">Academic Term 2026/2027 (Fall) • Dr. Hend Adel Ahmed Fouad</span>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-[#0c4ca3] hover:bg-[#093a7d] text-white px-3 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Schedule</span>
                </button>
              </div>

              <table className="w-full text-left text-xs border border-gray-300">
                <thead className="bg-[#cbd5e1] text-[#1e293b] font-bold">
                  <tr>
                    <th className="py-2 px-3 border border-gray-300">Day</th>
                    <th className="py-2 px-3 border border-gray-300">Time</th>
                    <th className="py-2 px-3 border border-gray-300">Course Code & Name</th>
                    <th className="py-2 px-3 border border-gray-300">Section</th>
                    <th className="py-2 px-3 border border-gray-300">Hall / Lab</th>
                    <th className="py-2 px-3 border border-gray-300">Credit Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2.5 px-3 font-bold border border-gray-300">Sunday</td>
                    <td className="py-2.5 px-3 border border-gray-300">10:00 - 12:00</td>
                    <td className="py-2.5 px-3 font-bold text-[#0c4ca3] border border-gray-300">CET442 - Selected Topic in Data Science (Lecture)</td>
                    <td className="py-2.5 px-3 border border-gray-300">Sec 01</td>
                    <td className="py-2.5 px-3 border border-gray-300">Hall 3</td>
                    <td className="py-2.5 px-3 border border-gray-300">3 CH</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-2.5 px-3 font-bold border border-gray-300">Tuesday</td>
                    <td className="py-2.5 px-3 border border-gray-300">12:30 - 14:30</td>
                    <td className="py-2.5 px-3 font-bold text-[#0c4ca3] border border-gray-300">CET442 - Selected Topic in Data Science (Practical Lab)</td>
                    <td className="py-2.5 px-3 border border-gray-300">Sec 01</td>
                    <td className="py-2.5 px-3 border border-gray-300">Computer Lab 204</td>
                    <td className="py-2.5 px-3 border border-gray-300">3 CH</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold border border-gray-300">Wednesday</td>
                    <td className="py-2.5 px-3 border border-gray-300">09:00 - 11:00</td>
                    <td className="py-2.5 px-3 font-bold text-[#0c4ca3] border border-gray-300">CS102 - Data Structures (Lecture)</td>
                    <td className="py-2.5 px-3 border border-gray-300">Sec 02</td>
                    <td className="py-2.5 px-3 border border-gray-300">Auditorium A</td>
                    <td className="py-2.5 px-3 border border-gray-300">3 CH</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-2.5 px-3 font-bold border border-gray-300">Thursday</td>
                    <td className="py-2.5 px-3 border border-gray-300">11:00 - 13:00</td>
                    <td className="py-2.5 px-3 font-bold text-gray-700 border border-gray-300">Academic Advising & Office Hours</td>
                    <td className="py-2.5 px-3 border border-gray-300">All</td>
                    <td className="py-2.5 px-3 border border-gray-300">Faculty Office B-204</td>
                    <td className="py-2.5 px-3 border border-gray-300">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* OPTION 8: COMMUNICATE WITH STUDENTS / MOODLE (Photo 6) */}
          {activeSubMenu === 'communicate-students' && (
            <div className="bg-white border border-[#c4cedb] rounded shadow-2xs overflow-hidden flex flex-col md:flex-row h-[600px]">
              
              {/* Left Contacts Drawer (Photo 6) */}
              <div className="w-full md:w-72 border-r border-gray-200 bg-[#f8fafc] flex flex-col">
                <div className="p-3 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs outline-none"
                    />
                    <button type="button" className="text-gray-500 hover:text-gray-700">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0c4ca3]" />
                    <span>Contacts</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
                  <div>
                    <div className="font-bold text-gray-500 text-[11px] mb-1 px-2">› Students in Cohort ({sutStudents.length})</div>
                    {sutStudents.length === 0 ? (
                      <div className="px-2 py-4 text-gray-400 text-[11px] italic text-center">
                        No students in database
                      </div>
                    ) : (
                      sutStudents.map(s => (
                        <div 
                          key={s.id}
                          onClick={() => setActiveContact(s.name)}
                          className={`p-2 rounded cursor-pointer transition-colors ${activeContact === s.name ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-gray-200 text-gray-800'}`}
                        >
                          <div className="font-semibold text-xs text-gray-900">{s.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{s.studentId} • {s.level}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 flex flex-col bg-white">
                <div className="p-3 border-b border-gray-200 bg-[#f1f5f9] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-gray-900">{activeContact}</div>
                    <div className="text-[10.5px] text-emerald-700 font-semibold">Active Advisee (CET442)</div>
                  </div>
                  <span className="text-[11px] text-gray-500">Moodle E-Learning Messaging</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fdfdfd]">
                  {chatMessages.map((msg, mIdx) => (
                    <div 
                      key={mIdx}
                      className={`flex flex-col ${msg.sender.includes('Hend') ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-md p-3 rounded-lg text-xs ${
                        msg.sender.includes('Hend') ? 'bg-[#0c4ca3] text-white' : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        <div className="font-bold text-[10.5px] opacity-85 mb-1">{msg.sender}</div>
                        <div>{msg.text}</div>
                        <div className="text-[9.5px] opacity-70 text-right mt-1">{msg.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type message to advisee..."
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="bg-[#0c4ca3] hover:bg-[#093a7d] text-white px-4 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* OPTION 9: BULK DROP & COURSE ADMIN (Photo 5) */}
          {activeSubMenu === 'bulk-drop' && (
            <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-800">Bulk Drop / Course Registration Administration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded space-y-2">
                  <h4 className="font-bold text-xs text-gray-700">Search Course</h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600">Field</label>
                    <span className="font-bold text-gray-800">Field of Engineering Technology</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600">Course Code</label>
                    <span className="font-bold text-[#0c4ca3]">CET442</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600">Section</label>
                    <span className="font-bold text-gray-800">All Sections</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded space-y-2">
                  <h4 className="font-bold text-xs text-gray-700">Search Student Filters</h4>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" />
                    <span>Not Paid Tuition Fees</span>
                  </label>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600">Program</label>
                    <span className="font-bold text-gray-800">Artificial Intelligence & Data Science</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600">Registered CH</label>
                    <span className="font-bold text-gray-800">18 CH</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => showToast('Bulk drop audit verified. All students in good financial standing.')}
                  className="bg-[#0c4ca3] hover:bg-[#093a7d] text-white px-5 py-1.5 rounded font-bold cursor-pointer"
                >
                  Verify Registrations
                </button>
              </div>
            </div>
          )}

          {/* OPTION 10: PETITIONS & WITHDRAWALS */}
          {activeSubMenu === 'petitions' && (
            <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-800">Course Drop / Incomplete & Withdrawal Petitions</h3>
              
              {(() => {
                const allUsers = userStore.getUsers();
                const realPetitions = allUsers
                  .filter(u => u.role === 'student' && u.requests && u.requests.length > 0)
                  .flatMap(u => (u.requests || []).map(r => ({
                    ...r,
                    studentId: u.studentProfile?.studentId || u.id,
                    studentName: u.name,
                    studentEmail: u.email
                  })));

                if (realPetitions.length === 0) {
                  return (
                    <div className="py-10 text-center text-gray-500 border border-dashed border-gray-300 rounded bg-gray-50/50">
                      <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="font-bold text-gray-700">No Pending Student Petitions</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                        There are currently no active course withdrawal or incomplete examination requests submitted by students. When students file requests from their portal, they will appear here.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded">
                    {realPetitions.map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                        <div>
                          <div className="font-bold text-xs text-gray-900">{p.studentName} ({p.studentId})</div>
                          <div className="text-[11px] text-gray-700 mt-0.5"><span className="font-semibold text-gray-900">Request:</span> {p.requestType} - {p.details || 'Official petition'}</div>
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">Date: {p.submittedDate} • Status: <span className="font-bold text-amber-700">{p.status}</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              userStore.reviewStudentRequest(p.studentId, p.id, 'Approved', 'Approved by faculty advisor.', teacherName);
                              showToast(`Petition for ${p.studentName} approved.`);
                              reloadStoreStudents();
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              userStore.reviewStudentRequest(p.studentId, p.id, 'Rejected', 'Declined by faculty advisor.', teacherName);
                              showToast(`Petition for ${p.studentName} rejected.`);
                              reloadStoreStudents();
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* OPTION 11: EDIT SECTIONS */}
          {activeSubMenu === 'sections' && (
            <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-800">Edit Sections & Capacity Quotas</h3>
              
              <table className="w-full text-left text-xs border border-gray-300">
                <thead className="bg-[#cbd5e1] text-gray-900 font-bold">
                  <tr>
                    <th className="py-2 px-3 border border-gray-300">Course Code</th>
                    <th className="py-2 px-3 border border-gray-300">Section</th>
                    <th className="py-2 px-3 border border-gray-300">Assigned Instructor</th>
                    <th className="py-2 px-3 border border-gray-300 text-center">Max Capacity</th>
                    <th className="py-2 px-3 border border-gray-300 text-center">Enrolled</th>
                    <th className="py-2 px-3 border border-gray-300 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-[#0c4ca3] border border-gray-300">CET442</td>
                    <td className="py-2 px-3 border border-gray-300">Sec 01</td>
                    <td className="py-2 px-3 font-bold border border-gray-300">Dr. Hend Adel Ahmed Fouad</td>
                    <td className="py-2 px-3 text-center border border-gray-300">30</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700 border border-gray-300">28</td>
                    <td className="py-2 px-3 text-right border border-gray-300">
                      <button
                        type="button"
                        onClick={() => showToast('Section capacity updated.')}
                        className="px-2.5 py-1 bg-[#0c4ca3] text-white rounded font-bold text-xs"
                      >
                        Adjust Quota
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </main>

      </div>

      {/* ── FOOTER FROM PHOTO 3 & 4 ──────────────────────────────── */}
      <footer className="bg-[#e2e8f0] text-gray-600 text-[11px] px-6 py-2.5 border-t border-gray-300 flex flex-wrap items-center justify-between gap-2">
        <div>
          © Copyright 2023. Informatique Education. All Rights Reserved
        </div>
        <div className="font-bold text-[#334155] flex items-center gap-1">
          <span>Go to</span>
          <span className="text-[#0c4ca3] font-black">SUMIS</span>
          <span>- UNIVERSITY MANAGEMENT INFORMATION SYSTEM</span>
        </div>
      </footer>

    </div>
  );
};
