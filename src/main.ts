import { getCurrentUser, signOut } from './auth/session';
import { renderLoginPage } from './auth/login';
import { renderSignupPage } from './auth/signup';
import { renderTeacherDashboard } from './pages/teacher-dashboard';
import { renderAdminDashboard } from './pages/admin-dashboard';
import { renderStudentsPage } from './pages/students';
import { renderCoursesPage } from './pages/courses';
import { renderGradesPage } from './pages/grades';
import { AuthUser } from './types';

export class AppRouter {
  private container: HTMLElement;
  private currentUser: AuthUser | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  public async init(): Promise<void> {
    this.currentUser = await getCurrentUser();
    this.handleRoute();
  }

  public async handleRoute(): Promise<void> {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const path = hash.split('?')[0];

    // Auth Guard: if not authenticated, redirect to /login
    if (!this.currentUser) {
      if (path === '/signup') {
        renderSignupPage(
          this.container,
          (user) => {
            this.currentUser = user;
            this.navigate('/dashboard');
          },
          () => this.navigate('/login')
        );
        return;
      }

      renderLoginPage(
        this.container,
        (user) => {
          this.currentUser = user;
          this.navigate('/dashboard');
        },
        () => this.navigate('/signup')
      );
      return;
    }

    // Authenticated Routes
    if (path === '/login') {
      this.navigate('/dashboard');
      return;
    }

    if (path === '/dashboard') {
      if (this.currentUser.role === 'teacher') {
        renderTeacherDashboard(this.container, this.currentUser, () => this.handleLogout());
      } else {
        renderAdminDashboard(this.container, this.currentUser, () => this.handleLogout());
      }
      return;
    }

    if (path === '/students') {
      renderStudentsPage(this.container, this.currentUser, () => this.navigate('/dashboard'));
      return;
    }

    if (path === '/courses') {
      renderCoursesPage(this.container, this.currentUser, () => this.navigate('/dashboard'));
      return;
    }

    if (path === '/grades') {
      renderGradesPage(this.container, this.currentUser, () => this.navigate('/dashboard'));
      return;
    }

    // Default route
    this.navigate('/dashboard');
  }

  public navigate(path: string): void {
    window.location.hash = path;
  }

  public async handleLogout(): Promise<void> {
    await signOut();
    this.currentUser = null;
    this.navigate('/login');
  }
}

// Global initialization function
export async function init(containerId = 'app'): Promise<void> {
  const el = document.getElementById(containerId) || document.getElementById('root');
  if (el) {
    const router = new AppRouter(el);
    await router.init();
  }
}
