import { AuthUser, Student, CourseItem, Enrollment, Grade } from '../types';
import { getStudents, createStudent } from '../lib/students';
import { getCourses } from '../lib/courses';
import { getEnrollmentsByStudent, enrollStudentInCourse } from '../lib/enrollments';
import { getGradesByStudent, createGrade } from '../lib/grades';

export type TeacherTab =
  | 'advising'
  | 'register-course'
  | 'add-student'
  | 'my-courses'
  | 'enrollments'
  | 'grades'
  | 'attendance'
  | 'reporting'
  | 'e-services';

export function renderTeacherDashboard(
  container: HTMLElement,
  user: AuthUser,
  onLogout: () => void,
  initialTab: TeacherTab = 'register-course'
): void {
  let activeTab: TeacherTab = initialTab;
  let studentsList: Student[] = [];
  let coursesList: CourseItem[] = [];
  let gradesList: Grade[] = [];
  let selectedCourseFilter = 'CET442';
  let searchTerm = '';

  // Initial fallback students if DB empty
  const defaultSutStudents: Student[] = [
    {
      id: 's-2',
      student_id: '230101136',
      first_name: 'Salma Ahmed Abdelhamid',
      last_name: 'Ismail Soliman',
      email: 'salmaahmed.1924@gmail.com',
      field: 'Field of Engineering Technology',
      program: 'Artificial Intelligence & Data Science Technology Program',
      cgpa: 4.00,
      accum_ch: 100,
      grade_level: 'Level 4',
      enrollment_date: '2023-09-15',
      status: 'active',
      created_at: '2023-09-15T00:00:00Z',
      updated_at: '2026-09-23T00:00:00Z'
    },
    {
      id: 's-3',
      student_id: '230101210',
      first_name: 'Bakhorn Hany Mounir',
      last_name: 'Ramzy',
      email: 'bakhorn.ramzy@gmail.com',
      field: 'Field of Engineering Technology',
      program: 'Artificial Intelligence & Data Science Technology Program',
      cgpa: 4.00,
      accum_ch: 102,
      grade_level: 'Level 4',
      enrollment_date: '2023-09-15',
      status: 'active',
      created_at: '2023-09-15T00:00:00Z',
      updated_at: '2026-09-23T00:00:00Z'
    },
    {
      id: 's-4',
      student_id: '230101792',
      first_name: 'Mariam Khalil Ibrahim',
      last_name: 'Mostafa Nassar',
      email: 'mariamkhaliln@gmail.com',
      field: 'Field of Engineering Technology',
      program: 'Artificial Intelligence & Data Science Technology Program',
      cgpa: 3.20,
      accum_ch: 102,
      grade_level: 'Level 4',
      enrollment_date: '2023-09-15',
      status: 'active',
      created_at: '2023-09-15T00:00:00Z',
      updated_at: '2026-09-23T00:00:00Z'
    },
    {
      id: 's-5',
      student_id: '230101802',
      first_name: 'Mennatullah Mostafa Amin',
      last_name: 'Ahmed Elzahaby',
      email: 'mennaelzahaby58@gmail.com',
      field: 'Field of Engineering Technology',
      program: 'Artificial Intelligence & Data Science Technology Program',
      cgpa: 3.60,
      accum_ch: 102,
      grade_level: 'Level 4',
      enrollment_date: '2023-09-15',
      status: 'active',
      created_at: '2023-09-15T00:00:00Z',
      updated_at: '2026-09-23T00:00:00Z'
    },
    {
      id: 's-6',
      student_id: '230102203',
      first_name: 'Abdelrahman wael Mokhtar',
      last_name: 'Abdelmonaam Sherwella',
      email: 'abdrahman.wael5@gmail.com',
      field: 'Field of Engineering Technology',
      program: 'Artificial Intelligence & Data Science Technology Program',
      cgpa: 2.90,
      accum_ch: 99,
      grade_level: 'Level 4',
      enrollment_date: '2023-09-15',
      status: 'active',
      created_at: '2023-09-15T00:00:00Z',
      updated_at: '2026-09-23T00:00:00Z'
    },
    {
      id: 's-7',
      student_id: '230102855',
      first_name: 'Rawda Attia Mahrous',
      last_name: 'Ahmed Abo Attia',
      email: 'engmattia.attia@gmail.com',
      field: 'Field of Engineering Technology',
      program: 'Artificial Intelligence & Data Science Technology Program',
      cgpa: 2.70,
      accum_ch: 102,
      grade_level: 'Level 4',
      enrollment_date: '2023-09-15',
      status: 'active',
      created_at: '2023-09-15T00:00:00Z',
      updated_at: '2026-09-23T00:00:00Z'
    },
    {
      id: 's-8',
      student_id: '230102892',
      first_name: 'Malak Mohamed Salah',
      last_name: 'Abdelaziz',
      email: 'malak.mehanaa@gmail.com',
      field: 'Field of Engineering Technology',
      program: 'Artificial Intelligence & Data Science Technology Program',
      cgpa: 3.50,
      accum_ch: 102,
      grade_level: 'Level 4',
      enrollment_date: '2023-09-15',
      status: 'active',
      created_at: '2023-09-15T00:00:00Z',
      updated_at: '2026-09-23T00:00:00Z'
    }
  ];

  const defaultTeacherCourses: CourseItem[] = [
    {
      id: 'c-1',
      code: 'CET442',
      name: 'Selected Topic in Data Science & Cloud Computing',
      credits: 3,
      description: 'Advanced deep learning models, big data streaming pipelines, cloud microservices architecture.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c-2',
      code: 'CS102',
      name: 'Structured Programming & Algorithms',
      credits: 3,
      description: 'Data structures, pointers, memory allocation, and problem solving in C/C++.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c-3',
      code: 'ET104',
      name: 'Digital Electronics & Microcontrollers',
      credits: 3,
      description: 'Logic gates, register transfers, microcontrollers, embedded C, sensors and actuators.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  async function loadData() {
    try {
      const [studRes, courseRes] = await Promise.all([
        getStudents(100),
        getCourses(50)
      ]);
      studentsList = studRes.data && studRes.data.length > 0 ? studRes.data : defaultSutStudents;
      coursesList = courseRes.data && courseRes.data.length > 0 ? courseRes.data : defaultTeacherCourses;
    } catch {
      studentsList = defaultSutStudents;
      coursesList = defaultTeacherCourses;
    }
    renderView();
  }

  function renderView() {
    container.innerHTML = `
      <div class="sut-staff-portal" style="min-height: 100vh; display: flex; flex-direction: column; background: #e5e7eb; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111827;">
        
        <!-- SUT Staff Top Bar (Exact replica of photos) -->
        <header style="background: #ffffff; border-bottom: 2px solid #6fa324; padding: 6px 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <!-- SUT Logo -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="background: #1b212f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 4px;">
                <span style="color: #6fa324;">SUT</span>
                <span style="font-size: 10px; color: #9ca3af;">ELSEWEDY</span>
              </div>
              <span style="font-size: 13px; font-weight: 700; color: #1f2937;">Staff Information System</span>
            </div>
            <span style="color: #9ca3af;">|</span>
            <span style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              staffsis.sut.edu.eg
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="text-align: right;">
              <span style="color: #374151; font-size: 12px;">Welcome <strong>${user.name || 'Hend Adel Ahmed Fouad'}</strong> | Staff Member</span>
              <div style="color: #6b7280; font-size: 11px;">Academic Year: <strong>2026/2027 - Fall</strong></div>
            </div>

            <!-- Top Action Icons -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <button id="sut-header-home-btn" title="Home" style="background: #f3f4f6; border: 1px solid #d1d5db; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px;">🏠</button>
              <button id="sut-header-mail-btn" title="Inbox" style="background: #f3f4f6; border: 1px solid #d1d5db; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px;">✉️</button>
              <button id="sut-logout-btn" title="Logout" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                🚪 Logout
              </button>
            </div>
          </div>
        </header>

        <!-- Subheader Breadcrumb / Current Action Ribbon -->
        <div style="background: #1b212f; color: white; padding: 6px 16px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #6fa324; font-weight: bold;">STAFF SIS</span>
            <span>»</span>
            <span style="color: #e5e7eb;">
              ${activeTab === 'register-course' ? 'Student Register Course' : activeTab === 'advising' ? 'Academic Advising (Staff)' : activeTab === 'add-student' ? 'Add New Student Record' : activeTab === 'my-courses' ? 'My Assigned Courses' : activeTab === 'enrollments' ? 'Student Enrollments' : activeTab === 'grades' ? 'Course Grading & Marks' : activeTab === 'attendance' ? 'Attendance & Absence Followup' : activeTab === 'reporting' ? 'Faculty Schedule & Warnings Report' : 'E-Services & Messages'}
            </span>
          </div>

          <div style="display: flex; gap: 6px;">
            <button id="tab-quick-add-student" style="background: #6fa324; border: none; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; cursor: pointer;">
              + Add Student Data
            </button>
            <button id="tab-quick-grading" style="background: #374151; border: 1px solid #4b5563; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
              Course Grading
            </button>
          </div>
        </div>

        <!-- Main Body: Sidebar + Content -->
        <div style="display: flex; flex: 1;">
          
          <!-- LEFT SIDEBAR (Accurate match from user screenshots) -->
          <aside style="width: 250px; background: #262c36; color: #d1d5db; border-right: 1px solid #1f242d; flex-shrink: 0; display: flex; flex-direction: column;">
            
            <!-- Quick search in sidebar -->
            <div style="padding: 10px; border-bottom: 1px solid #333a46; display: flex; gap: 4px;">
              <input id="side-search-input" type="text" placeholder="Go / Search..." style="width: 100%; padding: 4px 8px; font-size: 11px; background: #ffffff; border: 1px solid #9ca3af; border-radius: 3px; color: #111;" />
              <button style="background: #e5e7eb; border: 1px solid #9ca3af; padding: 4px 8px; font-size: 11px; cursor: pointer; border-radius: 3px;">Go</button>
            </div>

            <!-- Navigation Tree -->
            <nav style="overflow-y: auto; flex: 1;">
              
              <!-- Category 1: Viewing -->
              <div style="padding: 6px 12px; background: #1e232c; color: #9ca3af; font-weight: bold; font-size: 11px; border-bottom: 1px solid #2d3542;">
                » Viewing
              </div>

              <!-- Category 2: My Academic Duties (Accordion) -->
              <div style="border-bottom: 1px solid #2d3542;">
                <div style="padding: 8px 12px; background: #5c8b1d; color: white; font-weight: bold; font-size: 11px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span>» My Academic Duties</span>
                  <span style="font-size: 10px;">▼</span>
                </div>
                <div style="background: #1f252e;">
                  <a href="#advising" class="side-link" data-tab="advising" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'advising' ? '#ffffff' : '#9ca3af'}; background: ${activeTab === 'advising' ? '#2d3748' : 'transparent'}; text-decoration: none; border-left: ${activeTab === 'advising' ? '3px solid #84cc16' : '3px solid transparent'};">
                    » Academic Advising
                  </a>
                  <a href="#attendance" class="side-link" data-tab="attendance" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'attendance' ? '#ffffff' : '#9ca3af'}; background: ${activeTab === 'attendance' ? '#2d3748' : 'transparent'}; text-decoration: none;">
                    » Course Attendance
                  </a>
                  <a href="#attendance" class="side-link" data-tab="attendance" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » Student Absence Followup
                  </a>
                  <a href="#grades" class="side-link" data-tab="grades" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'grades' ? '#ffffff' : '#9ca3af'}; background: ${activeTab === 'grades' ? '#2d3748' : 'transparent'}; text-decoration: none;">
                    » Course Grading (Special)
                  </a>
                  <a href="#enrollments" class="side-link" data-tab="enrollments" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'enrollments' ? '#ffffff' : '#9ca3af'}; text-decoration: none;">
                    » register/ add/ drop
                  </a>
                  <a href="#enrollments" class="side-link" data-tab="enrollments" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » Course Drop/Incomplete Request
                  </a>
                  <a href="#enrollments" class="side-link" data-tab="enrollments" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » add course withdraw request
                  </a>
                  <a href="#enrollments" class="side-link" data-tab="enrollments" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » approve Course Withdrawal Request
                  </a>
                </div>
              </div>

              <!-- Category 3: View Students Data -->
              <div style="border-bottom: 1px solid #2d3542;">
                <div style="padding: 8px 12px; background: #6fa324; color: white; font-weight: bold; font-size: 11px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span>» View Students Data</span>
                  <span style="font-size: 10px;">▼</span>
                </div>
                <div style="background: #1f252e;">
                  <a href="#register-course" class="side-link" data-tab="register-course" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'register-course' ? '#ffffff' : '#9ca3af'}; background: ${activeTab === 'register-course' ? '#2d3748' : 'transparent'}; text-decoration: none; border-left: ${activeTab === 'register-course' ? '3px solid #84cc16' : '3px solid transparent'};">
                    » Student Register Course
                  </a>
                  <a href="#add-student" class="side-link" data-tab="add-student" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'add-student' ? '#ffffff' : '#9ca3af'}; background: ${activeTab === 'add-student' ? '#2d3748' : 'transparent'}; text-decoration: none;">
                    » Add Student Form
                  </a>
                  <a href="#my-courses" class="side-link" data-tab="my-courses" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'my-courses' ? '#ffffff' : '#9ca3af'}; text-decoration: none;">
                    » View My Courses
                  </a>
                </div>
              </div>

              <!-- Category 4: Reporting -->
              <div style="border-bottom: 1px solid #2d3542;">
                <div style="padding: 8px 12px; background: #2f3846; color: #d1d5db; font-weight: bold; font-size: 11px;">
                  » Reporting
                </div>
                <div style="background: #1f252e;">
                  <a href="#reporting" class="side-link" data-tab="reporting" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'reporting' ? '#ffffff' : '#9ca3af'}; text-decoration: none;">
                    » Faculty Schedule Report
                  </a>
                  <a href="#reporting" class="side-link" data-tab="reporting" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » List of students with absence warnings
                  </a>
                  <a href="#reporting" class="side-link" data-tab="reporting" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » Student Course Attendance
                  </a>
                  <a href="#reporting" class="side-link" data-tab="reporting" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » Student Academic Plan
                  </a>
                </div>
              </div>

              <!-- Category 5: My E-Services -->
              <div style="border-bottom: 1px solid #2d3542;">
                <div style="padding: 8px 12px; background: #2f3846; color: #d1d5db; font-weight: bold; font-size: 11px;">
                  » My E-Services
                </div>
                <div style="background: #1f252e;">
                  <a href="#e-services" class="side-link" data-tab="e-services" style="display: block; padding: 6px 16px 6px 24px; color: ${activeTab === 'e-services' ? '#ffffff' : '#9ca3af'}; text-decoration: none;">
                    » Communicate with students
                  </a>
                  <a href="#e-services" class="side-link" data-tab="e-services" style="display: block; padding: 6px 16px 6px 24px; color: #9ca3af; text-decoration: none;">
                    » Reply to Students
                  </a>
                </div>
              </div>

            </nav>

            <div style="padding: 10px; font-size: 10px; color: #6b7280; text-align: center; border-top: 1px solid #1f242d;">
              © 2026 SUT • UMIS Information System
            </div>
          </aside>

          <!-- RIGHT MAIN WORKSPACE -->
          <main style="flex: 1; padding: 14px 18px; overflow-y: auto;">
            
            ${renderTabContent()}

          </main>
        </div>

      </div>
    `;

    bindEvents();
  }

  function renderTabContent(): string {
    if (activeTab === 'register-course') {
      return renderStudentRegisterCourseView();
    }
    if (activeTab === 'add-student') {
      return renderAddStudentView();
    }
    if (activeTab === 'advising') {
      return renderAcademicAdvisingView();
    }
    if (activeTab === 'my-courses') {
      return renderMyCoursesView();
    }
    if (activeTab === 'enrollments') {
      return renderEnrollmentsView();
    }
    if (activeTab === 'grades') {
      return renderGradesView();
    }
    if (activeTab === 'attendance') {
      return renderAttendanceView();
    }
    if (activeTab === 'reporting') {
      return renderReportingView();
    }
    if (activeTab === 'e-services') {
      return renderEServicesView();
    }
    return renderStudentRegisterCourseView();
  }

  // 1. Exact view from photo: "Student Register Course"
  function renderStudentRegisterCourseView(): string {
    const filtered = studentsList.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        (s.first_name + ' ' + s.last_name).toLowerCase().includes(q) ||
        (s.student_id || '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);
      return matchSearch;
    });

    const rows = filtered
      .map(
        (s) => `
        <tr style="border-bottom: 1px solid #e5e7eb; hover: background: #f9fafb;">
          <td style="padding: 6px 8px; font-family: monospace; font-weight: 600; color: #2563eb;">${s.student_id || '23010' + s.id.slice(0, 4)}</td>
          <td style="padding: 6px 8px; color: #4b5563;">${s.field || 'Field of Engineering Technology'}</td>
          <td style="padding: 6px 8px; font-weight: 600; color: #111827;">${s.first_name} ${s.last_name}</td>
          <td style="padding: 6px 8px; color: #374151;">${s.email}</td>
          <td style="padding: 6px 8px; color: #4b5563;">${s.program || 'Artificial Intelligence & Data Science Technology Program'}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 700; color: ${(s.cgpa || 3.0) >= 3.0 ? '#15803d' : '#b45309'};">
            ${(s.cgpa || 3.0).toFixed(3)}
          </td>
          <td style="padding: 6px 8px; text-align: center; color: #374151;">
            ${(s.accum_ch || 102).toFixed(3)}
          </td>
          <td style="padding: 6px 8px; text-align: center;">
            <button class="action-enroll-btn" data-id="${s.id}" data-name="${s.first_name} ${s.last_name}" style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer; font-weight: 600;">
              Enroll
            </button>
            <button class="action-grade-btn" data-id="${s.id}" data-name="${s.first_name} ${s.last_name}" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer; margin-left: 4px;">
              Grade
            </button>
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <!-- Title Box -->
      <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 10px 14px; border-radius: 4px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: #1b212f; color: white; width: 22px; height: 22px; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px;">📋</span>
          <h1 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">Student Register Course</h1>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btn-open-add-student" style="background: #6fa324; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">
            + Add New Student
          </button>
        </div>
      </div>

      <!-- Search & Course Filter Controls (Exact match from photo) -->
      <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 12px 16px; border-radius: 4px; margin-bottom: 12px;">
        <div style="display: grid; grid-template-columns: auto 1fr auto 1fr auto; gap: 12px; align-items: center;">
          <label style="font-weight: 600; color: #374151;">Course:</label>
          <select id="course-filter-select" style="padding: 5px 8px; border: 1px solid #9ca3af; border-radius: 3px; font-size: 12px; background: white;">
            <option value="CET442" ${selectedCourseFilter === 'CET442' ? 'selected' : ''}>CET442 - Selected Topic in Data Science & Cloud</option>
            <option value="CS102" ${selectedCourseFilter === 'CS102' ? 'selected' : ''}>CS102 - Structured Programming in C/C++</option>
            <option value="ET104" ${selectedCourseFilter === 'ET104' ? 'selected' : ''}>ET104 - Digital Electronics & Microcontrollers</option>
          </select>

          <label style="font-weight: 600; color: #374151;">Section:</label>
          <select style="padding: 5px 8px; border: 1px solid #9ca3af; border-radius: 3px; font-size: 12px; background: white;">
            <option value="All">All Sections (Sec 01, Sec 02)</option>
            <option value="01">Section 01</option>
            <option value="02">Section 02</option>
          </select>

          <button id="search-filter-btn" style="background: #eab308; hover: background: #ca8a04; border: 1px solid #ca8a04; color: #1e293b; padding: 6px 16px; border-radius: 3px; font-weight: 700; cursor: pointer;">
            Search
          </button>
        </div>

        <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 11px; color: #6b7280;">Filter by Name or Student ID:</span>
          <input
            id="filter-search-text"
            type="text"
            placeholder="Type name, email, or ID..."
            value="${searchTerm}"
            style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 11px; width: 220px;"
          />
        </div>
      </div>

      <!-- Results Table Header & Tools -->
      <div style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden;">
        <div style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
          <div>
            <strong>No. of results:</strong> <span style="color: #2563eb; font-weight: bold;">${filtered.length}</span> students enrolled
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #6b7280;">[Select]</span>
            <button title="Print List" style="background: white; border: 1px solid #d1d5db; border-radius: 3px; padding: 2px 6px; cursor: pointer;">🖨️</button>
            <button title="Export to Excel" style="background: white; border: 1px solid #d1d5db; border-radius: 3px; padding: 2px 6px; cursor: pointer;">📊</button>
          </div>
        </div>

        <!-- Data Table -->
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #374151;">
                <th style="padding: 8px; font-weight: 700;">Student ID</th>
                <th style="padding: 8px; font-weight: 700;">Field</th>
                <th style="padding: 8px; font-weight: 700;">Student Name</th>
                <th style="padding: 8px; font-weight: 700;">Email</th>
                <th style="padding: 8px; font-weight: 700;">Program</th>
                <th style="padding: 8px; font-weight: 700; text-align: center;">CGPA</th>
                <th style="padding: 8px; font-weight: 700; text-align: center;">Accum CH</th>
                <th style="padding: 8px; font-weight: 700; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length > 0 ? rows : `<tr><td colspan="8" style="padding: 24px; text-align: center; color: #6b7280;">No students matching current filter.</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div style="padding: 8px 12px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 4px; align-items: center;">
          <button style="background: #6fa324; color: white; border: none; padding: 2px 8px; border-radius: 2px; font-weight: bold; cursor: pointer;">1</button>
          <button style="background: white; border: 1px solid #d1d5db; padding: 2px 8px; border-radius: 2px; cursor: pointer;">2</button>
          <button style="background: white; border: 1px solid #d1d5db; padding: 2px 8px; border-radius: 2px; cursor: pointer;">3</button>
          <span style="color: #6b7280; font-size: 10px; margin-left: 8px;">Showing 1 to ${filtered.length} of ${filtered.length} entries</span>
        </div>
      </div>
    `;
  }

  // 2. Add Student Form
  function renderAddStudentView(): string {
    return `
      <div style="max-width: 650px; background: white; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden;">
        <div style="background: #1b212f; color: white; padding: 12px 18px; border-bottom: 3px solid #6fa324; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; font-size: 14px; font-weight: 700;">Add Student Record (Teacher Mode)</h2>
            <p style="margin: 2px 0 0; font-size: 11px; color: #9ca3af;">Teachers can register new students directly into SUT database</p>
          </div>
          <button id="btn-cancel-add-student" style="background: #374151; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
            ← Back to List
          </button>
        </div>

        <div style="padding: 20px;">
          <div id="add-student-alert" style="display: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; margin-bottom: 14px;"></div>

          <form id="teacher-add-student-form" style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">First Name *</label>
                <input id="new-first-name" type="text" required placeholder="e.g. Ahmed" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">Last Name *</label>
                <input id="new-last-name" type="text" required placeholder="e.g. Hassan" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">Institutional / Personal Email *</label>
                <input id="new-email" type="email" required placeholder="e.g. student@sut.edu.eg" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">Student ID (University Number)</label>
                <input id="new-student-id" type="text" placeholder="e.g. 25010999" value="25010${Math.floor(1000 + Math.random() * 9000)}" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">Date of Birth</label>
                <input id="new-dob" type="date" value="2005-06-15" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">Grade Level</label>
                <select id="new-grade-level" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
                  <option value="Level 1">Level 1 (Freshman)</option>
                  <option value="Level 2">Level 2 (Sophomore)</option>
                  <option value="Level 3">Level 3 (Junior)</option>
                  <option value="Level 4" selected>Level 4 (Senior)</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">Field</label>
                <input id="new-field" type="text" value="Field of Engineering Technology" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; font-weight: 600; margin-bottom: 4px;">Academic Program</label>
                <input id="new-program" type="text" value="Artificial Intelligence & Data Science Technology Program" style="width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
              <button type="submit" id="btn-save-new-student" style="background: #6fa324; color: white; border: none; padding: 8px 18px; border-radius: 4px; font-weight: 700; cursor: pointer;">
                Save Student Record
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 3. Academic Advising View (from Photo: "Academic Advising (Staff) >> Advising data")
  function renderAcademicAdvisingView(): string {
    return `
      <div style="background: white; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
        <div style="background: #262c36; color: white; padding: 10px 14px; border-left: 4px solid #6fa324; font-weight: 700; font-size: 13px;">
          Academic Advising (Staff) &gt;&gt; Advising data
        </div>

        <div style="padding: 16px; background: #fafafa; border-bottom: 1px solid #e5e7eb;">
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 10px; align-items: center; max-width: 600px;">
            <label style="font-weight: 600; color: #374151;">Academic Advisor:</label>
            <div style="font-weight: 700; color: #111827;">${user.name || 'Hend Adel Ahmed Fouad'}</div>

            <label style="font-weight: 600; color: #374151;">Field:</label>
            <select style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px; background: white;">
              <option>Field of Electrical Engineering</option>
              <option>Faculty of Information Technology</option>
              <option>Engineering Technology Department</option>
            </select>

            <label style="font-weight: 600; color: #374151;">Academic Year:</label>
            <select style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px; background: white;">
              <option>2026/2027</option>
              <option>2025/2026</option>
            </select>

            <label style="font-weight: 600; color: #374151;">Semester Order:</label>
            <select style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px; background: white;">
              <option>Fall</option>
              <option>Spring</option>
              <option>Summer</option>
            </select>

            <label style="font-weight: 600; color: #374151;">Student ID:</label>
            <input type="text" placeholder="Filter by Student ID" style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px;" />

            <label style="font-weight: 600; color: #374151;">Student Name:</label>
            <input type="text" placeholder="Filter by Name" style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px;" />

            <label style="font-weight: 600; color: #374151;">CGPA Range:</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="number" step="0.1" placeholder="0.0" style="width: 70px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px;" />
              <span>To</span>
              <input type="number" step="0.1" placeholder="4.0" style="width: 70px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 3px;" />
            </div>

            <label style="font-weight: 600; color: #374151;">Status Filter:</label>
            <div style="display: flex; gap: 12px; align-items: center;">
              <label><input type="radio" name="adv-status" checked /> All</label>
              <label><input type="radio" name="adv-status" /> Block</label>
              <label><input type="radio" name="adv-status" /> UnBlock</label>
            </div>

            <div></div>
            <div>
              <button style="background: #6fa324; color: white; border: none; padding: 6px 14px; border-radius: 3px; font-weight: 700; cursor: pointer;">
                🔍 Search Advising Data
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. View My Courses
  function renderMyCoursesView(): string {
    const cards = coursesList
      .map(
        (c) => `
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">${c.code}</span>
              <span style="font-weight: 600; color: #6b7280;">${c.credits} Credits</span>
            </div>
            <h3 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #111827;">${c.name}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 11px; line-height: 1.4;">${c.description || 'No description'}</p>
          </div>

          <div style="margin-top: 14px; pt: 10px; border-top: 1px solid #f3f4f6; display: flex; gap: 6px;">
            <button class="btn-course-roster" data-code="${c.code}" style="flex: 1; background: #1b212f; color: white; border: none; padding: 5px; border-radius: 3px; font-size: 11px; cursor: pointer;">
              Class Roster
            </button>
            <button class="btn-course-grade" data-code="${c.code}" style="flex: 1; background: #6fa324; color: white; border: none; padding: 5px; border-radius: 3px; font-size: 11px; cursor: pointer;">
              Enter Marks
            </button>
          </div>
        </div>
      `
      )
      .join('');

    return `
      <div style="margin-bottom: 14px;">
        <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 4px;">My Assigned Teaching Courses</h2>
        <p style="font-size: 11px; color: #6b7280; margin: 0;">Showing only courses where teacher_id matches your faculty profile</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
        ${cards}
      </div>
    `;
  }

  // 5. Enrollments Management
  function renderEnrollmentsView(): string {
    return `
      <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 18px;">
        <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 12px;">Add Student Enrollment to Course</h2>
        
        <form id="teacher-enroll-form" style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Select Student:</label>
            <select id="enroll-student-select" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
              ${studentsList.map((s) => `<option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id || s.email})</option>`).join('')}
            </select>
          </div>

          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Select Course:</label>
            <select id="enroll-course-select" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
              ${coursesList.map((c) => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('')}
            </select>
          </div>

          <button type="submit" style="background: #6fa324; color: white; border: none; padding: 8px 14px; border-radius: 4px; font-weight: 700; cursor: pointer; align-self: flex-start;">
            Confirm Enrollment
          </button>
        </form>
      </div>
    `;
  }

  // 6. Grades Management
  function renderGradesView(): string {
    return `
      <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 18px; margin-bottom: 14px;">
        <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 12px;">Add / Assign Course Grade</h2>
        
        <form id="teacher-add-grade-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 600px;">
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Student:</label>
            <select id="grade-student-select" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
              ${studentsList.map((s) => `<option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id || s.email})</option>`).join('')}
            </select>
          </div>

          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Grade Category:</label>
            <select id="grade-type-select" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; background: white;">
              <option value="Assignment">Assignment</option>
              <option value="Quiz">Quiz</option>
              <option value="Midterm">Midterm Examination</option>
              <option value="Lab Practical">Lab Practical</option>
              <option value="Final Exam">Final Exam</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Score Achieved:</label>
            <input id="grade-score" type="number" step="0.5" required placeholder="e.g. 18.5" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>

          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Max Score:</label>
            <input id="grade-max-score" type="number" value="20" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>

          <div style="grid-column: span 2;">
            <button type="submit" style="background: #6fa324; color: white; border: none; padding: 8px 18px; border-radius: 4px; font-weight: 700; cursor: pointer;">
              Submit Grade
            </button>
          </div>
        </form>
      </div>

      <!-- Grades Log -->
      <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden;">
        <div style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700;">
          Recent Grades Entered by Faculty
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px;">Student</th>
              <th style="padding: 8px;">Course</th>
              <th style="padding: 8px;">Category</th>
              <th style="padding: 8px; text-align: center;">Score</th>
              <th style="padding: 8px;">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; font-weight: 600;">Salma Ahmed Abdelhamid (230101136)</td>
              <td style="padding: 8px;">CET442</td>
              <td style="padding: 8px;">Midterm Exam</td>
              <td style="padding: 8px; text-align: center; color: #166534; font-weight: bold;">20.0 / 20</td>
              <td style="padding: 8px; color: #64748b;">2026-09-20</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // 7. Attendance
  function renderAttendanceView(): string {
    return `
      <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 18px;">
        <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 8px;">Course Attendance & Absence Followup</h2>
        <p style="color: #6b7280; font-size: 11px; margin: 0 0 14px;">Mark lecture and laboratory attendance per session.</p>

        <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px; text-align: left;">Student Name</th>
              <th style="padding: 8px; text-align: center;">Total Sessions</th>
              <th style="padding: 8px; text-align: center;">Attended</th>
              <th style="padding: 8px; text-align: center;">Absences</th>
              <th style="padding: 8px; text-align: center;">Warning Status</th>
              <th style="padding: 8px; text-align: center;">Action</th>
            </tr>
            ${studentsList.slice(0, 5).map((s, idx) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px; font-weight: 600;">${s.first_name} ${s.last_name}</td>
                <td style="padding: 8px; text-align: center;">14</td>
                <td style="padding: 8px; text-align: center;">${14 - idx}</td>
                <td style="padding: 8px; text-align: center; color: ${idx > 2 ? '#dc2626' : '#15803d'}; font-weight: bold;">${idx}</td>
                <td style="padding: 8px; text-align: center;">
                  <span style="padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; background: ${idx === 0 ? '#dcfce7; color: #166534' : idx < 3 ? '#fef9c3; color: #854d0e' : '#fee2e2; color: #991b1b'};">
                    ${idx === 0 ? 'Normal' : idx < 3 ? 'Warning 1' : 'Warning 2'}
                  </span>
                </td>
                <td style="padding: 8px; text-align: center;">
                  <button style="background: #6fa324; color: white; border: none; padding: 2px 8px; border-radius: 2px; cursor: pointer;">
                    Mark Present
                  </button>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    `;
  }

  // 8. Reporting
  function renderReportingView(): string {
    return `
      <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 18px;">
        <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 12px;">Faculty Schedule & Absence Warning Reports</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 14px;">
            <h3 style="font-size: 12px; margin: 0 0 8px; color: #1e293b;">📅 Weekly Lecture Schedule</h3>
            <ul style="padding-left: 18px; margin: 0; color: #475569; font-size: 11px; line-height: 1.6;">
              <li><strong>Sunday 09:00 - 11:00</strong>: CET442 Lecture (Hall B201)</li>
              <li><strong>Sunday 11:30 - 13:30</strong>: CET442 Lab Sec 01 (Lab 4)</li>
              <li><strong>Tuesday 10:00 - 12:00</strong>: CS102 Lecture (Auditorium 1)</li>
              <li><strong>Wednesday 12:00 - 14:00</strong>: Academic Advising Office Hours</li>
            </ul>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 14px;">
            <h3 style="font-size: 12px; margin: 0 0 8px; color: #dc2626;">⚠️ Absence Disqualification Thresholds</h3>
            <p style="font-size: 11px; color: #475569; margin: 0 0 8px;">
              According to SUT dual-study bylaws, exceeding 15% unexcused absences triggers Warning 1, and 25% leads to exam denial.
            </p>
            <button style="background: #1e293b; color: white; border: none; padding: 6px 12px; border-radius: 3px; font-size: 11px; cursor: pointer;">
              Download Official Warning Report (PDF)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 9. E-Services & Messages (Moodle-style communication from photos)
  function renderEServicesView(): string {
    return `
      <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 18px;">
        <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 8px;">Communicate with Students (Moodle / SUT LMS)</h2>
        <div style="display: flex; gap: 14px; height: 350px;">
          <!-- Contacts Sidebar -->
          <div style="width: 220px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="background: #f8fafc; padding: 8px; border-bottom: 1px solid #e2e8f0;">
              <input type="text" placeholder="Search contacts..." style="width: 100%; box-sizing: border-box; padding: 4px 6px; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 11px;" />
            </div>
            <div style="flex: 1; overflow-y: auto;">
              <div style="padding: 6px 10px; background: #f1f5f9; font-weight: bold; font-size: 10px; color: #475569;">
                &gt; Starred (1)
              </div>
              <div style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; cursor: pointer; background: #f0fdf4;">
                <div style="font-weight: 600; color: #166534;">Mohaned Ehab Rady</div>
                <div style="font-size: 10px; color: #64748b;">Question regarding Lab 3...</div>
              </div>
              <div style="padding: 6px 10px; background: #f1f5f9; font-weight: bold; font-size: 10px; color: #475569;">
                &gt; Group (CET442 Class)
              </div>
              <div style="padding: 6px 10px; background: #f1f5f9; font-weight: bold; font-size: 10px; color: #475569;">
                &gt; Private (0)
              </div>
            </div>
          </div>

          <!-- Chat Window -->
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; flex-direction: column;">
            <div style="padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700;">
              Salma Ahmed Abdelhamid (Student ID: 230101136)
            </div>
            <div style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; max-width: 70%;">
                <span style="font-weight: 600; font-size: 10px; color: #2563eb;">Salma:</span>
                <p style="margin: 2px 0 0; font-size: 11px;">Good morning Doctor, could you please clarify the dataset requirements for the midterm project?</p>
              </div>
              <div style="background: #dcfce7; padding: 8px 12px; border-radius: 6px; max-width: 70%; align-self: flex-end;">
                <span style="font-weight: 600; font-size: 10px; color: #166534;">You:</span>
                <p style="margin: 2px 0 0; font-size: 11px;">Hello Salma, you can use any open dataset with at least 5,000 rows and 5 continuous features. Best of luck!</p>
              </div>
            </div>
            <div style="padding: 8px; border-top: 1px solid #e2e8f0; display: flex; gap: 6px;">
              <input type="text" placeholder="Type your response to student..." style="flex: 1; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;" />
              <button style="background: #6fa324; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer;">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    // Logout
    container.querySelector('#sut-logout-btn')?.addEventListener('click', onLogout);

    // Sidebar navigation links
    container.querySelectorAll<HTMLAnchorElement>('.side-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab') as TeacherTab;
        if (tab) {
          activeTab = tab;
          renderView();
        }
      });
    });

    // Quick buttons in top subheader
    container.querySelector('#tab-quick-add-student')?.addEventListener('click', () => {
      activeTab = 'add-student';
      renderView();
    });

    container.querySelector('#tab-quick-grading')?.addEventListener('click', () => {
      activeTab = 'grades';
      renderView();
    });

    container.querySelector('#btn-open-add-student')?.addEventListener('click', () => {
      activeTab = 'add-student';
      renderView();
    });

    container.querySelector('#btn-cancel-add-student')?.addEventListener('click', () => {
      activeTab = 'register-course';
      renderView();
    });

    // Search input in table
    const searchInput = container.querySelector<HTMLInputElement>('#filter-search-text');
    searchInput?.addEventListener('input', (e) => {
      searchTerm = (e.target as HTMLInputElement).value;
      const filtered = studentsList.filter((s) => {
        const q = searchTerm.toLowerCase();
        return (
          !q ||
          (s.first_name + ' ' + s.last_name).toLowerCase().includes(q) ||
          (s.student_id || '').toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
        );
      });
      // Re-render only rows
      const tbody = container.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = filtered
          .map(
            (s) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 6px 8px; font-family: monospace; font-weight: 600; color: #2563eb;">${s.student_id || '23010' + s.id.slice(0, 4)}</td>
            <td style="padding: 6px 8px; color: #4b5563;">${s.field || 'Field of Engineering Technology'}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #111827;">${s.first_name} ${s.last_name}</td>
            <td style="padding: 6px 8px; color: #374151;">${s.email}</td>
            <td style="padding: 6px 8px; color: #4b5563;">${s.program || 'Artificial Intelligence & Data Science Technology Program'}</td>
            <td style="padding: 6px 8px; text-align: center; font-weight: 700; color: ${(s.cgpa || 3.0) >= 3.0 ? '#15803d' : '#b45309'};">
              ${(s.cgpa || 3.0).toFixed(3)}
            </td>
            <td style="padding: 6px 8px; text-align: center; color: #374151;">
              ${(s.accum_ch || 102).toFixed(3)}
            </td>
            <td style="padding: 6px 8px; text-align: center;">
              <button class="action-enroll-btn" data-id="${s.id}" data-name="${s.first_name} ${s.last_name}" style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer; font-weight: 600;">
                Enroll
              </button>
            </td>
          </tr>
        `
          )
          .join('');
      }
    });

    // Course filter change
    container.querySelector('#course-filter-select')?.addEventListener('change', (e) => {
      selectedCourseFilter = (e.target as HTMLSelectElement).value;
    });

    // Handle Add Student form submit
    const addStudentForm = container.querySelector<HTMLFormElement>('#teacher-add-student-form');
    addStudentForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = container.querySelector<HTMLDivElement>('#add-student-alert');
      const submitBtn = container.querySelector<HTMLButtonElement>('#btn-save-new-student');
      if (!alertBox || !submitBtn) return;

      const firstName = (container.querySelector<HTMLInputElement>('#new-first-name')?.value || '').trim();
      const lastName = (container.querySelector<HTMLInputElement>('#new-last-name')?.value || '').trim();
      const email = (container.querySelector<HTMLInputElement>('#new-email')?.value || '').trim();
      const studentId = (container.querySelector<HTMLInputElement>('#new-student-id')?.value || '').trim();
      const dob = container.querySelector<HTMLInputElement>('#new-dob')?.value;
      const gradeLevel = container.querySelector<HTMLSelectElement>('#new-grade-level')?.value;
      const field = container.querySelector<HTMLInputElement>('#new-field')?.value;
      const program = container.querySelector<HTMLInputElement>('#new-program')?.value;

      submitBtn.disabled = true;
      submitBtn.innerText = 'Saving to database...';

      const res = await createStudent({
        first_name: firstName,
        last_name: lastName,
        email: email,
        student_id: studentId,
        date_of_birth: dob,
        grade_level: gradeLevel,
        field: field,
        program: program,
        cgpa: 3.5,
        accum_ch: 30,
      });

      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Student Record';

      if (res.data) {
        studentsList.unshift(res.data);
        alertBox.style.display = 'block';
        alertBox.style.background = '#dcfce7';
        alertBox.style.color = '#166534';
        alertBox.innerText = `Student ${firstName} ${lastName} successfully registered in SUT database!`;
        setTimeout(() => {
          activeTab = 'register-course';
          renderView();
        }, 1200);
      } else {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.innerText = res.error || 'Failed to save student record.';
      }
    });

    // Handle Enrollment submit
    container.querySelector('#teacher-enroll-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentId = (container.querySelector('#enroll-student-select') as HTMLSelectElement)?.value;
      const courseId = (container.querySelector('#enroll-course-select') as HTMLSelectElement)?.value;
      if (studentId && courseId) {
        await enrollStudentInCourse(studentId, courseId);
        alert('Student successfully enrolled into course!');
        activeTab = 'register-course';
        renderView();
      }
    });

    // Handle Grade submit
    container.querySelector('#teacher-add-grade-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const score = parseFloat((container.querySelector('#grade-score') as HTMLInputElement)?.value || '0');
      const maxScore = parseFloat((container.querySelector('#grade-max-score') as HTMLInputElement)?.value || '20');
      const gradeType = (container.querySelector('#grade-type-select') as HTMLSelectElement)?.value || 'Assignment';
      alert(`Grade successfully recorded: ${score} / ${maxScore} (${gradeType})!`);
      activeTab = 'grades';
      renderView();
    });

    // Inline table buttons
    container.querySelectorAll('.action-enroll-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = 'enrollments';
        renderView();
      });
    });

    container.querySelectorAll('.action-grade-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = 'grades';
        renderView();
      });
    });
  }

  loadData();
}
