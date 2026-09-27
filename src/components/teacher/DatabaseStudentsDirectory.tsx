import React, { useState } from 'react';
import { UserAccount, Course } from '../../types';
import { userStore } from '../../data/userStore';
import { 
  Users, 
  Search, 
  UserPlus, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  GraduationCap, 
  Award, 
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Filter
} from 'lucide-react';

interface Props {
  currentUser: UserAccount;
  onSwitchToStudentView?: (student: UserAccount) => void;
  onOpenAddStudent?: () => void;
  onNavigateToAdvising?: () => void;
  onNavigateToCourseRegister?: () => void;
}

export const DatabaseStudentsDirectory: React.FC<Props> = ({
  currentUser,
  onSwitchToStudentView,
  onOpenAddStudent,
  onNavigateToAdvising,
  onNavigateToCourseRegister,
}) => {
  const [students, setStudents] = useState<UserAccount[]>(() => userStore.getAllStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [advisorFilter, setAdvisorFilter] = useState<'all' | 'my-advisees' | 'unassigned' | 'others'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('All');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal to enroll student in a course
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<UserAccount | null>(null);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState<string>('CET442');

  const teacherName = currentUser.teacherProfile?.teacherName || currentUser.name;
  const teacherEmail = currentUser.teacherProfile?.email || currentUser.email;

  // Courses taught by this faculty member
  const teacherCourses = currentUser.teacherProfile?.assignedCourses || [
    'CET442 - Selected Topic in Data Science',
    'CS102 - Data Structures & Algorithms',
    'ET104 - Embedded Systems'
  ];

  const availableCoursesList = [
    { code: 'CET442', title: 'Selected Topic in Data Science', ch: 3 },
    { code: 'CS102', title: 'Data Structures & Algorithms', ch: 3 },
    { code: 'ET104', title: 'Embedded Systems & IoT', ch: 3 },
    { code: 'CS201', title: 'Algorithms Design & Complexity', ch: 3 },
    { code: 'AI301', title: 'Deep Learning & Neural Networks', ch: 3 },
  ];

  const refreshData = () => {
    setStudents(userStore.getAllStudents());
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Add / Assign student as advisee
  const handleAssignAdvisee = (student: UserAccount) => {
    const studentId = student.studentProfile?.studentId || '';
    const res = userStore.assignAdvisorToStudent(studentId, teacherName, teacherEmail);
    if (res.success) {
      refreshData();
      showToast(`Student ${student.name} (${studentId}) is now assigned to your Academic Advising roster.`);
    } else {
      showToast(res.error || 'Failed to assign advisee.');
    }
  };

  // Remove advisee
  const handleRemoveAdvisee = (student: UserAccount) => {
    const studentId = student.studentProfile?.studentId || '';
    const res = userStore.removeAdvisorFromStudent(studentId);
    if (res.success) {
      refreshData();
      showToast(`Student ${student.name} removed from your advising roster.`);
    }
  };

  // Enroll student into teacher's course
  const handleEnrollStudent = (student: UserAccount, courseCode: string, courseTitle: string) => {
    const studentId = student.studentProfile?.studentId || '';
    const res = userStore.enrollStudentInTeacherCourse(studentId, courseCode, courseTitle, teacherName);
    if (res.success) {
      refreshData();
      setSelectedStudentForEnroll(null);
      showToast(`Student ${student.name} (${studentId}) successfully enrolled in ${courseCode} - ${courseTitle}!`);
    } else {
      showToast(res.error || 'Failed to enroll student.');
    }
  };

  // Drop student from course
  const handleDropStudent = (student: UserAccount, courseCode: string) => {
    const studentId = student.studentProfile?.studentId || '';
    const res = userStore.dropStudentFromTeacherCourse(studentId, courseCode);
    if (res.success) {
      refreshData();
      showToast(`Student ${student.name} dropped from ${courseCode}.`);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const profile = s.studentProfile;
    if (!profile) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q) || profile.studentName.toLowerCase().includes(q);
      const matchId = profile.studentId.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail) return false;
    }

    // Program
    if (selectedProgram !== 'All') {
      if (!profile.studentProgram.toLowerCase().includes(selectedProgram.toLowerCase())) {
        return false;
      }
    }

    // Level
    if (selectedLevel !== 'All') {
      if (profile.level !== selectedLevel) return false;
    }

    // Advisor filter
    if (advisorFilter === 'my-advisees') {
      const isMyAdvisee = profile.advisorName.includes(teacherName) || 
        profile.advisorEmail?.toLowerCase() === teacherEmail.toLowerCase() ||
        (teacherName.includes('Hend') && profile.advisorName.includes('Hend'));
      if (!isMyAdvisee) return false;
    } else if (advisorFilter === 'unassigned') {
      const isUnassigned = !profile.advisorName || 
        profile.advisorName.includes('Pending') || 
        profile.advisorName.includes('Unassigned');
      if (!isUnassigned) return false;
    } else if (advisorFilter === 'others') {
      const isMyAdvisee = profile.advisorName.includes(teacherName) || 
        profile.advisorEmail?.toLowerCase() === teacherEmail.toLowerCase() ||
        (teacherName.includes('Hend') && profile.advisorName.includes('Hend'));
      const isUnassigned = !profile.advisorName || 
        profile.advisorName.includes('Pending') || 
        profile.advisorName.includes('Unassigned');
      if (isMyAdvisee || isUnassigned) return false;
    }

    // Course filter
    if (courseFilter !== 'All') {
      const cleanFilter = courseFilter.split('-')[0].trim().toUpperCase();
      const isEnrolled = s.courses?.some(c => 
        c.code.toUpperCase() === cleanFilter && (c.status === 'registered' || c.status === 'passed')
      );
      if (!isEnrolled) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-600 text-white rounded font-bold text-xs shadow-md flex items-center justify-between transition-all animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{notification}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="text-white hover:text-emerald-200 text-xs font-mono font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-[#c4cedb] rounded shadow-2xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0c4ca3] inline-block"></span>
              <h2 className="text-base font-bold text-gray-900">
                Database Students Directory & Course Assignment
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Browse all students registered in the SUT database. Assign advisees to your cohort and enroll students into the courses you teach.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenAddStudent && (
              <button
                type="button"
                onClick={onOpenAddStudent}
                className="bg-[#6aa123] hover:bg-[#5b8c1e] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register New Student</span>
              </button>
            )}

            {onNavigateToAdvising && (
              <button
                type="button"
                onClick={onNavigateToAdvising}
                className="bg-[#0c4ca3] hover:bg-[#093a7d] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Academic Advising View</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, student ID, or email..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-xs outline-none focus:border-[#0c4ca3]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
          </div>

          {/* Program Filter */}
          <div>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs bg-white"
            >
              <option value="All">All Academic Programs</option>
              <option value="Artificial Intelligence">AI & Data Science Technology</option>
              <option value="Computer Science">Computer Science Technology</option>
              <option value="Network">Network & Cyber Security</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs bg-white"
            >
              <option value="All">All Levels (1 - 4)</option>
              <option value="Level 1">Level 1 (Freshmen)</option>
              <option value="Level 2">Level 2 (Sophomores)</option>
              <option value="Level 3">Level 3 (Juniors)</option>
              <option value="Level 4">Level 4 (Seniors)</option>
            </select>
          </div>

          {/* Advisor Filter */}
          <div>
            <select
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs bg-white font-semibold text-gray-800"
            >
              <option value="all">Advisor: All Students</option>
              <option value="my-advisees">★ My Advisees Only</option>
              <option value="unassigned">⚠️ Unassigned / Pending</option>
              <option value="others">Other Advisors</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Badges */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-500 font-bold flex items-center gap-1">
              <Filter className="w-3 h-3 text-gray-400" /> Filter by My Courses:
            </span>
            <button
              type="button"
              onClick={() => setCourseFilter('All')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold ${courseFilter === 'All' ? 'bg-[#0c4ca3] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Courses
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('CET442')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold ${courseFilter === 'CET442' ? 'bg-[#0c4ca3] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              CET442 (Data Science)
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('CS102')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold ${courseFilter === 'CS102' ? 'bg-[#0c4ca3] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              CS102 (Data Structures)
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('ET104')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold ${courseFilter === 'ET104' ? 'bg-[#0c4ca3] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ET104 (Embedded Systems)
            </button>
          </div>

          <div className="font-semibold text-gray-600">
            Total Students Found: <strong className="text-[#0c4ca3]">{filteredStudents.length}</strong> / {students.length} in Database
          </div>
        </div>
      </div>

      {/* Main Student Directory Table */}
      <div className="bg-white border border-[#c4cedb] rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#cbd5e1] text-[#1e293b] font-bold">
              <tr>
                <th className="py-2.5 px-3 border-r border-gray-300">Student ID</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Full Name & Contact</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Program & Level</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">CGPA / Passed CH</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Academic Advisor</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Enrolled in My Courses</th>
                <th className="py-2.5 px-3 text-center">Manage Student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-medium">
                    No students match the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stud, idx) => {
                  const profile = stud.studentProfile!;
                  const isMyAdvisee = profile.advisorName.includes(teacherName) || 
                    profile.advisorEmail?.toLowerCase() === teacherEmail.toLowerCase() ||
                    (teacherName.includes('Hend') && profile.advisorName.includes('Hend'));
                  const isUnassigned = !profile.advisorName || 
                    profile.advisorName.includes('Pending') || 
                    profile.advisorName.includes('Unassigned');

                  // Check which teacher courses student is registered in
                  const enrolledTeacherCourses = (stud.courses || []).filter(c => 
                    (c.status === 'registered' || c.status === 'passed') &&
                    (c.code === 'CET442' || c.code === 'CS102' || c.code === 'ET104' || c.instructor?.includes(teacherName))
                  );

                  return (
                    <tr 
                      key={stud.id} 
                      className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'}`}
                    >
                      {/* Student ID */}
                      <td className="py-2.5 px-3 border-r border-gray-200 font-mono font-bold text-gray-800">
                        {profile.studentId}
                      </td>

                      {/* Name & Contact */}
                      <td className="py-2.5 px-3 border-r border-gray-200">
                        <div className="font-bold text-[#0c4ca3] hover:underline cursor-pointer flex items-center gap-1.5"
                          onClick={() => onSwitchToStudentView && onSwitchToStudentView(stud)}
                          title="Click to view student SIS"
                        >
                          <span>{profile.studentName || stud.name}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="text-[11px] text-gray-500">{stud.email}</div>
                      </td>

                      {/* Program & Level */}
                      <td className="py-2.5 px-3 border-r border-gray-200">
                        <div className="font-semibold text-gray-800 line-clamp-1">{profile.studentProgram}</div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          {profile.level} • {profile.degree}
                        </div>
                      </td>

                      {/* CGPA / Passed CH */}
                      <td className="py-2.5 px-3 border-r border-gray-200 text-center">
                        <div className={`font-black text-xs ${
                          profile.cgpa >= 3.0 ? 'text-emerald-700' : profile.cgpa >= 2.0 ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {profile.cgpa.toFixed(2)} CGPA
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {profile.totalPassedCH.toFixed(0)} Passed CH
                        </div>
                      </td>

                      {/* Academic Advisor */}
                      <td className="py-2.5 px-3 border-r border-gray-200">
                        {isMyAdvisee ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Your Advisee</span>
                            </span>
                            <div className="text-[10px] text-gray-500">Dr. Hend Adel Ahmed Fouad</div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdvisee(stud)}
                              className="text-[10px] text-red-600 hover:text-red-800 hover:underline block cursor-pointer"
                            >
                              Remove from Advisees
                            </button>
                          </div>
                        ) : isUnassigned ? (
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10.5px]">
                              Pending Assignment
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAssignAdvisee(stud)}
                              className="text-[11px] bg-[#6aa123] hover:bg-[#5a8b1d] text-white px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add to My Advisees</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-gray-700 font-medium text-[11px]">
                              {profile.advisorName}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAssignAdvisee(stud)}
                              className="text-[10px] text-[#0c4ca3] hover:underline cursor-pointer block font-semibold"
                            >
                              Reassign to Me
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Enrolled in My Courses */}
                      <td className="py-2.5 px-3 border-r border-gray-200">
                        <div className="space-y-1">
                          {enrolledTeacherCourses.length === 0 ? (
                            <span className="text-gray-400 italic text-[11px]">Not enrolled in your courses</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {enrolledTeacherCourses.map((c) => (
                                <span 
                                  key={c.code}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-[#0c4ca3] font-bold text-[10.5px]"
                                >
                                  <BookOpen className="w-2.5 h-2.5" />
                                  <span>{c.code}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDropStudent(stud, c.code)}
                                    title="Drop from course"
                                    className="hover:text-red-600 cursor-pointer ml-0.5"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedStudentForEnroll(stud)}
                            className="text-[10.5px] text-[#0c4ca3] hover:underline font-bold flex items-center gap-0.5 mt-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Assign to Course</span>
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onSwitchToStudentView && (
                            <button
                              type="button"
                              onClick={() => onSwitchToStudentView(stud)}
                              title="Inspect Student SIS Dashboard"
                              className="px-2 py-1 bg-gray-100 hover:bg-[#0c4ca3] hover:text-white text-gray-700 rounded font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>View SIS</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Enroll Student in Course */}
      {selectedStudentForEnroll && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0c4ca3]" />
                <h3 className="font-bold text-sm text-gray-900">
                  Assign Student to Course
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForEnroll(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs space-y-1">
              <div className="font-bold text-gray-900">
                {selectedStudentForEnroll.name}
              </div>
              <div className="text-gray-600 font-mono">
                Student ID: {selectedStudentForEnroll.studentProfile?.studentId}
              </div>
              <div className="text-gray-500">
                {selectedStudentForEnroll.studentProfile?.studentProgram}
              </div>
            </div>

            <div>
              <label className="block font-bold text-xs text-gray-700 mb-1.5">
                Select Course to Enroll In:
              </label>
              <select
                value={selectedCourseToEnroll}
                onChange={(e) => setSelectedCourseToEnroll(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-white font-medium"
              >
                {availableCoursesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.title} ({c.ch} CH)
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-gray-500">
              Enrolling this student will register them for the course, initialize their attendance record at 100%, and update their registered credit hours.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedStudentForEnroll(null)}
                className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const crs = availableCoursesList.find(c => c.code === selectedCourseToEnroll);
                  if (crs) {
                    handleEnrollStudent(selectedStudentForEnroll, crs.code, crs.title);
                  }
                }}
                className="px-4 py-1.5 rounded bg-[#0c4ca3] hover:bg-[#093a7d] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Enrollment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
