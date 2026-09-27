import { AuthUser, Grade } from '../types';

export function renderGradesPage(
  container: HTMLElement,
  user: AuthUser,
  onNavigateBack: () => void
): void {
  const isTeacher = user.role === 'teacher';

  container.innerHTML = `
    <div style="padding: 24px; max-width: 1100px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <button id="btn-back" style="background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0 0 6px;">← Back to Dashboard</button>
          <h1 style="font-size: 20px; font-weight: 700; margin: 0;">Grade Management (${isTeacher ? 'My Courses Only' : 'All Courses'})</h1>
        </div>
        <button id="btn-add-grade" style="background: #16a34a; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;">
          + Record New Grade
        </button>
      </div>

      <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 10px 14px;">Student Name</th>
              <th style="padding: 10px 14px;">Course</th>
              <th style="padding: 10px 14px;">Assessment</th>
              <th style="padding: 10px 14px; text-align: center;">Score</th>
              <th style="padding: 10px 14px;">Date Recorded</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: 600;">Mohaned Ehab Rady</td>
              <td style="padding: 10px 14px;">CET442 - Selected Topic</td>
              <td style="padding: 10px 14px;">Midterm Exam</td>
              <td style="padding: 10px 14px; text-align: center; color: #16a34a; font-weight: bold;">18.5 / 20.0</td>
              <td style="padding: 10px 14px; color: #64748b;">2026-09-20</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: 600;">Salma Ahmed Abdelhamid</td>
              <td style="padding: 10px 14px;">CET442 - Selected Topic</td>
              <td style="padding: 10px 14px;">Midterm Exam</td>
              <td style="padding: 10px 14px; text-align: center; color: #16a34a; font-weight: bold;">20.0 / 20.0</td>
              <td style="padding: 10px 14px; color: #64748b;">2026-09-20</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: 600;">Bakhorn Hany Mounir</td>
              <td style="padding: 10px 14px;">CET442 - Selected Topic</td>
              <td style="padding: 10px 14px;">Lab Practical</td>
              <td style="padding: 10px 14px; text-align: center; color: #16a34a; font-weight: bold;">19.0 / 20.0</td>
              <td style="padding: 10px 14px; color: #64748b;">2026-09-22</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#btn-back')?.addEventListener('click', onNavigateBack);
  container.querySelector('#btn-add-grade')?.addEventListener('click', () => {
    alert('Grade submission dialog opened. Select student and input marks.');
  });
}
