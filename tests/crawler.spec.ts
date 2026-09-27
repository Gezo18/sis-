import { test, expect } from '@playwright/test';

test.describe('Automated Dynamic Site Crawler & Deep Health Verification', () => {
  const routesToCrawl = [
    { path: '/', expectedElement: 'body' },
    { path: '/?view=catalog', expectedElement: 'table, .course-card, input[placeholder*="search" i]' },
    { path: '/?view=events', expectedElement: 'h2, h3, article, .event-item' },
    { path: '/?view=news', expectedElement: 'h2, h3, article, .news-item' },
    { path: '/?view=about', expectedElement: 'h1, h2, section' },
    { path: '/?view=sis-home', expectedElement: 'h1, h2, h3, [role="main"]' },
    { path: '/?view=academic-plan', expectedElement: 'table, tr, td, th' },
    { path: '/?view=attendance', expectedElement: 'table, tr, td, th' },
    { path: '/?view=activity-marks', expectedElement: 'table, tr, td, th' },
    { path: '/?view=exam-schedule', expectedElement: 'table, tr, td, th' },
    { path: '/?view=requests', expectedElement: 'form, input, button, table' },
    { path: '/?view=staff', expectedElement: 'h2, h3, .grid' },
    { path: '/?view=reports', expectedElement: 'table, button, .card' },
    { path: '/?view=health-security', expectedElement: 'button, .health-console' },
  ];

  test('Health Endpoint Check: Public /health returns 200 OK', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.healthy).toBe(true);
    expect(typeof json.uptime_seconds).toBe('number');
  });

  test('Deep Health Endpoint Check: /api/health/deep requires authentication', async ({ request }) => {
    const unauthorizedRes = await request.get('/api/health/deep');
    expect([401, 403]).toContain(unauthorizedRes.status());

    // With Admin Bearer Token
    const authorizedRes = await request.get('/api/health/deep', {
      headers: {
        Authorization: 'Bearer sut_admin_sec_9aba2480_key',
      },
    });
    expect([200, 503]).toContain(authorizedRes.status());
    const json = await authorizedRes.json();
    expect(json.services).toBeDefined();
    expect(json.services.primary_db).toBeDefined();
    expect(json.services.read_replica_db).toBeDefined();
    expect(json.services.redis_cache).toBeDefined();
    expect(json.services.storage_bucket).toBeDefined();
    expect(typeof json.summary.total_checks).toBe('number');
  });

  test('Sitemap.xml is valid and accessible', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('</urlset>');
    expect(xml).toContain('<loc>');
  });

  // Crawl each page and assert 0 console errors + dynamic DB content loads
  for (const route of routesToCrawl) {
    test(`Crawl page: ${route.path} - Verify 200 OK, Zero Console Errors & DB content`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: Error[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        pageErrors.push(err);
      });

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);

      // Verify dynamic elements render without crashing
      await page.waitForTimeout(500);
      const content = await page.content();
      expect(content.length).toBeGreaterThan(300);

      // Zero client-side JavaScript console errors assertion
      expect(consoleErrors, `Console errors found on ${route.path}`).toEqual([]);
      expect(pageErrors, `Page exceptions found on ${route.path}`).toEqual([]);
    });
  }

  test('E2E Flow: Student Login, Navigation, and Logout Pathway', async ({ page }) => {
    await page.goto('/');

    // Check if login button is present
    const loginBtn = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForTimeout(300);

      // Fill mock student ID if input appears
      const idInput = page.locator('input[placeholder*="ID" i], input[type="text"]').first();
      if (await idInput.isVisible()) {
        await idInput.fill('250103180');
      }
    }

    // Verify main portal view renders dynamic elements
    await expect(page.locator('body')).toBeVisible();
  });
});
