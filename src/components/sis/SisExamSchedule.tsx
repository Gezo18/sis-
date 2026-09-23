import React from 'react';
import { StudentProfile } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { examScheduleData } from '../../data/mockData';
import { Calendar, Clock, MapPin, ShieldCheck, Printer } from 'lucide-react';

interface Props {
  student: StudentProfile;
}

export const SisExamSchedule: React.FC<Props> = ({ student }) => {
  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center gap-3 border-b border-[#444950] shadow-xs">
        <div className="flex flex-col gap-1 w-5">
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
        </div>
        <h2 className="text-[15px] font-bold tracking-wide text-gray-100">Exam Schedule</h2>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        <SisStudentDataCard student={student} />

        <div className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm p-4 text-xs shadow-xs">
          <div className="flex flex-wrap justify-between items-center pb-3 border-b border-gray-200 gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#1f2937]">Spring 2026 Final Theoretical & Practical Examination Timetable</h3>
              <p className="text-gray-500 text-[11.5px]">
                Please bring your Elsewedy Student ID card (<strong>{student.studentId}</strong>) to all examination halls.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Exam Card
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-300">
                <tr>
                  <th className="p-2.5">Course Code</th>
                  <th className="p-2.5">Course Name</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Examination Location</th>
                  <th className="p-2.5 text-center">Assigned Seat</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {examScheduleData.map((item) => (
                  <tr key={item.courseCode} className="hover:bg-gray-50">
                    <td className="p-2.5 font-bold font-mono text-[#0c4ca3]">{item.courseCode}</td>
                    <td className="p-2.5 font-medium text-gray-800">{item.courseName}</td>
                    <td className="p-2.5 font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {item.examDate}
                      </div>
                    </td>
                    <td className="p-2.5 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {item.examTime}
                      </div>
                    </td>
                    <td className="p-2.5 text-gray-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        {item.hall}
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-gray-800 bg-gray-50">
                      {item.seatNumber}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-100 text-amber-800">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-red-50/70 border border-red-200 rounded-xs text-[11.5px] text-red-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <strong>Polytechnic Examination Regulations:</strong> No mobile phones or smartwatches are permitted in exam halls. Late entry past 15 minutes is strictly prohibited by university council bylaws.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
