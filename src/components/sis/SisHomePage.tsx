import React, { useState } from 'react';
import { StudentProfile, FeeItem } from '../../types';
import { SisStudentDataCard } from './SisStudentDataCard';
import { mockLoadedFees } from '../../data/mockData';
import { userStore } from '../../data/userStore';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, CreditCard, FileText, Info, X } from 'lucide-react';
import { SisView } from './SisSidebar';

interface Props {
  student: StudentProfile;
  onNavigate: (view: SisView) => void;
}

export const SisHomePage: React.FC<Props> = ({ student, onNavigate }) => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [feesList, setFeesList] = useState<FeeItem[]>(mockLoadedFees);
  const [paymentProcessing, setPaymentProcessing] = useState<string | null>(null);
  const [notificationsCleared, setNotificationsCleared] = useState(false);

  const currentUser = userStore.getCurrentUser();
  const staffAdvisorNotes = notificationsCleared ? [] : (currentUser?.advisorNotes || []);
  const hasWarnings = !notificationsCleared && (student.academicWarnings > 0);
  const hasAssignedAdvisor = !notificationsCleared && student.advisorName && student.advisorName.trim() !== '' && student.advisorName !== 'Pending Staff Assignment';
  const hasRegisteredHours = !notificationsCleared && (student.registeredCH > 0);

  const handlePayFee = (feeId: string) => {
    setPaymentProcessing(feeId);
    setTimeout(() => {
      setFeesList(prev =>
        prev.map(f => (f.id === feeId ? { ...f, status: 'Paid' as const } : f))
      );
      setPaymentProcessing(null);
    }, 800);
  };

  return (
    <div className="flex-1 bg-white min-h-[calc(100vh-60px)] flex flex-col font-sans">
      {/* Top Banner Header matching screenshot: Dark charcoal bar with orange hamburger icon */}
      <div className="bg-[#5a626a] text-white px-4 py-2.5 flex items-center gap-3 border-b border-[#444950] shadow-xs">
        <div className="flex flex-col gap-1 w-5">
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
          <span className="h-0.5 w-full bg-[#f39c12] rounded-xs"></span>
        </div>
        <h2 className="text-[15px] font-bold tracking-wide text-gray-100">Home Page</h2>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4 max-w-6xl">
        {/* 1. Student Data Card matching screenshot */}
        <SisStudentDataCard student={student} onOpenFees={() => setShowFeesModal(true)} />

        {/* 2. Notification Box */}
        <div id="sis-notification-box" className="bg-[#fcfdfd] border border-[#d2d7de] rounded-sm p-4 text-[13px] text-[#2c3239] shadow-xs">
          {/* Header with double orange dots and clear option */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#e5e9f0]">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e88d22] inline-block shadow-xs"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#f4a742] inline-block shadow-xs"></span>
              </span>
              <h3 className="font-bold text-[#1f2937] text-[13.5px]">Notification</h3>
            </div>
            {!notificationsCleared && (
              <button
                type="button"
                onClick={() => setNotificationsCleared(true)}
                className="text-[11px] text-gray-500 hover:text-red-700 underline cursor-pointer"
                title="Dismiss and clear active notifications"
              >
                Clear notifications
              </button>
            )}
          </div>

          <div className="space-y-3 pl-1">
            {/* Blue Button matching screenshot: "View Summery" */}
            <div>
              <button
                type="button"
                id="btn-view-summary"
                onClick={() => setShowSummaryModal(true)}
                className="bg-[#0b5cb7] hover:bg-[#094a94] text-white text-xs font-semibold px-4 py-1.5 rounded-xs transition-colors shadow-2xs cursor-pointer border border-[#084285]"
              >
                View Summery
              </button>
            </div>

            {/* Official staff notifications or empty state */}
            {staffAdvisorNotes.length === 0 && !hasWarnings ? (
              <div className="py-2.5 px-3 bg-gray-50 border border-dashed border-gray-200 rounded text-xs text-gray-500">
                <span>No active notifications. Academic standings, CGPA evaluations, and advisor notifications are entered and published exclusively by university staff.</span>
              </div>
            ) : (
              <ul className="space-y-1.5 text-xs text-[#20252b]">
                {hasWarnings && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#333] font-bold text-sm leading-none">•</span>
                    <span className="text-red-700 font-semibold flex items-center gap-1">
                      Academic Warning ({student.academicWarnings}) - Issued by Academic Advising Department
                    </span>
                  </li>
                )}

                {hasAssignedAdvisor && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#333] font-bold text-sm leading-none">•</span>
                    <span className="text-gray-800">
                      Assigned Academic Advisor: <strong>{student.advisorName}</strong> {student.advisorEmail ? `(${student.advisorEmail})` : ''}
                    </span>
                  </li>
                )}

                {hasRegisteredHours && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#333] font-bold text-sm leading-none">•</span>
                    <span>
                      Currently registered for <strong>{student.registeredCH} credit hours</strong> in the active academic term.
                    </span>
                  </li>
                )}

                {staffAdvisorNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-amber-50/70 p-2 rounded border border-amber-200 text-amber-950 font-medium">
                    <span className="text-amber-700 font-bold text-sm leading-none">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Link matching screenshot: "Show Loaded Fees Item" */}
            <div className="pt-2">
              <button
                type="button"
                id="link-show-loaded-fees"
                onClick={() => setShowFeesModal(true)}
                className="text-[#0c4ca3] hover:underline text-xs font-medium cursor-pointer flex items-center gap-1"
              >
                Show Loaded Fees Item
              </button>
            </div>
          </div>
        </div>

        {/* Quick Functional Action Shortcuts for SUT Student */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div 
            onClick={() => onNavigate('academic-plan')}
            className="p-3 bg-white border border-[#d2d7de] hover:border-[#6fa324] hover:shadow-xs transition-all rounded-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1e293b] group-hover:text-[#6fa324]">My Academic Plan</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11.5px] text-gray-500 mt-1">
              Check degree curriculum, passed hours ({typeof student.totalPassedCH === 'number' ? student.totalPassedCH.toFixed(1) : '0.0'} CH), and semester requirements.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('activity-marks')}
            className="p-3 bg-white border border-[#d2d7de] hover:border-[#6fa324] hover:shadow-xs transition-all rounded-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1e293b] group-hover:text-[#6fa324]">Semester Activity Marks</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11.5px] text-gray-500 mt-1">Review your coursework, quizzes, and midterm marks for Spring 2026.</p>
          </div>

          <div 
            onClick={() => onNavigate('req-online-payment')}
            className="p-3 bg-white border border-[#d2d7de] hover:border-[#6fa324] hover:shadow-xs transition-all rounded-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1e293b] group-hover:text-[#6fa324]">Online Payment Portal</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11.5px] text-gray-500 mt-1">Pay pending semester dues or generate Fawry / bank payment codes.</p>
          </div>
        </div>
      </div>

      {/* MODAL 1: Academic Warning & Standing Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-xl w-full border border-gray-300 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#2b3b75] text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Academic Standing & Warning Summary</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-gray-700">
              <div className={`p-3 rounded-sm border ${
                student.academicWarnings > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    student.academicWarnings > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                  <div>
                    <h4 className={`font-bold text-sm ${
                      student.academicWarnings > 0 ? 'text-amber-900' : 'text-emerald-900'
                    }`}>
                      {student.academicWarnings > 0 
                        ? `Academic Warning (${student.academicWarnings}) Active`
                        : 'Good Academic Standing'}
                    </h4>
                    <p className={`mt-0.5 ${
                      student.academicWarnings > 0 ? 'text-amber-800' : 'text-emerald-800'
                    }`}>
                      Your cumulative GPA is currently <strong>{typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : '0.00'}</strong>. Under Elsewedy University of Technology regulations, a minimum CGPA of <strong>2.00</strong> is required to maintain good standing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-gray-100 py-3">
                <h5 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Academic Regulations & Advising:</h5>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li><strong>Active Registration:</strong> Currently registered for {student.registeredCH ?? 0} Credit Hours.</li>
                  <li><strong>Total Passed Hours:</strong> Completed {typeof student.totalPassedCH === 'number' ? student.totalPassedCH.toFixed(1) : '0.0'} Credit Hours towards degree requirements.</li>
                  <li><strong>Academic Advisor:</strong> {student.advisorName ? `Appointed advisor: ${student.advisorName}` : 'Advisor will be appointed by your department.'}</li>
                </ul>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900 font-medium">Use the Academic Plan GPA recovery calculator to project target grades.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSummaryModal(false);
                    onNavigate('academic-plan');
                  }}
                  className="bg-[#0b5cb7] hover:bg-[#094a94] text-white text-[11px] font-bold px-3 py-1.5 rounded-xs transition-colors cursor-pointer"
                >
                  Open Plan
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xs border border-gray-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Show Loaded Fees Item Modal */}
      {showFeesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-2xl w-full border border-gray-300 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#4e555e] text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Loaded Fees Items • Financial Statement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFeesModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center text-xs bg-gray-50 p-2.5 border border-gray-200 rounded-sm">
                <div>
                  <span className="text-gray-500">Student:</span> <strong className="text-gray-800">{student.studentName}</strong>
                </div>
                <div>
                  <span className="text-gray-500">ID:</span> <strong className="font-mono text-[#0c4ca3]">{student.studentId}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Balance Status:</span> <span className="font-bold text-amber-700">450 EGP Due</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#e9edf2] text-gray-700 border-b border-gray-200 font-bold">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Semester</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {feesList.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50/70">
                        <td className="p-2.5 font-medium text-gray-800">{fee.description}</td>
                        <td className="p-2.5 text-gray-500">{fee.semester}</td>
                        <td className="p-2.5 text-gray-500">{fee.dueDate}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-800">
                          {fee.amount.toLocaleString()} EGP
                        </td>
                        <td className="p-2.5 text-center">
                          {fee.status === 'Paid' ? (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                              Paid
                            </span>
                          ) : fee.status === 'Due' ? (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-100 text-red-800 animate-pulse">
                              Due
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-gray-100 text-gray-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {fee.status === 'Due' ? (
                            <button
                              type="button"
                              onClick={() => handlePayFee(fee.id)}
                              disabled={paymentProcessing === fee.id}
                              className="bg-[#0b5cb7] hover:bg-[#094a94] text-white px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {paymentProcessing === fee.id ? 'Processing...' : 'Pay Now'}
                            </button>
                          ) : fee.status === 'Paid' ? (
                            <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Receipt
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeesModal(false);
                    onNavigate('req-online-payment');
                  }}
                  className="text-[#0c4ca3] hover:underline font-semibold flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Open Full Online Payment Gateway
                </button>

                <button
                  type="button"
                  onClick={() => setShowFeesModal(false)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
