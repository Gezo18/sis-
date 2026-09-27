import { AuthUser, CourseItem } from '../types';
import { getCourses, createCourse, deleteCourse } from '../lib/courses';

export function renderCoursesPage(
  container: HTMLElement,
  user: AuthUser,
  onNavigateBack: () => void
): void {
  let courses: CourseItem[] = [];
  const isTeacher = user.role === 'teacher';

  async function load() {
    container.innerHTML = `<div style="padding: 24px;">Loading courses...</div>`;
    const res = await getCourses(100);
    courses = res.data || [];
    render();
  }

  function render() {
    container.innerHTML = `
      <div style="padding: 24px; max-width: 1100px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <button id="btn-back" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0 0 6px;">← Back to Dashboard</button>
            <h1 style="font-size: 20px; font-weight: 700; margin: 0;">Courses Catalog</h1>
          </div>
          ${!isTeacher ? `
            <button id="btn-add-course" style="background: #7c3aed; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;">
              + Create Course
            </button>
          ` : ''}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          ${courses.map((c) => `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 700; color: #4338ca;">${c.code}</span>
                <span style="font-size: 12px; color: #64748b;">${c.credits} Credits</span>
              </div>
              <h3 style="font-size: 14px; margin: 0 0 6px;">${c.name}</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0 0 12px;">${c.description || 'No description provided.'}</p>
              ${!isTeacher ? `<button class="btn-del-course" data-id="${c.id}" style="background: #fee2e2; color: #dc2626; border: none; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Delete</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#btn-back')?.addEventListener('click', onNavigateBack);

    container.querySelector('#btn-add-course')?.addEventListener('click', () => {
      const code = prompt('Course code (e.g. CET442):');
      const name = prompt('Course name:');
      const credits = parseInt(prompt('Credits:') || '3', 10);
      if (code && name) {
        createCourse({ code, name, credits }).then(() => load());
      }
    });

    container.querySelectorAll('.btn-del-course').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        if (id && confirm('Delete course?')) {
          deleteCourse(id).then(() => load());
        }
      });
    });
  }

  load();
}
