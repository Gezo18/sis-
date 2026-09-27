import React, { useState } from 'react';
import { UserAccount, TeacherProfile } from '../../types';
import { userStore } from '../../data/userStore';
import { 
  Building2, Mail, Phone, Clock, Award, BookOpen, 
  Users, CheckCircle2, ShieldCheck, Printer, FileSpreadsheet,
  ExternalLink, Calendar, MapPin
} from 'lucide-react';

interface Props {
  currentUser: UserAccount;
  onNavigateToCourse?: (courseCode: string) => void;
  onNavigateToAdvisees?: () => void;
}

export const TeacherDataView: React.FC<Props> = ({
  currentUser,
  onNavigateToCourse,
  onNavigateToAdvisees,
}) => {
  const allUsers = userStore.getUsers();
  const teacherName = currentUser.teacherProfile?.teacherName || currentUser.name || 'Dr. Hend Adel Ahmed Fouad';
  const realAdvisees = allUsers.filter(u => u.role === 'student' && u.studentProfile?.advisorName === teacherName);
  const realPetitions = realAdvisees.flatMap(u => (u.requests || []).filter(r => r.status === 'Pending' || r.status === 'Under Review'));

  const profile: TeacherProfile = currentUser.teacherProfile || {
    teacherName: teacherName,
    teacherNameAr: 'د. هند عادل أحمد فؤاد',
    staffId: '100248',
    field: 'Field of Engineering Technology',
    degree: 'Ph.D. in Computer Science & Artificial Intelligence',
    teacherProgram: 'Artificial Intelligence & Data Science Technology Program',
    teacherProgramAr: 'برنامج تكنولوجيا الذكاء الاصطناعي وعلوم البيانات - 2023',
    level: 'Senior Faculty (Level 4 Advisor)',
    enrollmentStatus: 'Active (Full-Time Faculty)',
    academicStatus: 'Good Standing',
    totalTeachingCH: 16.0,
    registeredAdvisingCH: realAdvisees.reduce((sum, s) => sum + (s.studentProfile?.registeredCH || 0), 0),
    cgpa: 4.0,
    rating: 4.9,
    department: currentUser.department || 'Computer Engineering & Artificial Intelligence',
    faculty: 'Faculty of Engineering & Technology',
    email: currentUser.email || 'hend.fouad@sut.edu.eg',
    phone: '+20 (15) 412-884',
    officeLocation: currentUser.officeLocation || 'Engineering Building B, Floor 3, Room 304',
    officeHours: currentUser.officeHours || 'Sundays & Tuesdays (10:00 AM - 01:00 PM)',
    assignedCourses: [
      'CET442 - Selected Topic in Data Science',
      'CS102 - Data Structures & Algorithms',
      'ET104 - Embedded Systems Engineering',
    ],
    adviseeCount: realAdvisees.length,
  };

  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(profile.staffId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* ── TOP TITLE BAR (EXACT MATCH OF SCREENSHOT: "Student Academic Plan" BAR) ── */}
      <div className="bg-[#5a6268] text-white px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-[13px] tracking-wide">
          {/* Orange 3-bar hamburger icon from screenshot */}
          <div className="flex flex-col gap-0.5 justify-center py-0.5">
            <span className="w-4 h-0.5 bg-[#dfcaa0]"></span>
            <span className="w-4 h-0.5 bg-[#dfcaa0]"></span>
            <span className="w-4 h-0.5 bg-[#dfcaa0]"></span>
          </div>
          <span>Teacher Academic Data (Staff Member Profile)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
            title="Print Staff Profile Document"
          >
            <Printer className="w-3 h-3" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* ── CARD REPLICA (EXACT MATCH OF SCREENSHOT "Student Data" CARD) ── */}
      <div className="bg-white border border-[#c4cedb] rounded-xs shadow-2xs overflow-hidden">
        
        {/* Section Header with two orange/tan dots from screenshot */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d99b26] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#dfcaa0] inline-block"></span>
          </div>
          <h2 className="font-bold text-gray-800 text-[12.5px]">
            Teacher Data
          </h2>
        </div>

        {/* 2-Column Exact Data Grid matching screenshot layout */}
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-2 text-[11.5px] leading-relaxed">
            
            {/* ── Left Column ── */}
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Teacher Name</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="font-bold text-[#1e2a38]">{profile.teacherName}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Field</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="text-gray-700">{profile.field}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Teacher Program</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="text-gray-700">{profile.teacherProgram}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Employment Status</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="text-gray-800 font-semibold">{profile.enrollmentStatus}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Total Teaching CH</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="font-black text-gray-900">{profile.totalTeachingCH.toFixed(1)}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Registered Advising CH</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="font-semibold text-gray-800">{profile.registeredAdvisingCH}</span>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Staff ID</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-[#0c4ca3] font-bold underline hover:text-[#093d84] cursor-pointer"
                  title="Click to copy Staff ID"
                >
                  {profile.staffId}
                  {copiedId && <span className="text-[10px] text-emerald-600 ml-1.5 no-underline font-normal">Copied!</span>}
                </button>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Degree</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="text-gray-700">{profile.degree}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Level</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="text-gray-700">{profile.level}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Academic Status</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="text-gray-800 font-semibold">{profile.academicStatus}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 sm:w-40 font-bold text-gray-800 shrink-0">Faculty Evaluation</span>
                <span className="text-gray-500 font-bold mr-2">:</span>
                <span className="font-bold text-emerald-800">{profile.rating || 4.9} / 5.0</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── BOTTOM DESCRIPTION TABLE (EXACT REPLICA FROM SCREENSHOT) ── */}
        <div className="border-t border-[#c4cedb]">
          <div className="bg-[#cbd5e1] text-[#1e293b] font-bold text-[11px] grid grid-cols-1 sm:grid-cols-2 py-2 px-4 border-b border-gray-300">
            <div className="text-center sm:text-left">Description (EN)</div>
            <div className="text-center sm:text-right font-arabic">Description (AR)</div>
          </div>
          <div className="py-2.5 px-4 text-[11.5px] bg-white grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
            <div className="text-center sm:text-left font-medium">
              {profile.teacherProgram} - 2023
            </div>
            <div className="text-center sm:text-right font-arabic text-gray-800" dir="rtl">
              {profile.teacherProgramAr}
            </div>
          </div>
        </div>

      </div>

      {/* ── EXTENDED FACULTY DOSSIER CARDS (OFFICE, COURSES, ADVISING) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Office & Contact Card */}
        <div className="bg-white border border-[#c4cedb] rounded-xs shadow-2xs p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 text-gray-800 font-bold text-xs">
            <Building2 className="w-4 h-4 text-[#0c4ca3]" />
            <span>Office & Faculty Contacts</span>
          </div>

          <div className="space-y-2 text-[11.5px] text-gray-700">
            <div>
              <span className="block text-gray-500 text-[10.5px] font-semibold">Official Department:</span>
              <span className="font-bold text-gray-800">{profile.department}</span>
            </div>

            <div>
              <span className="block text-gray-500 text-[10.5px] font-semibold">Campus Office Location:</span>
              <div className="flex items-center gap-1 text-gray-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{profile.officeLocation}</span>
              </div>
            </div>

            <div>
              <span className="block text-gray-500 text-[10.5px] font-semibold">Office Hours:</span>
              <div className="flex items-center gap-1 text-gray-800 font-medium">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{profile.officeHours}</span>
              </div>
            </div>

            <div>
              <span className="block text-gray-500 text-[10.5px] font-semibold">University Email:</span>
              <div className="flex items-center gap-1 text-[#0c4ca3] font-mono">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{profile.email}</span>
              </div>
            </div>

            <div>
              <span className="block text-gray-500 text-[10.5px] font-semibold">Phone Ext:</span>
              <div className="flex items-center gap-1 text-gray-800">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{profile.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Courses Card */}
        <div className="bg-white border border-[#c4cedb] rounded-xs shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-xs">
              <BookOpen className="w-4 h-4 text-[#6aa123]" />
              <span>Teaching Portfolio (Fall 2026)</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
              3 Courses
            </span>
          </div>

          <div className="space-y-2">
            {(profile.assignedCourses || []).map((course, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[#f8fafc] border border-gray-200 rounded text-xs flex items-center justify-between hover:bg-blue-50/50 transition-colors"
              >
                <div>
                  <div className="font-bold text-gray-800">{course}</div>
                  <div className="text-[10px] text-gray-500">Lecture: 2 hrs • Practical: 2 hrs</div>
                </div>
                {onNavigateToCourse && (
                  <button
                    type="button"
                    onClick={() => onNavigateToCourse(course)}
                    className="text-[10px] font-bold text-[#0c4ca3] hover:underline flex items-center gap-0.5"
                  >
                    <span>Roster</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Academic Advising & Responsibilities Card */}
        <div className="bg-white border border-[#c4cedb] rounded-xs shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-xs">
              <Users className="w-4 h-4 text-[#d99b26]" />
              <span>Academic Advising Duties</span>
            </div>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {realAdvisees.length} Advisees
            </span>
          </div>

          <div className="space-y-2.5 text-[11.5px]">
            <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded text-amber-900 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Active Advisee Cohort</span>
                <span>{realAdvisees.length} / 35 Quota</span>
              </div>
              <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#d99b26] h-full" style={{ width: `${Math.min(100, Math.round((realAdvisees.length / 35) * 100))}%` }}></div>
              </div>
              <div className="text-[10.5px] text-amber-800">
                {Math.round((realAdvisees.length / 35) * 100)}% capacity utilized • {Math.max(0, 35 - realAdvisees.length)} open advising slots available
              </div>
            </div>

            <div className="space-y-1 text-gray-700 text-[11px]">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Advising Field:</span>
                <span className="font-bold text-gray-900">Engineering Technology</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Term / Session:</span>
                <span className="font-bold text-gray-900">2026/2027 - Fall</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Pending Drop / Add Petitions:</span>
                <span className={`font-bold ${realPetitions.length > 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                  {realPetitions.length} Requests
                </span>
              </div>
            </div>

            {onNavigateToAdvisees && (
              <button
                type="button"
                onClick={onNavigateToAdvisees}
                className="w-full bg-[#dfcaa0] hover:bg-[#cfba90] text-gray-900 font-bold py-1.5 px-3 rounded text-center text-xs cursor-pointer border border-[#bfae82] shadow-2xs transition-colors"
              >
                Open Academic Advising Console →
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
