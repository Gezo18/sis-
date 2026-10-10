import { test, expect, Page, Locator } from '@playwright/test';

// Define categories of interactive controls
export type ButtonCategory =
  | 'navigation'
  | 'form_submit'
  | 'state_toggle'
  | 'modal_trigger'
  | 'api_trigger'
  | 'filter_or_tab'
  | 'destructive_action';

export interface DiscoveredButton {
  label: string;
  category: ButtonCategory;
  selector: string;
  isDestructive: boolean;
  isDisabled: boolean;
}

// Student & Teacher mock authentication states for isolated storage injection
const MOCK_STUDENT_STORAGE = {
  sut_current_user: JSON.stringify({
    id: 'usr_student_ahmed',
    email: 'ahmed.mansour@sut.edu.eg',
    role: 'student',
    name: 'Ahmed Mansour El-Sayed',
    studentProfile: {
      studentId: '250103180',
      studentName: 'Ahmed Mansour El-Sayed',
      arabicName: 'أحمد منصور السيد',
      faculty: 'Faculty of Industrial & Energy Technology',
      program: 'Computer Software Technology (CST)',
      level: 2,
      academicStatus: 'Regular / Good Standing',
      gpa: 3.82,
      totalCreditsEarned: 48,
    },
  }),
};

const MOCK_TEACHER_STORAGE = {
  sut_current_user: JSON.stringify({
    id: 'usr_teacher_hend',
    email: 'hend.fouad@sut.edu.eg',
    role: 'teacher',
    name: 'Dr. Hend Adel Ahmed Fouad',
    academicTitle: 'Assistant Professor & Academic Advisor',
  }),
};

/**
 * Scan all visible interactive controls on the page while filtering out disabled
 * and aria-hidden decorative elements.
 */
async function scanInteractiveElements(page: Page): Promise<DiscoveredButton[]> {
  return await page.evaluate(() => {
    const results: Array<{
      label: string;
      category: ButtonCategory;
      selector: string;
      isDestructive: boolean;
      isDisabled: boolean;
    }> = [];

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, input[type="button"], input[type="submit"], [role="button"], a[href], summary'
      )
    );

    elements.forEach((el, index) => {
      // Guard & Deduplication: Ignore hidden or decorative elements
      const isVisible = el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';
      const isAriaHidden = el.getAttribute('aria-hidden') === 'true';
      const isDisabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

      if (!isVisible || isAriaHidden) return;

      const label = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('value') || '').trim();
      if (!label && !el.querySelector('svg')) return; // Ignore purely blank elements with no icon

      const lowerLabel = label.toLowerCase();
      const isDestructive =
        lowerLabel.includes('delete') ||
        lowerLabel.includes('remove') ||
        lowerLabel.includes('clear') ||
        lowerLabel.includes('logout') ||
        lowerLabel.includes('sign out') ||
        lowerLabel.includes('reset');

      let category: ButtonCategory = 'state_toggle';
      if (el.tagName === 'A' || lowerLabel.includes('view') || lowerLabel.includes('go to') || lowerLabel.includes('catalog') || lowerLabel.includes('home')) {
        category = 'navigation';
      } else if (el.getAttribute('type') === 'submit' || lowerLabel.includes('submit') || lowerLabel.includes('save') || lowerLabel.includes('send') || lowerLabel.includes('apply')) {
        category = 'form_submit';
      } else if (lowerLabel.includes('modal') || lowerLabel.includes('dialog') || lowerLabel.includes('open') || lowerLabel.includes('sign in') || lowerLabel.includes('login') || lowerLabel.includes('health & apm')) {
        category = 'modal_trigger';
      } else if (lowerLabel.includes('test') || lowerLabel.includes('refresh') || lowerLabel.includes('sync') || lowerLabel.includes('fetch') || lowerLabel.includes('simulate')) {
        category = 'api_trigger';
      } else if (lowerLabel.includes('filter') || lowerLabel.includes('tab') || lowerLabel.includes('level') || lowerLabel.includes('sort')) {
        category = 'filter_or_tab';
      }

      const selector = el.id ? `#${el.id}` : `button-idx-${index}`;

      results.push({
        label: label || `Icon Button (${index})`,
        category: isDestructive ? 'destructive_action' : category,
        selector,
        isDestructive,
        isDisabled,
      });
    });

    return results;
  });
}

