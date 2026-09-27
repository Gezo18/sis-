import { AuthUser, Student } from '../types';
import { getStudents, createStudent, deleteStudent } from '../lib/students';

export function renderStudentsPage(
  container: HTMLElement,
  user: AuthUser,
  onNavigateBack: () => void
): void {
  let students: Student[] = [];
  const isTeacher = user.role === 'teacher';

  async function load() {
    container.innerHTML = `<div style="padding: 24px;">Loading students...</div>`;
    const res = await getStudents(100);
    students = res.data || [];
    render();
  }

  function render() {
    container.innerHTML = `
      <div style="padding: 24px; max-width: 1100px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <button id="btn-back" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0 0 6px;">← Back to Dashboard</button>
            <h1 style="font-size: 20px; font-weight: 700; margin: 0;">Students Directory (${isTeacher ? 'Teacher Mode: Add & View Only' : 'Admin Mode: Full CRUD'})</h1>
          </div>
          <button id="btn-show-add" style="background: #16a34a; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            + Add Student
          </button>
        </div>

        <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                <th style="padding: 10px 14px;">Student ID</th>
                <th style="padding: 10px 14px;">Name</th>
                <th style="padding: 10px 14px;">Email</th>
                <th style="padding: 10px 14px;">Grade Level</th>
                <th style="padding: 10px 14px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((s) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 14px; font-family: monospace;">${s.student_id || s.id.slice(0, 8)}</td>
                  <td style="padding: 10px 14px; font-weight: 600;">${s.first_name} ${s.last_name}</td>
                  <td style="padding: 10px 14px; color: #64748b;">${s.email}</td>
                  <td style="padding: 10px 14px;">${s.grade_level || 'Level 1'}</td>
                  <td style="padding: 10px 14px; text-align: right;">
                    ${isTeacher ? '<span style="color: #64748b; font-size: 11px;">View only</span>' : `<button class="btn-del-stud" data-id="${s.id}" style="background: #fee2e2; color: #dc2626; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer;">Delete</button>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelector('#btn-back')?.addEventListener('click', onNavigateBack);
    container.querySelector('#btn-show-add')?.addEventListener('click', () => {
      const first = prompt('First name:');
      const last = prompt('Last name:');
      const email = prompt('Email:');
      if (first && last && email) {
        createStudent({ first_name: first, last_name: last, email: email }).then(() => load());
      }
    });

    if (!isTeacher) {
      container.querySelectorAll('.btn-del-stud').forEach((b) => {
        b.addEventListener('click', () => {
          const id = b.getAttribute('data-id');
          if (id && confirm('Delete student?')) {
            deleteStudent(id).then(() => load());
          }
        });
      });
    }
  }

  load();
}
