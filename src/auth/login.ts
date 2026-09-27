import { signIn } from './session';
import { AuthUser } from '../types';

export function renderLoginPage(
  container: HTMLElement,
  onSuccess: (user: AuthUser) => void,
  onSwitchToSignup?: () => void
): void {
  container.innerHTML = `
    <div class="staff-login-wrap" style="min-h-screen; display: flex; align-items: center; justify-content: center; background: #eaedf1; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="width: 100%; max-width: 460px; background: white; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #d1d5db;">
        
        <!-- Header Ribbon -->
        <div style="background: linear-gradient(135deg, #1b212f 0%, #293548 100%); color: white; padding: 24px 28px; text-align: center; border-bottom: 4px solid #6fa324;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px;">
            <div style="background: white; border-radius: 8px; padding: 6px 12px; display: inline-flex; align-items: center;">
              <span style="color: #6fa324; font-weight: 900; font-size: 20px; letter-spacing: -0.5px;">SUT</span>
              <span style="color: #1b212f; font-weight: 700; font-size: 13px; margin-left: 6px;">PORTAL</span>
            </div>
          </div>
          <h2 style="font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.2px;">Elsewedy University of Technology</h2>
          <p style="color: #9ca3af; font-size: 12px; margin: 6px 0 0;">Staff & Academic Faculty Portal (staffsis.sut.edu.eg)</p>
        </div>

        <!-- Form Body -->
        <div style="padding: 28px;">
          <div id="login-error-box" style="display: none; background: #fef2f2; border: 1px solid #f87171; color: #b91c1c; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 16px;"></div>

          <form id="staff-login-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Staff Email Address</label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="e.g. hend.fouad@sut.edu.eg"
                value="hend.fouad@sut.edu.eg"
                style="width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              />
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Password</label>
                <span style="font-size: 11px; color: #6fa324; font-weight: 500;">Default: staff123</span>
              </div>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value="staff123"
                style="width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              style="width: 100%; background: #6fa324; hover: background: #5c8b1d; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px;"
            >
              Sign In to Staff SIS
            </button>
          </form>

          <!-- Quick Test / One-Click Access -->
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 0 0 10px; text-align: center;">
              One-Click Role Demonstration
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button
                type="button"
                id="quick-teacher-btn"
                style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;"
              >
                👨‍🏫 Teacher Mode<br/>
                <span style="font-size: 10px; font-weight: 400; color: #15803d;">Dr. Hend Adel Fouad</span>
              </button>
              <button
                type="button"
                id="quick-admin-btn"
                style="background: #f8fafc; border: 1px solid #cbd5e1; color: #1e293b; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;"
              >
                ⚙️ Admin Mode<br/>
                <span style="font-size: 10px; font-weight: 400; color: #475569;">Full SIS CRUD Admin</span>
              </button>
            </div>
          </div>

          <div style="margin-top: 20px; text-align: center;">
            <button
              id="switch-signup-btn"
              type="button"
              style="background: transparent; border: none; color: #4f46e5; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: underline;"
            >
              New Staff Member? Register Teacher Account
            </button>
          </div>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px 24px; text-align: center; font-size: 11px; color: #64748b;">
          Elsewedy University of Technology • Integrated Academic SIS
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector<HTMLFormElement>('#staff-login-form');
  const emailInput = container.querySelector<HTMLInputElement>('#login-email');
  const passwordInput = container.querySelector<HTMLInputElement>('#login-password');
  const errorBox = container.querySelector<HTMLDivElement>('#login-error-box');
  const submitBtn = container.querySelector<HTMLButtonElement>('#login-submit-btn');
  const quickTeacherBtn = container.querySelector<HTMLButtonElement>('#quick-teacher-btn');
  const quickAdminBtn = container.querySelector<HTMLButtonElement>('#quick-admin-btn');
  const switchSignupBtn = container.querySelector<HTMLButtonElement>('#switch-signup-btn');

  if (switchSignupBtn && onSwitchToSignup) {
    switchSignupBtn.addEventListener('click', onSwitchToSignup);
  }

  const handleLoginSubmit = async (email: string, pass: string) => {
    if (!errorBox || !submitBtn) return;
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = 'Verifying credentials...';

    const res = await signIn(email, pass);
    submitBtn.disabled = false;
    submitBtn.innerText = 'Sign In to Staff SIS';

    if (res.data) {
      onSuccess(res.data);
    } else {
      errorBox.innerText = res.error || 'Login failed. Please check your credentials.';
      errorBox.style.display = 'block';
    }
  };

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (emailInput && passwordInput) {
      handleLoginSubmit(emailInput.value, passwordInput.value);
    }
  });

  quickTeacherBtn?.addEventListener('click', () => {
    handleLoginSubmit('hend.fouad@sut.edu.eg', 'staff123');
  });

  quickAdminBtn?.addEventListener('click', () => {
    handleLoginSubmit('admin@sut.edu.eg', 'admin123');
  });
}