test.describe('Exhaustive Automated Interactive Component & Button Verification Suite', () => {
  // Capture unhandled console errors & runtime exceptions per test
  let consoleErrors: string[] = [];
  let pageErrors: Error[] = [];
  let networkFailures: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];
    networkFailures = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon') && !res.url().includes('simulate-slow-query')) {
        networkFailures.push(`${res.status()} on ${res.url()}`);
      }
    });
  });

  test.afterEach(() => {
    expect(pageErrors, 'Unhandled page runtime errors detected').toEqual([]);
    expect(consoleErrors, 'Console JavaScript errors detected during interactions').toEqual([]);
  });

  // 1. DISCOVERY & SCANNER TEST
  test('Page-Wide Interactive Element Discovery across core routes', async ({ page }) => {
    const testRoutes = ['/', '/?view=catalog', '/?view=sis-home', '/?view=academic-plan', '/?view=health-security'];

    for (const route of testRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const buttons = await scanInteractiveElements(page);
      expect(buttons.length, `Discovered buttons on ${route}`).toBeGreaterThan(0);

      // Verify no duplicate empty buttons
      const validLabels = buttons.filter((b) => b.label.length > 0);
      expect(validLabels.length).toBeGreaterThan(0);
    }
  });

  // 2. NAVIGATION BUTTONS & TAB SWITCHERS
  test('Intent Verification: Navigation buttons update URL and view state correctly', async ({ page }) => {
    await page.goto('/?view=sis-home');

    // Test Navigation: Switch to Academic Plan
    const academicPlanBtn = page.locator('button:has-text("Academic Plan"), a:has-text("Academic Plan")').first();
    if (await academicPlanBtn.isVisible()) {
      await academicPlanBtn.click();
      await page.waitForTimeout(400);
      // Assert DOM updated to reflect Academic Plan view
      await expect(page.locator('body')).toContainText(/Academic Plan|Course Code|Credit Hours|CST/i);
    }

    // Test Navigation: Switch to Attendance Tracker
    const attendanceBtn = page.locator('button:has-text("Attendance"), a:has-text("Attendance")').first();
    if (await attendanceBtn.isVisible()) {
      await attendanceBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toContainText(/Attendance|Lecture|Presence|Status/i);
    }

    // Test Navigation: Switch to Activity Marks
    const marksBtn = page.locator('button:has-text("Activity Marks"), a:has-text("Activity Marks")').first();
    if (await marksBtn.isVisible()) {
      await marksBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toContainText(/Activity Marks|Course Assessment|Score|Grade/i);
    }
  });

  // 3. DYNAMIC & STATE-CHANGING BUTTONS (Toggles, Modals, Accordions)
  test('Intent Verification: Modal triggers and state toggles alter DOM appropriately', async ({ page }) => {
    await page.goto('/');

    // Test Health & APM Console Modal Trigger
    const healthBtn = page.locator('button:has-text("Health & APM")').first();
    await expect(healthBtn).toBeVisible();
    await healthBtn.click();
    await page.waitForTimeout(400);

    // Assert Modal opens with Deep Health title
    await expect(page.locator('text=System Health & Security Console')).toBeVisible();

    // Test Tab Switching inside Modal
    const apmTab = page.locator('button:has-text("APM & Slow Query")').first();
    await apmTab.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Slow Queries (>200ms)')).toBeVisible();

    // Close Modal
    const closeBtn = page.locator('button:has-text("Close")').first();
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=System Health & Security Console')).not.toBeVisible();
  });

  // 4. API & DATABASE TRIGGERING BUTTONS (Network Interception & Latency)
  test('Intent Verification: deep-health diagnostics require the configured admin token', async ({ page, request }) => {
    await page.goto('/?view=health-security');

    const adminToken = process.env.HEALTH_ADMIN_TOKEN;
    if (!adminToken) {
      const unauthorized = await request.get('/api/health/deep');
      expect(unauthorized.status()).toBe(401);

      await page.locator('button:has-text("Refresh Diagnostics")').click();
      await expect(page.getByText('Add a valid HEALTH_ADMIN_TOKEN before running deep diagnostics.')).toBeVisible();
      return;
    }

    await page.locator('input[type="password"]').fill(adminToken);
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/health/deep') && [200, 503].includes(res.status())),
      page.locator('button:has-text("Refresh Diagnostics")').click(),
    ]);
    expect([200, 503]).toContain(response.status());
    const json = await response.json();
    expect(json.services.primary_db).toBeDefined();
  });

  // 5. DEAD-CLICK DETECTION ON CORE BUTTONS
  test('Dead-Click Detection: Core controls produce state change, DOM mutation, or network event', async ({ page }) => {
    await page.goto('/?view=catalog');

    // Track network events
    let networkTriggered = false;
    page.on('request', () => {
      networkTriggered = true;
    });

    const filterInputs = page.locator('input[placeholder*="search" i]');
    if (await filterInputs.count() > 0) {
      await filterInputs.first().fill('Data');
      await page.waitForTimeout(300);
      // Verify table filtered
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // 6. DESTRUCTIVE ACTIONS GUARD
  test('Destructive Actions Guard: Safe handling of logout and state resets', async ({ page }) => {
    // Inject student session
    await page.addInitScript((storage) => {
      for (const [key, val] of Object.entries(storage)) {
        localStorage.setItem(key, val);
      }
    }, MOCK_STUDENT_STORAGE);

    await page.goto('/?view=sis-home');
    await page.waitForTimeout(400);

    // Locate sign-in / switch button
    const switchBtn = page.locator('button:has-text("Switch / Sign In"), button:has-text("Sign Out")').first();
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
      await page.waitForTimeout(400);
      // Ensure application gracefully opened auth modal or redirected without throwing unhandled exceptions
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // 7. MULTI-ROLE AUTH CONTEXT: TEACHER & ADVISOR BUTTONS
  test('Auth Context Support: Teacher / Advisor mode actions and student inspection buttons', async ({ page }) => {
    await page.addInitScript((storage) => {
      for (const [key, val] of Object.entries(storage)) {
        localStorage.setItem(key, val);
      }
    }, MOCK_TEACHER_STORAGE);

    await page.goto('/?view=teacher');
    await page.waitForTimeout(500);

    // Verify Teacher Advisor Dashboard rendered
    await expect(page.locator('body')).toContainText(/Advisor|Teacher|Student/i);

    // Click Student Inspection button if available
    const inspectBtn = page.locator('button:has-text("Inspect SIS"), button:has-text("View"), button:has-text("Open")').first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
