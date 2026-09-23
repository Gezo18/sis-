import React from 'react';
import { StudentProfile, UserAccount } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { activityMarks as defaultActivityMarks } from '../../data/mockData';
import { Award, FileText } from 'lucide-react';

interface Props {
  student: StudentProfile;
  currentUser?: UserAccount | null;
}

export const SisActivityMarks: React.FC<Props> = ({ student, currentUser }) => {
  const marksToDisplay = currentUser?.activityMarks && currentUser.activityMarks.length > 0
    ? currentUser.activityMarks
    : defaultActivityMarks;
  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center gap-3 border-b border-[#444950] shadow-xs">
        <div className="flex flex-col gap-1 w-5">
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
        </div>
        <h2 className="text-[15px] font-bold tracking-wide text-gray-100">Semester Activity Marks</h2>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        <SisStudentDataCard student={student} />

        <div className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm p-4 text-xs shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-sm text-[#1f2937]">Spring 2026 Coursework & Midterm Marks</h3>
              <p className="text-gray-500 text-[11.5px]">
                Activity evaluations account for 40% - 60% of the total course grade before Final Examinations.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-900 font-semibold text-[11px]">
              Term 2 • Evaluated by SUT Instructors
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-300">
                <tr>
                  <th className="p-2.5">Course Code</th>
                  <th className="p-2.5">Course Title</th>
                  <th className="p-2.5 text-center">CH</th>
                  <th className="p-2.5 text-center">Quizzes</th>
                  <th className="p-2.5 text-center">Assignments</th>
                  <th className="p-2.5 text-center">Midterm Exam</th>
                  <th className="p-2.5 text-center">Lab / Practical</th>
                  <th className="p-2.5 text-center">Total Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {marksToDisplay.map((mark) => (
                  <tr key={mark.courseCode} className="hover:bg-gray-50">
                    <td className="p-2.5 font-bold font-mono text-[#0c4ca3]">{mark.courseCode}</td>
                    <td className="p-2.5 font-medium text-gray-800">{mark.courseName}</td>
                    <td className="p-2.5 text-center text-gray-600">{mark.creditHours}</td>
                    <td className="p-2.5 text-center font-semibold">
                      {mark.quizzes} <span className="text-gray-400 font-normal">/ {mark.maxQuizzes}</span>
                    </td>
                    <td className="p-2.5 text-center font-semibold">
                      {mark.assignments} <span className="text-gray-400 font-normal">/ {mark.maxAssignments}</span>
                    </td>
                    <td className="p-2.5 text-center font-semibold">
                      <span className={mark.midterm < (mark.maxMidterm * 0.6) ? 'text-amber-700' : 'text-gray-800'}>
                        {mark.midterm}
                      </span>{' '}
                      <span className="text-gray-400 font-normal">/ {mark.maxMidterm}</span>
                    </td>
                    <td className="p-2.5 text-center font-semibold">
                      {mark.maxLabPractical > 0 ? (
                        <>
                          {mark.labPractical} <span className="text-gray-400 font-normal">/ {mark.maxLabPractical}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="font-bold text-[#0c4ca3] text-sm">{mark.totalActivity}</span>
                      <span className="text-gray-500 text-[11px]"> / {mark.maxTotal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xs flex justify-between items-center text-[11.5px] text-gray-600">
            <span>Note: If you notice any discrepancy in your activity marks, submit an Appeal Request via the <strong>My Requests</strong> tab within 7 days.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
