import { AuthUser, Student, CourseItem, Teacher } from '../types';
import { getStudents, deleteStudent, createStudent } from '../lib/students';
import { getCourses, createCourse, deleteCourse } from '../lib/courses';
import { getTeachers, createTeacher } from '../lib/teachers';

export function renderAdminDashboard(
  container: HTMLElement,
  user: AuthUser,
  onLogout: () => void
): void {
  let activeTab: 'overview' | 'students' | 'teachers' | 'courses' | 'grades' = 'overview';
  let students: Student[] = [];
  let teachers: Teacher[] = [];
  let courses: CourseItem[] = [];
  let loading = true;

  async function loadData() {
    loading = true;
    render();
    try {
      const [sRes, tRes, cRes] = await Promise.all([
        getStudents(100),
        getTeachers(100),
        getCourses(100),
      ]);
      students = sRes.data || [];
      teachers = tRes.data || [];
      courses = cRes.data || [];
    } catch (e) {
      console.error(e);
    }
    loading = false;
    render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height: 100vh; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
        
        <!-- Admin Top Navigation -->
        <header style="background: #0f172a; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #3b82f6;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="background: #3b82f6; color: white; font-weight: 900; padding: 4px 10px; border-radius: 6px; font-size: 14px;">
              SUT ADMIN
            </div>
            <div>
              <h1 style="font-size: 15px; font-weight: 700; margin: 0;">Academic Information System Administration</h1>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">Full CRUD privileges for Students, Faculty, Courses & Grades</p>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 14px;">
            <span style="font-size: 12px; color: #cbd5e1;">Logged in as: <strong>${user.name || user.email}</strong> (Super Admin)</span>
            <button id="admin-logout-btn" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Sign Out
            </button>
          </div>
        </header>

        <!-- Admin Subheader Tabs -->
        <div style="background: white; border-bottom: 1px solid #e2e8f0; padding: 0 24px; display: flex; gap: 8px;">
          <button class="adm-tab-btn" data-tab="overview" style="padding: 12px 16px; border: none; background: transparent; font-size: 13px; font-weight: 600; color: ${activeTab === 'overview' ? '#2563eb' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'overview' ? '#2563eb' : 'transparent'}; cursor: pointer;">
            📊 Overview Stats
          </button>
          <button class="adm-tab-btn" data-tab="students" style="padding: 12px 16px; border: none; background: transparent; font-size: 13px; font-weight: 600; color: ${activeTab === 'students' ? '#2563eb' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'students' ? '#2563eb' : 'transparent'}; cursor: pointer;">
            🎓 Students (${students.length})
          </button>
          <button class="adm-tab-btn" data-tab="teachers" style="padding: 12px 16px; border: none; background: transparent; font-size: 13px; font-weight: 600; color: ${activeTab === 'teachers' ? '#2563eb' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'teachers' ? '#2563eb' : 'transparent'}; cursor: pointer;">
            👨‍🏫 Teachers (${teachers.length})
          </button>
          <button class="adm-tab-btn" data-tab="courses" style="padding: 12px 16px; border: none; background: transparent; font-size: 13px; font-weight: 600; color: ${activeTab === 'courses' ? '#2563eb' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'courses' ? '#2563eb' : 'transparent'}; cursor: pointer;">
            📚 Courses (${courses.length})
          </button>
        </div>

        <!-- Body -->
        <div style="padding: 24px; max-width: 1300px; margin: 0 auto;">
          ${loading ? '<div style="padding: 40px; text-align: center; color: #64748b;">Loading administrative data...</div>' : renderContent()}
        </div>

      </div>
    `;

    bindEvents();
  }

  function renderContent(): string {
    if (activeTab === 'overview') {
      return `
        <!-- KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Total Students</div>
            <div style="font-size: 28px; font-weight: 800; color: #1e293b; margin-top: 6px;">${students.length}</div>
            <div style="font-size: 11px; color: #16a34a; margin-top: 4px;">Active in Fall 2026/2027</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Faculty & Staff</div>
            <div style="font-size: 28px; font-weight: 800; color: #1e293b; margin-top: 6px;">${teachers.length}</div>
            <div style="font-size: 11px; color: #2563eb; margin-top: 4px;">Linked via auth.users</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Active Courses</div>
            <div style="font-size: 28px; font-weight: 800; color: #1e293b; margin-top: 6px;">${courses.length}</div>
            <div style="font-size: 11px; color: #7c3aed; margin-top: 4px;">SUT Dual-Study Curriculum</div>
          </div>
        </div>

        <!-- Quick Actions Banner -->
        <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 700;">Administrator Action Center</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="quick-add-student-btn" style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
              + Register New Student
            </button>
            <button id="quick-add-teacher-btn" style="background: #059669; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
              + Add Faculty Teacher
            </button>
            <button id="quick-add-course-btn" style="background: #7c3aed; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
              + Create Course Code
            </button>
          </div>
        </div>
      `;
    }

    if (activeTab === 'students') {
      return `
        <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 16px; font-weight: 700; margin: 0;">Students Directory (Admin Full Access)</h2>
            <button id="btn-admin-create-student" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              + Add Student
            </button>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                  <th style="padding: 10px;">ID</th>
                  <th style="padding: 10px;">Name</th>
                  <th style="padding: 10px;">Email</th>
                  <th style="padding: 10px;">Status</th>
                  <th style="padding: 10px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((s) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px; font-family: monospace; font-weight: 600;">${s.student_id || s.id.slice(0, 8)}</td>
                    <td style="padding: 10px; font-weight: 600;">${s.first_name} ${s.last_name}</td>
                    <td style="padding: 10px; color: #64748b;">${s.email}</td>
                    <td style="padding: 10px;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${s.status}</span></td>
                    <td style="padding: 10px; text-align: right;">
                      <button class="btn-delete-student" data-id="${s.id}" style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (activeTab === 'teachers') {
      return `
        <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 16px; font-weight: 700; margin: 0;">Faculty & Teaching Staff</h2>
            <button id="btn-admin-invite-teacher" style="background: #059669; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              + Add / Invite Teacher
            </button>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                  <th style="padding: 10px;">Name</th>
                  <th style="padding: 10px;">Email</th>
                  <th style="padding: 10px;">Department</th>
                  <th style="padding: 10px;">Auth Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; font-weight: 600;">Dr. Hend Adel Ahmed Fouad</td>
                  <td style="padding: 10px; color: #64748b;">hend.fouad@sut.edu.eg</td>
                  <td style="padding: 10px;">Field of Electrical Engineering</td>
                  <td style="padding: 10px;"><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">Linked (Teacher Mode)</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; font-weight: 600;">Dr. Tarek Abdel-Azim</td>
                  <td style="padding: 10px; color: #64748b;">tarek.azim@sut.edu.eg</td>
                  <td style="padding: 10px;">Faculty of Information Technology</td>
                  <td style="padding: 10px;"><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">Linked (Advisor)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (activeTab === 'courses') {
      return `
        <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 16px; font-weight: 700; margin: 0;">Courses Catalog</h2>
            <button id="btn-admin-add-course" style="background: #7c3aed; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              + Create Course
            </button>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                  <th style="padding: 10px;">Code</th>
                  <th style="padding: 10px;">Name</th>
                  <th style="padding: 10px;">Credits</th>
                  <th style="padding: 10px; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${courses.map((c) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px; font-weight: 700; color: #4338ca;">${c.code}</td>
                    <td style="padding: 10px; font-weight: 600;">${c.name}</td>
                    <td style="padding: 10px;">${c.credits} CH</td>
                    <td style="padding: 10px; text-align: right;">
                      <button class="btn-delete-course" data-id="${c.id}" style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    return '';
  }

  function bindEvents() {
    container.querySelector('#admin-logout-btn')?.addEventListener('click', onLogout);

    container.querySelectorAll('.adm-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as any;
        if (tab) {
          activeTab = tab;
          render();
        }
      });
    });

    container.querySelector('#quick-add-student-btn')?.addEventListener('click', () => {
      activeTab = 'students';
      render();
    });

    container.querySelector('#quick-add-teacher-btn')?.addEventListener('click', () => {
      activeTab = 'teachers';
      render();
    });

    container.querySelector('#quick-add-course-btn')?.addEventListener('click', () => {
      activeTab = 'courses';
      render();
    });

    // Delete Student
    container.querySelectorAll('.btn-delete-student').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id && confirm('Are you sure you want to delete this student record?')) {
          await deleteStudent(id);
          students = students.filter((s) => s.id !== id);
          render();
        }
      });
    });

    // Delete Course
    container.querySelectorAll('.btn-delete-course').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id && confirm('Delete this course?')) {
          await deleteCourse(id);
          courses = courses.filter((c) => c.id !== id);
          render();
        }
      });
    });
  }

  loadData();
}
