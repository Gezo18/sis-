import React, { useState } from 'react';
import { Search } from 'lucide-react';

export type SisView =
  | 'home'
  | 'academic-plan'
  | 'attendance'
  | 'activity-marks'
  | 'exam-schedule'
  // Requests
  | 'req-course-withdrawal'
  | 'req-student-services'
  | 'req-drop-course'
  | 'req-incomplete-course'
  | 'req-online-payment'
  | 'req-change-program'
  | 'req-track-declaration'
  | 'req-appeal'
  | 'req-retake'
  | 'req-register-add-drop'
  | 'req-pre-registration'
  // Staff & Reports
  | 'staff'
  | 'reports';

interface Props {
  activeView: SisView;
  onSelectView: (view: SisView) => void;
}

export const SisSidebar: React.FC<Props> = ({ activeView, onSelectView }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track open accordion sections; default open 'viewing' or section containing activeView
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    viewing: true,
    requests: activeView.startsWith('req-'),
    staff: activeView === 'staff',
    reports: activeView === 'reports',
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    if (query.includes('plan')) onSelectView('academic-plan');
    else if (query.includes('attend')) onSelectView('attendance');
    else if (query.includes('mark') || query.includes('grade')) onSelectView('activity-marks');
    else if (query.includes('exam')) onSelectView('exam-schedule');
    else if (query.includes('pay') || query.includes('fee')) onSelectView('req-online-payment');
    else if (query.includes('withdraw')) onSelectView('req-course-withdrawal');
    else if (query.includes('drop')) onSelectView('req-drop-course');
    else if (query.includes('register') || query.includes('add')) onSelectView('req-register-add-drop');
    else if (query.includes('retake')) onSelectView('req-retake');
    else if (query.includes('appeal')) onSelectView('req-appeal');
    else if (query.includes('staff') || query.includes('advisor')) onSelectView('staff');
    else if (query.includes('report') || query.includes('transcript')) onSelectView('reports');
    else onSelectView('home');
  };

  const isViewingActive = ['home', 'academic-plan', 'attendance', 'activity-marks', 'exam-schedule'].includes(activeView);
  const isRequestsActive = activeView.startsWith('req-');
  const isStaffActive = activeView === 'staff';
  const isReportsActive = activeView === 'reports';

  return (
    <aside className="w-64 flex-shrink-0 bg-[#4e555e] text-[#f0f2f5] min-h-[calc(100vh-60px)] flex flex-col font-sans border-r border-[#3a4047] select-none text-[13px]">
      {/* Search Bar matching screenshot */}
      <div className="p-2.5 bg-[#424850] border-b border-[#363c43]">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
          <input
            id="sis-sidebar-search-input"
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-gray-800 text-xs px-2.5 py-1 rounded-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
          />
          <button
            type="submit"
            className="bg-[#e4e7eb] hover:bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-xs border border-gray-400 cursor-pointer shadow-xs transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Menu Categories */}
      <nav className="flex-1 py-1 space-y-0.5">
        {/* Quick Home shortcut button */}
        <div
          onClick={() => onSelectView('home')}
          className={`px-3 py-2 cursor-pointer font-medium flex items-center justify-between text-xs transition-colors border-b border-[#3e444b] ${
            activeView === 'home' ? 'bg-[#373d44] text-[#86d926] font-bold' : 'hover:bg-[#434952] text-gray-200'
          }`}
        >
          <span>» Student Home</span>
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Dashboard</span>
        </div>

        {/* 1. Viewing Category */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('viewing')}
            className={`w-full text-left px-3 py-2 font-bold flex items-center justify-between transition-colors cursor-pointer text-[13.5px] ${
              isViewingActive
                ? 'bg-[#6fa324] text-white shadow-xs border-b border-[#5e8b1d]'
                : 'bg-[#474d56] text-gray-200 hover:bg-[#3d434b] border-b border-[#3a4047]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>»</span>
              <span>Viewing</span>
            </span>
            <span className="text-xs">{openSections.viewing ? '▼' : '▶'}</span>
          </button>

          {openSections.viewing && (
            <ul className="bg-[#3e444c] py-1 text-[12.5px] border-b border-[#32373e]">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('academic-plan')}
                  className={`w-full text-left pl-6 pr-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeView === 'academic-plan'
                      ? 'text-[#8ee624] font-bold bg-[#33383f]'
                      : 'text-gray-300 hover:text-white hover:bg-[#464c55]'
                  }`}
                >
                  <span className="text-[#84bb2e]">›</span>
                  <span>My Academic Plan</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('attendance')}
                  className={`w-full text-left pl-6 pr-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeView === 'attendance'
                      ? 'text-[#8ee624] font-bold bg-[#33383f]'
                      : 'text-gray-300 hover:text-white hover:bg-[#464c55]'
                  }`}
                >
                  <span className="text-[#84bb2e]">›</span>
                  <span>student attendance</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('activity-marks')}
                  className={`w-full text-left pl-6 pr-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeView === 'activity-marks'
                      ? 'text-[#8ee624] font-bold bg-[#33383f]'
                      : 'text-gray-300 hover:text-white hover:bg-[#464c55]'
                  }`}
                >
                  <span className="text-[#84bb2e]">›</span>
                  <span>Semester Activity Marks</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('exam-schedule')}
                  className={`w-full text-left pl-6 pr-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeView === 'exam-schedule'
                      ? 'text-[#8ee624] font-bold bg-[#33383f]'
                      : 'text-gray-300 hover:text-white hover:bg-[#464c55]'
                  }`}
                >
                  <span className="text-[#84bb2e]">›</span>
                  <span>Exam Schedule</span>
                </button>
              </li>
            </ul>
          )}
        </div>

        {/* 2. My Requests Category */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('requests')}
            className={`w-full text-left px-3 py-2 font-bold flex items-center justify-between transition-colors cursor-pointer text-[13.5px] ${
              isRequestsActive
                ? 'bg-[#6fa324] text-white shadow-xs border-b border-[#5e8b1d]'
                : 'bg-[#474d56] text-gray-200 hover:bg-[#3d434b] border-b border-[#3a4047]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>»</span>
              <span>My Requests</span>
            </span>
            <span className="text-xs">{openSections.requests ? '▼' : '▶'}</span>
          </button>

          {openSections.requests && (
            <ul className="bg-[#3e444c] py-1 text-[12.5px] border-b border-[#32373e] space-y-0.5 max-h-[380px] overflow-y-auto">
              {[
                { id: 'req-course-withdrawal', label: 'Course Withdrawal Request' },
                { id: 'req-student-services', label: 'Student Services Request' },
                { id: 'req-drop-course', label: 'Drop Course Request' },
                { id: 'req-incomplete-course', label: 'incomplete Course Request' },
                { id: 'req-online-payment', label: 'Online Payment' },
                { id: 'req-change-program', label: 'Change of program request' },
                { id: 'req-track-declaration', label: 'Track declaration request' },
                { id: 'req-appeal', label: 'Appeal request' },
                { id: 'req-retake', label: 'Re-take Request' },
                { id: 'req-register-add-drop', label: 'Register/Add / Drop' },
                { id: 'req-pre-registration', label: 'Pre_Registration for upcoming Semester' },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectView(item.id as SisView)}
                    className={`w-full text-left pl-6 pr-2 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer truncate ${
                      activeView === item.id
                        ? 'text-[#8ee624] font-bold bg-[#33383f]'
                        : 'text-gray-300 hover:text-white hover:bg-[#464c55]'
                    }`}
                    title={item.label}
                  >
                    <span className="text-[#84bb2e]">›</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. My Staff Category */}
        <div>
          <button
            type="button"
            onClick={() => {
              toggleSection('staff');
              onSelectView('staff');
            }}
            className={`w-full text-left px-3 py-2 font-bold flex items-center justify-between transition-colors cursor-pointer text-[13.5px] ${
              isStaffActive
                ? 'bg-[#6fa324] text-white shadow-xs border-b border-[#5e8b1d]'
                : 'bg-[#474d56] text-gray-200 hover:bg-[#3d434b] border-b border-[#3a4047]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>»</span>
              <span>My Staff</span>
            </span>
            <span className="text-xs">{isStaffActive ? '●' : '›'}</span>
          </button>
        </div>

        {/* 4. Reports Category */}
        <div>
          <button
            type="button"
            onClick={() => {
              toggleSection('reports');
              onSelectView('reports');
            }}
            className={`w-full text-left px-3 py-2 font-bold flex items-center justify-between transition-colors cursor-pointer text-[13.5px] ${
              isReportsActive
                ? 'bg-[#6fa324] text-white shadow-xs border-b border-[#5e8b1d]'
                : 'bg-[#474d56] text-gray-200 hover:bg-[#3d434b] border-b border-[#3a4047]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>»</span>
              <span>Reports</span>
            </span>
            <span className="text-xs">{isReportsActive ? '●' : '›'}</span>
          </button>
        </div>
      </nav>

      {/* Footer Info in Sidebar */}
      <div className="p-3 bg-[#3a4047] text-[11px] text-gray-400 border-t border-[#31363c]">
        <div className="font-semibold text-gray-300">Elsewedy SIS v2.8</div>
        <div>Polytechnic Campus, Egypt</div>
      </div>
    </aside>
  );
};
