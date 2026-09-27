import { signUpTeacher } from './session';
import { AuthUser } from '../types';

export function renderSignupPage(
  container: HTMLElement,
  onSuccess: (user: AuthUser) => void,
  onSwitchToLogin: () => void
): void {
  container.innerHTML = `
    <div class="staff-signup-wrap" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #eaedf1; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="width: 100%; max-width: 480px; background: white; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db;">
        
        <div style="background: #1b212f; color: white; padding: 22px 28px; text-align: center; border-bottom: 4px solid #6fa324;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Teacher Registration</h2>
          <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0;">Create a new Faculty / Advisor account linked to SUT SIS</p>
        </div>

        <div style="padding: 26px;">
          <div id="signup-error-box" style="display: none; background: #fef2f2; border: 1px solid #f87171; color: #b91c1c; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 16px;"></div>

          <form id="teacher-signup-form" style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase;">First Name</label>
                <input id="signup-firstname" type="text" required placeholder="e.g. Hend" style="width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;" />
              </div>
              <div>
                <label style="display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase;">Last Name</label>
                <input id="signup-lastname" type="text" required placeholder="e.g. Fouad" style="width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;" />
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase;">Institutional Email</label>
              <input id="signup-email" type="email" required placeholder="e.g. name@sut.edu.eg" style="width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;" />
            </div>

            <div>
              <label style="display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase;">Password</label>
              <input id="signup-password" type="password" required minlength="6" placeholder="Min 6 characters" style="width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;" />
            </div>

            <div>
              <label style="display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase;">Department</label>
              <select id="signup-dept" style="width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: white;">
                <option value="Field of Electrical Engineering & Computer Science">Field of Electrical Engineering & Computer Science</option>
                <option value="Faculty of Information Technology">Faculty of Information Technology</option>
                <option value="Artificial Intelligence & Data Science Program">Artificial Intelligence & Data Science Program</option>
                <option value="Engineering Technology Department">Engineering Technology Department</option>
              </select>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              style="width: 100%; background: #6fa324; color: white; border: none; padding: 11px; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 6px;"
            >
              Register & Link to Teachers Table
            </button>
          </form>

          <div style="margin-top: 18px; text-align: center;">
            <button
              id="back-to-login-btn"
              type="button"
              style="background: transparent; border: none; color: #4f46e5; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: underline;"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector<HTMLFormElement>('#teacher-signup-form');
  const errorBox = container.querySelector<HTMLDivElement>('#signup-error-box');
  const submitBtn = container.querySelector<HTMLButtonElement>('#signup-submit-btn');
  const backBtn = container.querySelector<HTMLButtonElement>('#back-to-login-btn');

  backBtn?.addEventListener('click', onSwitchToLogin);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!errorBox || !submitBtn) return;

    const firstName = (container.querySelector<HTMLInputElement>('#signup-firstname')?.value || '').trim();
    const lastName = (container.querySelector<HTMLInputElement>('#signup-lastname')?.value || '').trim();
    const email = (container.querySelector<HTMLInputElement>('#signup-email')?.value || '').trim();
    const password = (container.querySelector<HTMLInputElement>('#signup-password')?.value || '').trim();
    const dept = (container.querySelector<HTMLSelectElement>('#signup-dept')?.value || '').trim();

    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = 'Creating account...';

    const res = await signUpTeacher(email, password, firstName, lastName, dept);
    submitBtn.disabled = false;
    submitBtn.innerText = 'Register & Link to Teachers Table';

    if (res.data) {
      onSuccess(res.data);
    } else {
      errorBox.innerText = res.error || 'Failed to register account.';
      errorBox.style.display = 'block';
    }
  });
}
