import React, { useState } from 'react';
import { StudentProfile } from '../../types';
import { Award, AlertTriangle, UserCheck, CreditCard } from 'lucide-react';

interface Props {
  student: StudentProfile;
  onOpenFees?: () => void;
}

export const SisStudentDataCard: React.FC<Props> = ({ student, onOpenFees }) => {
  const [showIdModal, setShowIdModal] = useState(false);

  return (
    <>
      <div id="sis-student-data-container" className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm p-4 text-[13px] text-[#2c3239] shadow-xs">
        {/* Header with double orange dots matching screenshot */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e5e9f0]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e88d22] inline-block shadow-xs"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f4a742] inline-block shadow-xs"></span>
            </span>
            <h3 className="font-bold text-[#1f2937] text-[13.5px]">Student Data</h3>
          </div>

          <div className="flex items-center gap-2">
            {student.academicWarnings > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Academic Warning ({student.academicWarnings})
              </span>
            )}
            {onOpenFees && (
              <button
                type="button"
                onClick={onOpenFees}
                className="text-[11px] text-[#0055b8] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <CreditCard className="w-3 h-3" />
                Financial Balance
              </button>
            )}
          </div>
        </div>

        {/* 2-column key-value grid matching exact screenshot layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-2.5 gap-x-6">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-2">
            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-4 font-semibold text-[#1e242c]">Student Name</span>
              <span className="col-span-8 text-[#111827] flex items-center gap-1 font-medium">
                : <span className="font-bold text-[#111827]">{student.studentName || '—'}</span>
              </span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-4 font-semibold text-[#1e242c]">Field</span>
              <span className="col-span-8 text-[#111827]">: {student.field || '—'}</span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-4 font-semibold text-[#1e242c]">Student Program</span>
              <span className="col-span-8 text-[#111827]">: {student.studentProgram || '—'}</span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-4 font-semibold text-[#1e242c]">Enrollment Status</span>
              <span className="col-span-8 text-[#111827] flex items-center gap-1">
                : <span>{student.enrollmentStatus || 'Enrolled'}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
              </span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-4 font-semibold text-[#1e242c]">Total Passed CH</span>
              <span className="col-span-8 font-bold text-[#111827]">
                : {typeof student.totalPassedCH === 'number' ? student.totalPassedCH.toFixed(1) : '0.0'}
              </span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-4 font-semibold text-[#1e242c]">Registered CH</span>
              <span className="col-span-8 text-[#111827]">: {student.registeredCH ?? 0}</span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-4 font-semibold text-[#1e242c]">Account Advisor</span>
              <span className="col-span-8 text-[#111827]">: {student.advisorName && student.advisorName.trim() ? student.advisorName : 'Pending Staff Assignment'}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-2">
            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-5 font-semibold text-[#1e242c]">Student ID</span>
              <span className="col-span-7">
                : <button
                    type="button"
                    onClick={() => setShowIdModal(true)}
                    className="text-[#0c4ca3] hover:underline font-bold tracking-wide cursor-pointer inline-flex items-center gap-1"
                    title="Click to view digital student identity card"
                  >
                    {student.studentId || '—'}
                  </button>
              </span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-5 font-semibold text-[#1e242c]">Degree</span>
              <span className="col-span-7 text-[#111827]">: {student.degree || 'B.Tech'}</span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-5 font-semibold text-[#1e242c]">Level</span>
              <span className="col-span-7 text-[#111827]">: {student.level || 'Level 1'}</span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-5 font-semibold text-[#1e242c]">Academic Status</span>
              <span className={`col-span-7 font-bold ${
                student.academicStatus?.toLowerCase().includes('probation') 
                  ? 'text-red-700' 
                  : student.academicStatus?.toLowerCase().includes('pending')
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}>
                : {student.academicStatus || 'Pending Staff Evaluation'}
              </span>
            </div>

            <div className="grid grid-cols-12 items-baseline">
              <span className="col-span-5 font-semibold text-[#1e242c]">CGPA</span>
              <span className={`col-span-7 font-bold ${
                student.cgpa > 0 && student.cgpa < 2.0 ? 'text-red-700' : 'text-gray-900'
              }`}>
                : {typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Staff Administration Note */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="italic">
            * Academic Status, CGPA, Passed CH, and Advisor are managed exclusively by authorized academic staff.
          </span>
        </div>
      </div>

      {/* Digital Student ID Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-linear-to-r from-[#842646] via-[#2b3b75] to-[#0db3c8] p-4 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm tracking-wide">ELSEWEDY UNIVERSITY OF TECHNOLOGY</h4>
                <p className="text-[11px] text-cyan-200">Official Digital Student Identification</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIdModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-4 items-start">
                <div className="w-24 h-28 bg-gray-100 border-2 border-[#2b3b75] rounded flex flex-col items-center justify-center text-gray-400">
                  <UserCheck className="w-10 h-10 text-[#2b3b75]" />
                  <span className="text-[9px] font-semibold text-gray-500 mt-1">VERIFIED SUT</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-[#1f2937] text-sm">{student.studentName}</p>
                  <p><span className="text-gray-500 font-medium">ID:</span> <span className="font-mono font-bold text-[#2b3b75]">{student.studentId}</span></p>
                  <p><span className="text-gray-500 font-medium">Program:</span> {student.studentProgram}</p>
                  <p><span className="text-gray-500 font-medium">Degree:</span> {student.degree}</p>
                  <p><span className="text-gray-500 font-medium">Level:</span> {student.level}</p>
                  <p><span className="text-gray-500 font-medium">Academic Advisor:</span> {student.advisorName}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
                <span>Valid: Academic Year 2025/2026</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Active Student</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
