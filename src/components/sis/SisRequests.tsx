import React, { useState, useEffect } from 'react';
import { StudentProfile, Course, FeeItem, StudentRequestRecord, UserAccount } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { academicPlanCourses, mockLoadedFees, initialRequests } from '../../data/mockData';
import { CheckCircle2, Send, CreditCard, AlertCircle, AlertTriangle, FileText, Plus, Trash2, ArrowRight, Clock, X } from 'lucide-react';
import { SisView } from './SisSidebar';
import { userStore } from '../../data/userStore';

interface Props {
  student: StudentProfile;
  activeRequestView: SisView;
  onNavigate: (view: SisView) => void;
  currentUser?: UserAccount | null;
  onDataUpdated?: () => void;
}

export const SisRequests: React.FC<Props> = ({ 
  student, 
  activeRequestView, 
  onNavigate,
  currentUser,
  onDataUpdated,
}) => {
  const [requestsList, setRequestsList] = useState<StudentRequestRecord[]>(() => {
    return currentUser?.requests && currentUser.requests.length > 0 
      ? currentUser.requests 
      : initialRequests;
  });
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [selectedCourse, setSelectedCourse] = useState<string>('HUM231');
  const [reasonText, setReasonText] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('Official English Transcript');
  const [targetProgram, setTargetProgram] = useState<string>('Network & Cyber Security Technology');
  const [targetTrack, setTargetTrack] = useState<string>('Cloud Infrastructure & DevOps');
  const [fees, setFees] = useState<FeeItem[]>(mockLoadedFees);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'fawry' | 'bank'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Register / Add / Drop state
  const baseCourses = currentUser?.courses || academicPlanCourses;
  const [registeredCourses, setRegisteredCourses] = useState<Course[]>(() =>
    baseCourses.filter(c => c.status === 'registered')
  );
  const [availableCourses, setAvailableCourses] = useState<Course[]>(() =>
    baseCourses.filter(c => c.status === 'available')
  );

  useEffect(() => {
    if (currentUser?.requests) {
      setRequestsList(currentUser.requests);
    }
  }, [currentUser]);

  const totalRegisteredCH = registeredCourses.reduce((sum, c) => sum + c.creditHours, 0);

  const handleCreateRequest = (type: string, details: string) => {
    const newReq: StudentRequestRecord = {
      id: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      requestType: type,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Under Review',
      details,
      comments: 'Forwarded to Academic Advising & Registrar Office.',
    };

    setRequestsList(prev => [newReq, ...prev]);
    if (student.studentId) {
      userStore.addStudentRequest(student.studentId, newReq);
      if (onDataUpdated) onDataUpdated();
    }
    setSubmissionSuccess(`Your request (${newReq.id}) has been registered and sent for review!`);
    setReasonText('');
    setTimeout(() => setSubmissionSuccess(null), 4000);
  };

  const handleDropCourse = (courseId: string) => {
    setErrorMessage(null);
    const course = registeredCourses.find(c => c.id === courseId);
    if (!course) return;
    if (totalRegisteredCH - course.creditHours < 9) {
      setErrorMessage('Cannot drop: Minimum allowed load for enrolled students is 9 Credit Hours.');
      return;
    }
    const nextRegistered = registeredCourses.filter(c => c.id !== courseId);
    const nextAvailable = [...availableCourses, { ...course, status: 'available' as const }];
    setRegisteredCourses(nextRegistered);
    setAvailableCourses(nextAvailable);

    // Persist to userStore
    if (student.studentId) {
      const allCurrentCourses = baseCourses.map(c => {
        if (c.id === courseId) return { ...c, status: 'available' as const };
        return c;
      });
      const newCH = totalRegisteredCH - course.creditHours;
      userStore.updateStudentCourses(student.studentId, allCurrentCourses, newCH);
      if (onDataUpdated) onDataUpdated();
    }

    handleCreateRequest('Drop Course Request', `Dropped course ${course.code} (${course.title})`);
  };

  const handleAddCourse = (courseId: string) => {
    setErrorMessage(null);
    const course = availableCourses.find(c => c.id === courseId);
    if (!course) return;
    if (totalRegisteredCH + course.creditHours > 12) {
      setErrorMessage('Academic Probation Restriction: Maximum allowed credit hours is 12 CH.');
      return;
    }
    const nextAvailable = availableCourses.filter(c => c.id !== courseId);
    const nextRegistered = [...registeredCourses, { ...course, status: 'registered' as const }];
    setAvailableCourses(nextAvailable);
    setRegisteredCourses(nextRegistered);

    // Persist to userStore
    if (student.studentId) {
      const allCurrentCourses = baseCourses.map(c => {
        if (c.id === courseId) return { ...c, status: 'registered' as const };
        return c;
      });
      const newCH = totalRegisteredCH + course.creditHours;
      userStore.updateStudentCourses(student.studentId, allCurrentCourses, newCH);
      if (onDataUpdated) onDataUpdated();
    }

    handleCreateRequest('Register/Add Course Request', `Added course ${course.code} (${course.title})`);
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentDone(true);
      setFees(prev => prev.map(f => ({ ...f, status: 'Paid' as const })));
      setTimeout(() => setPaymentDone(false), 5000);
    }, 1200);
  };

  const getTitle = () => {
    switch (activeRequestView) {
      case 'req-course-withdrawal': return 'Course Withdrawal Request';
      case 'req-student-services': return 'Student Services Request';
      case 'req-drop-course': return 'Drop Course Request';
      case 'req-incomplete-course': return 'Incomplete Course Request';
      case 'req-online-payment': return 'Online Payment Gateway';
      case 'req-change-program': return 'Change of Program Request';
      case 'req-track-declaration': return 'Track Declaration Request';
      case 'req-appeal': return 'Appeal Request (Grade Revision)';
      case 'req-retake': return 'Course Re-take Request (GPA Recovery)';
      case 'req-register-add-drop': return 'Course Registration / Add & Drop';
      case 'req-pre-registration': return 'Pre-Registration for Upcoming Semester';
      default: return 'Student Requests Portal';
    }
  };

  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center gap-3 border-b border-[#444950] shadow-xs">
        <div className="flex flex-col gap-1 w-5">
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
        </div>
        <h2 className="text-[15px] font-bold tracking-wide text-gray-100">{getTitle()}</h2>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        <SisStudentDataCard student={student} />

        {/* Success Alert */}
        {submissionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{submissionSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setSubmissionSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error / Restriction Alert */}
        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-sm text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-amber-700 hover:text-amber-900 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Request Dynamic Forms */}
        <div className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm p-5 text-xs shadow-xs">
          {/* 1. Course Withdrawal Request */}
          {activeRequestView === 'req-course-withdrawal' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Course Withdrawal Form</h3>
                <p className="text-gray-500 mt-0.5">
                  Withdrawing from a course gives a 'W' grade on your transcript with no impact on your CGPA.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Course to Withdraw:</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full max-w-md bg-white border border-gray-300 rounded p-2 text-xs"
                  >
                    {registeredCourses.map(c => (
                      <option key={c.id} value={c.code}>{c.code} - {c.title} ({c.creditHours} CH)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reason for Withdrawal:</label>
                  <textarea
                    rows={3}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Provide justification (e.g. academic load adjustment under probation, health condition)..."
                    className="w-full max-w-md border border-gray-300 rounded p-2 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRequest('Course Withdrawal Request', `Withdrawal from ${selectedCourse}: ${reasonText}`)}
                  className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-4 py-2 rounded-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Submit Withdrawal Request
                </button>
              </div>
            </div>
          )}

          {/* 2. Student Services Request */}
          {activeRequestView === 'req-student-services' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Official Student Services Request</h3>
                <p className="text-gray-500 mt-0.5">
                  Request official certificates, enrollment letters, military forms, or identity replacements.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Required Document / Service:</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full max-w-md bg-white border border-gray-300 rounded p-2 text-xs font-medium"
                  >
                    <option value="Official English Transcript">Official English Transcript (Bilingual)</option>
                    <option value="Enrollment Verification Certificate">Enrollment Verification Certificate (To Whom It May Concern)</option>
                    <option value="Health Insurance & Medical Card Endorsement">Health Insurance & Medical Card Endorsement</option>
                    <option value="Military Service Postponement Letter (Model 2 Gond)">Military Service Postponement Letter (Model 2 Gond)</option>
                    <option value="Replacement of SUT Student RFID Card">Replacement of SUT Student RFID Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Destination Organization / Notes:</label>
                  <input
                    type="text"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="E.g. Embassy visa application, Egyptian Syndicate, Elsewedy Electric Internship HR..."
                    className="w-full max-w-md border border-gray-300 rounded p-2 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRequest('Student Services Request', `${serviceType} - Note: ${reasonText || 'Standard'}`)}
                  className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-4 py-2 rounded-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Submit Service Request
                </button>
              </div>
            </div>
          )}

          {/* 3. Drop Course Request */}
          {activeRequestView === 'req-drop-course' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Drop Course Request</h3>
                <p className="text-gray-500 mt-0.5">
                  Dropping a course completely removes it from your current semester record without tuition penalty during the add/drop window.
                </p>
              </div>

              <div className="border border-gray-200 rounded overflow-hidden max-w-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-300">
                    <tr>
                      <th className="p-2.5">Course</th>
                      <th className="p-2.5 text-center">CH</th>
                      <th className="p-2.5">Instructor</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registeredCourses.map(course => (
                      <tr key={course.id}>
                        <td className="p-2.5 font-bold text-gray-800">{course.code} - {course.title}</td>
                        <td className="p-2.5 text-center">{course.creditHours}</td>
                        <td className="p-2.5 text-gray-600">{course.instructor || 'Staff'}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDropCourse(course.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer"
                          >
                            Drop Course
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Incomplete Course Request */}
          {activeRequestView === 'req-incomplete-course' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Incomplete Grade ('I') Request</h3>
                <p className="text-gray-500 mt-0.5">
                  Students facing documented force-majeure medical conditions preventing them from attending the final exam may petition for an Incomplete Grade.
                </p>
              </div>

              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Course:</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs"
                  >
                    {registeredCourses.map(c => (
                      <option key={c.id} value={c.code}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Emergency Justification & Hospitalization Details:</label>
                  <textarea
                    rows={3}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Describe emergency reason and upload supporting documents to student clinic..."
                    className="w-full border border-gray-300 rounded p-2 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRequest('Incomplete Course Request', `Incomplete request for ${selectedCourse}: ${reasonText}`)}
                  className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-4 py-2 rounded-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Submit Incomplete Petition
                </button>
              </div>
            </div>
          )}

          {/* 5. Online Payment */}
          {activeRequestView === 'req-online-payment' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Online Payment Portal</h3>
                <p className="text-gray-500 mt-0.5">
                  Securely settle university tuition fees, lab dues, and counseling charges using Egyptian bank cards, Fawry, or Meeza.
                </p>
              </div>

              {paymentDone && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <strong>Payment Confirmed!</strong> Transaction ID: <code>TXN-SUT-883921</code>. Your financial ledger has been updated and a confirmation receipt was sent to <code>ahmed.eljez@sut.edu.eg</code>.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="font-bold text-gray-700">Financial Dues Breakdown:</h4>
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-200">
                        <tr>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Due Date</th>
                          <th className="p-2.5 text-right">Amount</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {fees.map(f => (
                          <tr key={f.id}>
                            <td className="p-2.5 font-medium">{f.description}</td>
                            <td className="p-2.5 text-gray-500">{f.dueDate}</td>
                            <td className="p-2.5 text-right font-mono font-bold">{f.amount.toLocaleString()} EGP</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">Outstanding Balance to Clear:</span>
                    <span className="font-mono text-sm font-bold text-red-700">
                      {fees.filter(f => f.status === 'Due').reduce((s, c) => s + c.amount, 0).toLocaleString()} EGP
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border border-gray-200 rounded space-y-3">
                  <h4 className="font-bold text-gray-800 text-xs">Choose Payment Gateway:</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="pm"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-xs">Credit / Debit / Meeza Card</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="pm"
                        checked={paymentMethod === 'fawry'}
                        onChange={() => setPaymentMethod('fawry')}
                      />
                      <span className="font-bold text-amber-600 text-xs">FAWRY Pay</span>
                      <span className="text-[11px] text-gray-500 ml-auto">Code: 78829</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="pm"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                      />
                      <span className="font-semibold text-xs">CIB / NBE Bank Transfer</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={isProcessingPayment}
                    className="w-full bg-[#0b5cb7] hover:bg-[#094a94] text-white py-2 rounded-xs font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    {isProcessingPayment ? 'Connecting Secure Gateway...' : 'Pay Outstanding (450 EGP)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. Change of Program Request */}
          {activeRequestView === 'req-change-program' && (
            <div className="space-y-4 max-w-md">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Change of Program Request</h3>
                <p className="text-gray-500 mt-0.5">
                  Internal transfer between B.Tech degree programs within Elsewedy University of Technology.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Current Program:</label>
                  <input
                    type="text"
                    disabled
                    value={student.studentProgram}
                    className="w-full bg-gray-100 border border-gray-300 rounded p-2 text-xs font-semibold text-gray-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Desired Transfer Program:</label>
                  <select
                    value={targetProgram}
                    onChange={(e) => setTargetProgram(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-medium"
                  >
                    <option value="Network & Cyber Security Technology">Network & Cyber Security Technology</option>
                    <option value="Industrial Automation & Mechatronics">Industrial Automation & Mechatronics</option>
                    <option value="Electrical Engineering Technology">Electrical Engineering Technology</option>
                    <option value="Automotive & Electric Vehicle Technology">Automotive & Electric Vehicle Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Statement of Purpose:</label>
                  <textarea
                    rows={3}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Detail academic and career motivations for program transfer..."
                    className="w-full border border-gray-300 rounded p-2 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRequest('Change of Program Request', `Transfer to ${targetProgram} - Reason: ${reasonText}`)}
                  className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-4 py-2 rounded-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Submit Program Change Request
                </button>
              </div>
            </div>
          )}

          {/* 7. Track Declaration Request */}
          {activeRequestView === 'req-track-declaration' && (
            <div className="space-y-4 max-w-md">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Track Declaration Request</h3>
                <p className="text-gray-500 mt-0.5">
                  Declare your specialized concentration track for junior & senior years in Computer Science Technology.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Specialization Track:</label>
                  <select
                    value={targetTrack}
                    onChange={(e) => setTargetTrack(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-medium"
                  >
                    <option value="Artificial Intelligence & Industrial Robotics">Artificial Intelligence & Industrial Robotics</option>
                    <option value="Cloud Infrastructure & DevOps">Cloud Infrastructure & DevOps</option>
                    <option value="Enterprise Full-Stack Software Engineering">Enterprise Full-Stack Software Engineering</option>
                    <option value="Embedded Systems & IoT Technology">Embedded Systems & IoT Technology</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRequest('Track Declaration Request', `Declared Track: ${targetTrack}`)}
                  className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-4 py-2 rounded-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Confirm Track Declaration
                </button>
              </div>
            </div>
          )}

          {/* 8. Appeal Request */}
          {activeRequestView === 'req-appeal' && (
            <div className="space-y-4 max-w-md">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Grade Appeal & Recalculation Request</h3>
                <p className="text-gray-500 mt-0.5">
                  Petition the Examination Board for score re-summation or grading review in coursework or midterm exams.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Course:</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs"
                  >
                    {registeredCourses.map(c => (
                      <option key={c.id} value={c.code}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assessment Type to Appeal:</label>
                  <select className="w-full bg-white border border-gray-300 rounded p-2 text-xs">
                    <option>Midterm Exam Paper</option>
                    <option>Practical Lab Evaluation</option>
                    <option>Quiz 2 Calculation Discrepancy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Specific Dispute Details:</label>
                  <textarea
                    rows={3}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Specify question number or grading issue..."
                    className="w-full border border-gray-300 rounded p-2 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRequest('Appeal Request', `Grade appeal for ${selectedCourse}: ${reasonText}`)}
                  className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-4 py-2 rounded-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Submit Appeal Petition
                </button>
              </div>
            </div>
          )}

          {/* 9. Re-take Request */}
          {activeRequestView === 'req-retake' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Course Re-take Request (CGPA Recovery)</h3>
                <p className="text-gray-500 mt-0.5">
                  Under Elsewedy academic probation rules, repeating low-graded courses replaces old grades and significantly boosts CGPA above the 2.00 threshold.
                </p>
              </div>

              <div className="border border-gray-200 rounded max-w-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Eligible Course</th>
                      <th className="p-2.5 text-center">Previous Grade</th>
                      <th className="p-2.5 text-center">CH</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {academicPlanCourses.filter(c => c.status === 'passed' && (c.grade === 'C-' || c.grade === 'C')).map(c => (
                      <tr key={c.id}>
                        <td className="p-2.5 font-bold text-gray-800">{c.code} - {c.title}</td>
                        <td className="p-2.5 text-center font-bold text-amber-700">{c.grade}</td>
                        <td className="p-2.5 text-center">{c.creditHours}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleCreateRequest('Course Re-take Request', `Re-take request for ${c.code} to replace grade ${c.grade}`)}
                            className="bg-[#6fa324] hover:bg-[#5e8c1f] text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                          >
                            Apply to Retake
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. Register / Add / Drop */}
          {activeRequestView === 'req-register-add-drop' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#1f2937]">Course Registration • Add & Drop Window</h3>
                  <p className="text-gray-500 mt-0.5">
                    Current Registered: <strong className="text-amber-800">{totalRegisteredCH} CH</strong> / Max Allowed for Probation: <strong>12 CH</strong>
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs">
                  Academic Probation Limit Active (12 CH Max)
                </span>
              </div>

              {/* Registered list */}
              <div>
                <h4 className="font-bold text-gray-800 text-xs mb-2">Registered Courses this Semester ({registeredCourses.length}):</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5 text-center">CH</th>
                        <th className="p-2.5">Schedule</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registeredCourses.map(course => (
                        <tr key={course.id}>
                          <td className="p-2.5 font-bold font-mono text-[#0c4ca3]">{course.code}</td>
                          <td className="p-2.5 font-medium text-gray-800">{course.title}</td>
                          <td className="p-2.5 text-center font-bold">{course.creditHours}</td>
                          <td className="p-2.5 text-gray-600">{course.schedule || 'TBA'}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDropCourse(course.id)}
                              className="text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                            >
                              Drop
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Available to Add */}
              <div>
                <h4 className="font-bold text-gray-800 text-xs mb-2">Available Electives / Open Courses:</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5 text-center">CH</th>
                        <th className="p-2.5">Prerequisite</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {availableCourses.map(course => (
                        <tr key={course.id}>
                          <td className="p-2.5 font-bold font-mono text-[#0c4ca3]">{course.code}</td>
                          <td className="p-2.5 font-medium text-gray-800">{course.title}</td>
                          <td className="p-2.5 text-center font-bold">{course.creditHours}</td>
                          <td className="p-2.5 text-gray-600">{course.prerequisites.join(', ') || 'None'}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleAddCourse(course.id)}
                              disabled={totalRegisteredCH + course.creditHours > 12}
                              className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-2.5 py-1 rounded text-xs font-semibold cursor-pointer disabled:opacity-40"
                            >
                              Add to Schedule
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 11. Pre_Registration for upcoming Semester */}
          {activeRequestView === 'req-pre-registration' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#1f2937]">Pre-Registration for Upcoming Semester (Fall 2026)</h3>
                <p className="text-gray-500 mt-0.5">
                  Express interest in Level 2 courses to assist university departmental timetabling and laboratory seat allocation.
                </p>
              </div>

              <div className="space-y-2">
                {academicPlanCourses.filter(c => c.level === 2).map(course => (
                  <label key={course.id} className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-blue-50/30">
                    <input type="checkbox" defaultChecked={course.semester === 3} />
                    <span className="font-mono font-bold text-[#0c4ca3] text-xs">{course.code}</span>
                    <span className="font-medium text-gray-800 text-xs">{course.title} ({course.creditHours} CH)</span>
                    <span className="text-gray-500 text-[11px] ml-auto">Prereq: {course.prerequisites.join(', ') || 'None'}</span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCreateRequest('Pre-Registration Form', 'Submitted Fall 2026 preferred courses selection.')}
                className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-4 py-2 rounded-xs font-semibold cursor-pointer shadow-2xs"
              >
                Submit Pre-Registration Wishlist
              </button>
            </div>
          )}

          {/* Request Status History Tracker */}
          <div className="mt-8 pt-5 border-t border-gray-200">
            <h4 className="font-bold text-xs text-gray-800 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-500" />
              Recent Requests & Petitions History
            </h4>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf1f5] text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">Request Ref</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Details</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requestsList.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="p-2.5 font-mono font-bold text-[#0c4ca3]">{req.id}</td>
                      <td className="p-2.5 font-semibold text-gray-800">{req.requestType}</td>
                      <td className="p-2.5 text-gray-500">{req.submittedDate}</td>
                      <td className="p-2.5 text-gray-600">{req.details}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
