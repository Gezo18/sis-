import React, { useState, useEffect } from 'react';
import { StudentProfile, AttendanceRecord, UserAccount } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { attendanceRecords } from '../../data/mockData';
import { AlertTriangle, CheckCircle, FileUp, Calendar, Clock, AlertCircle } from 'lucide-react';
import { userStore } from '../../data/userStore';

interface Props {
  student: StudentProfile;
  currentUser?: UserAccount | null;
  onDataUpdated?: () => void;
}

export const SisAttendance: React.FC<Props> = ({ student, currentUser, onDataUpdated }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    return currentUser?.attendance && currentUser.attendance.length > 0
      ? currentUser.attendance
      : attendanceRecords;
  });

  useEffect(() => {
    if (currentUser?.attendance && currentUser.attendance.length > 0) {
      setRecords(currentUser.attendance);
    }
  }, [currentUser]);

  const [selectedCourse, setSelectedCourse] = useState<string>('HUM231');
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [excuseText, setExcuseText] = useState('');
  const [excuseSubmitted, setExcuseSubmitted] = useState(false);

  const activeRecord = records.find(r => r.courseCode === selectedCourse) || records[0];

  const handleExcuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (student.studentId && excuseText.trim()) {
      userStore.submitAbsenceExcuse(student.studentId, selectedCourse, excuseText.trim());
      if (onDataUpdated) onDataUpdated();
    }
    setExcuseSubmitted(true);
    setTimeout(() => {
      setShowExcuseModal(false);
      setExcuseSubmitted(false);
      setExcuseText('');
    }, 1500);
  };

  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center gap-3 border-b border-[#444950] shadow-xs">
        <div className="flex flex-col gap-1 w-5">
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
        </div>
        <h2 className="text-[15px] font-bold tracking-wide text-gray-100">Student Attendance</h2>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        <SisStudentDataCard student={student} />

        {/* Specific Absence Notice highlighted from Home Page screenshot */}
        <div className="bg-amber-50 border border-amber-300 rounded-sm p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-900">Registered Absence Notice</h4>
              <p className="text-amber-800">
                You have a logged absence: <strong>(HUM231- (2) -Apr 22 2026 11:12AM) Course Absence</strong>.
                If this absence was due to illness or official contest, submit an authorized excuse within 3 days.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCourse('HUM231');
              setShowExcuseModal(true);
            }}
            className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-3.5 py-1.5 rounded-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Submit Medical / Official Excuse
          </button>
        </div>

        {/* Course Attendance List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {records.map((rec) => (
            <div
              key={rec.courseCode}
              onClick={() => setSelectedCourse(rec.courseCode)}
              className={`p-3.5 border rounded-sm cursor-pointer transition-all ${
                selectedCourse === rec.courseCode
                  ? 'border-[#6fa324] bg-emerald-50/20 ring-1 ring-[#6fa324]'
                  : 'border-[#d2d7de] bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono font-bold text-xs text-[#0c4ca3]">{rec.courseCode}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  rec.warningStatus === 'Normal'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800 font-bold'
                }`}>
                  {rec.warningStatus}
                </span>
              </div>
              <h5 className="font-semibold text-xs text-gray-800 mt-1 line-clamp-1">{rec.courseName}</h5>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Attendance:</span>
                  <strong className={rec.percentage < 80 ? 'text-amber-700' : 'text-emerald-700'}>
                    {rec.percentage}%
                  </strong>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Attended: {rec.attendedSessions}/{rec.totalSessions}</span>
                  <span>Absent: {rec.absentSessions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Session Absence Log */}
        {activeRecord && (
          <div className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm p-4 text-xs shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <div>
                <h4 className="font-bold text-sm text-gray-800">
                  Absence Log & Session History for {activeRecord.courseCode} - {activeRecord.courseName}
                </h4>
                <p className="text-gray-500 text-[11px]">
                  Maximum permissible absence: 25% (Denial Threshold: 4 unexcused sessions)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExcuseModal(true)}
                className="bg-[#6fa324] hover:bg-[#5e8c1f] text-white px-3 py-1.5 rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileUp className="w-3.5 h-3.5" />
                Submit Excuse for this Course
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Session Type</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Excuse Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeRecord.absenceLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2.5 font-medium text-gray-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {log.date}
                      </td>
                      <td className="p-2.5 text-gray-600">{log.sessionType}</td>
                      <td className="p-2.5 text-center">
                        {log.excused ? (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-100 text-blue-800">
                            Excused
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-100 text-red-800">
                            Unexcused Absence
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {!log.excused ? (
                          <button
                            type="button"
                            onClick={() => setShowExcuseModal(true)}
                            className="text-[#0c4ca3] hover:underline font-semibold cursor-pointer text-[11px]"
                          >
                            Appeal Absence
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Excuse Modal */}
      {showExcuseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full border border-gray-300 shadow-xl p-5 text-xs">
            <h3 className="font-bold text-sm text-gray-800 mb-2">Submit Absence Excuse</h3>
            <p className="text-gray-600 mb-4">
              Submitting excuse for <strong>{activeRecord.courseCode}</strong>. Attach hospital diagnosis, clinic slip, or university official excuse.
            </p>

            {excuseSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded text-center space-y-1">
                <CheckCircle className="w-6 h-6 mx-auto text-emerald-600" />
                <p className="font-bold">Excuse Submitted Successfully</p>
                <p className="text-[11px]">Tracking Reference: EXC-2026-928. Forwarded to Student Affairs.</p>
              </div>
            ) : (
              <form onSubmit={handleExcuseSubmit} className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reason for Absence:</label>
                  <textarea
                    required
                    rows={3}
                    value={excuseText}
                    onChange={(e) => setExcuseText(e.target.value)}
                    placeholder="Describe reason (e.g. SUT Medical Clinic Visit on Apr 22, emergency medical condition, official university team event)..."
                    className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="border border-dashed border-gray-300 rounded p-3 text-center bg-gray-50">
                  <FileUp className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <span className="text-gray-600 font-medium text-[11px]">Upload Medical Certificate (PDF/JPG)</span>
                  <input type="file" className="block text-[11px] text-gray-500 mx-auto mt-1" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExcuseModal(false)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0b5cb7] hover:bg-[#094a94] text-white rounded font-semibold cursor-pointer"
                  >
                    Submit Excuse
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
