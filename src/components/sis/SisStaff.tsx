import React, { useState } from 'react';
import { StudentProfile } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { Mail, Clock, MapPin, Send, CheckCircle2 } from 'lucide-react';

interface Props {
  student: StudentProfile;
}

export const SisStaff: React.FC<Props> = ({ student }) => {
  const [messageSent, setMessageSent] = useState(false);
  const [targetStaff, setTargetStaff] = useState<string>('Dr. Tarek Abdel-Azim');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const staffMembers = [
    {
      name: 'Dr. Tarek Abdel-Azim',
      role: 'Appointed Academic Advisor & Assistant Professor',
      department: 'Computer Science & Software Engineering',
      email: 'tarek.azim@sut.edu.eg',
      office: 'Engineering Building C, Room 304',
      officeHours: 'Tuesdays & Thursdays (11:00 AM - 01:00 PM)',
      isAdvisor: true,
    },
    {
      name: 'Dr. Mona Radwan',
      role: 'Associate Professor (CS102 Structured Programming)',
      department: 'Computer Science Technology',
      email: 'mona.radwan@sut.edu.eg',
      office: 'Computing Center, Office 102',
      officeHours: 'Mondays & Wednesdays (12:00 PM - 02:00 PM)',
      isAdvisor: false,
    },
    {
      name: 'Dr. Sherif Kamel',
      role: 'Lecturer of Mathematics (MATH102)',
      department: 'Basic Sciences Department',
      email: 'sherif.kamel@sut.edu.eg',
      office: 'Science Building A, Room 210',
      officeHours: 'Sundays (10:00 AM - 12:00 PM)',
      isAdvisor: false,
    },
    {
      name: 'Eng. Hisham Fathy',
      role: 'Lecturer & Industrial Safety Specialist (HUM231)',
      department: 'Humanities & Industrial Technology',
      email: 'hisham.fathy@sut.edu.eg',
      office: 'Engineering Building B, Room 114',
      officeHours: 'Wednesdays (09:00 AM - 11:00 AM)',
      isAdvisor: false,
    },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setSubject('');
      setBody('');
    }, 3000);
  };

  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center gap-3 border-b border-[#444950] shadow-xs">
        <div className="flex flex-col gap-1 w-5">
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
        </div>
        <h2 className="text-[15px] font-bold tracking-wide text-gray-100">My Staff & Academic Advising</h2>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        <SisStudentDataCard student={student} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-sm text-[#1f2937]">Assigned Academic Staff & Instructors</h3>
            <div className="space-y-3">
              {staffMembers.map((staff) => (
                <div
                  key={staff.email}
                  className={`p-4 border rounded-sm transition-all ${
                    staff.isAdvisor
                      ? 'border-[#6fa324] bg-emerald-50/15 ring-1 ring-[#6fa324]/30'
                      : 'border-[#d2d7de] bg-white'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{staff.name}</h4>
                        {staff.isAdvisor && (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#6fa324] text-white">
                            Your Academic Advisor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#0c4ca3] font-medium">{staff.role}</p>
                      <p className="text-[11px] text-gray-500">{staff.department}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTargetStaff(staff.name)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded cursor-pointer font-medium"
                    >
                      Message
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <a href={`mailto:${staff.email}`} className="text-[#0c4ca3] hover:underline">
                        {staff.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{staff.office}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span><strong>Office Hours:</strong> {staff.officeHours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm p-4 text-xs shadow-xs h-fit space-y-3">
            <h4 className="font-bold text-sm text-[#1f2937]">Send Academic Inquiries</h4>
            <p className="text-gray-500 text-[11px]">
              Direct communication with your SUT advisor regarding course selection, probation clearance, and excuses.
            </p>

            {messageSent ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600" />
                <p className="font-bold">Message Delivered</p>
                <p className="text-[10.5px]">Your advisor will respond to your university email.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">To:</label>
                  <select
                    value={targetStaff}
                    onChange={(e) => setTargetStaff(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs font-medium"
                  >
                    {staffMembers.map(s => (
                      <option key={s.email} value={s.name}>{s.name} ({s.isAdvisor ? 'Advisor' : 'Instructor'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subject:</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E.g. Academic Probation consultation request"
                    className="w-full border border-gray-300 rounded p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Message:</label>
                  <textarea
                    required
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your inquiry clearly..."
                    className="w-full border border-gray-300 rounded p-1.5 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0b5cb7] hover:bg-[#094a94] text-white py-1.5 rounded-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send to Instructor
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
