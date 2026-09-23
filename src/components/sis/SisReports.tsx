import React, { useState } from 'react';
import { StudentProfile, UserAccount } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { academicPlanCourses } from '../../data/mockData';
import { Printer, Download, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  student: StudentProfile;
  currentUser?: UserAccount | null;
}

export const SisReports: React.FC<Props> = ({ student, currentUser }) => {
  const [selectedReport, setSelectedReport] = useState<'transcript' | 'schedule' | 'financial'>('transcript');
  const studentCourses = currentUser?.courses || academicPlanCourses;

  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center gap-3 border-b border-[#444950] shadow-xs">
        <div className="flex flex-col gap-1 w-5">
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
        </div>
        <h2 className="text-[15px] font-bold tracking-wide text-gray-100">Academic Reports & Official Statements</h2>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        <SisStudentDataCard student={student} />

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedReport('transcript')}
            className={`px-3 py-1.5 rounded-xs font-semibold cursor-pointer transition-colors ${
              selectedReport === 'transcript' ? 'bg-[#6fa324] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unofficial Transcript Statement
          </button>
          <button
            type="button"
            onClick={() => setSelectedReport('schedule')}
            className={`px-3 py-1.5 rounded-xs font-semibold cursor-pointer transition-colors ${
              selectedReport === 'schedule' ? 'bg-[#6fa324] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Current Semester Registration Slip
          </button>
        </div>

        {/* Printable Paper Canvas View */}
        <div className="bg-white border border-[#d2d7de] rounded-sm p-6 text-xs shadow-xs space-y-4">
          <div className="flex justify-between items-start pb-4 border-b border-gray-300">
            <div>
              <h3 className="font-black text-sm tracking-wide text-[#202738]">ELSEWEDY UNIVERSITY OF TECHNOLOGY</h3>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">POLYTECHNIC OF EGYPT • DEANSHIP OF ADMISSIONS & REGISTRATION</p>
              <p className="text-[11px] text-gray-400">Tenth of Ramadan Industrial Zone, Egypt</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          </div>

          {selectedReport === 'transcript' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11.5px]">
                <div><span className="text-gray-500">Student:</span> <strong>{student.studentName}</strong></div>
                <div><span className="text-gray-500">ID:</span> <strong className="font-mono">{student.studentId}</strong></div>
                <div><span className="text-gray-500">CGPA:</span> <strong className="text-red-700">{student.cgpa.toFixed(2)}</strong></div>
                <div><span className="text-gray-500">Passed CH:</span> <strong>{student.totalPassedCH.toFixed(1)}</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 text-xs mb-2">Level 1 - Fall Semester 2025/2026:</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-300">
                      <tr>
                        <th className="p-2">Code</th>
                        <th className="p-2">Course Title</th>
                        <th className="p-2 text-center">CH</th>
                        <th className="p-2 text-center">Grade</th>
                        <th className="p-2 text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentCourses.filter(c => c.status === 'passed').map(c => (
                        <tr key={c.id}>
                          <td className="p-2 font-mono font-bold text-[#0c4ca3]">{c.code}</td>
                          <td className="p-2">{c.title}</td>
                          <td className="p-2 text-center">{c.creditHours}</td>
                          <td className="p-2 text-center font-bold text-emerald-800">{c.grade}</td>
                          <td className="p-2 text-center">
                            {c.grade === 'B' ? '3.0' : c.grade === 'B-' ? '2.7' : c.grade === 'C+' ? '2.3' : c.grade === 'C' ? '2.0' : '1.7'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
                <span>Status: Academic Warning (2) • Under Academic Probation</span>
                <span>Unofficial Web Generated Transcript • {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {selectedReport === 'schedule' && (
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 text-xs">Official Spring 2026 Registration Enrollment Slip (11 CH):</h4>
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-300">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Title</th>
                      <th className="p-2 text-center">CH</th>
                      <th className="p-2">Classroom / Lab</th>
                      <th className="p-2">Weekly Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentCourses.filter(c => c.status === 'registered').map(c => (
                      <tr key={c.id}>
                        <td className="p-2 font-mono font-bold text-[#0c4ca3]">{c.code}</td>
                        <td className="p-2 font-medium">{c.title}</td>
                        <td className="p-2 text-center font-bold">{c.creditHours}</td>
                        <td className="p-2 text-gray-600">{c.hall || 'Room TBA'}</td>
                        <td className="p-2 text-gray-600">{c.schedule || 'Scheduled'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
