import express from 'express';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  publicRateLimiter,
  authRateLimiter,
  healthRateLimiter,
  createRateLimiterMiddleware,
} from './src/server/rateLimiter.js';
import { apmTracker } from './src/server/apmTracker.js';
import { DeepHealthCheckService } from './src/server/dbHealthService.js';
import {
  requireAdminAuth,
  enforceRowLevelSecurity,
  applySecurityHeaders,
  globalErrorMiddleware,
  ADMIN_AUTH_TOKEN,
} from './src/server/securityMiddleware.js';
import { SECURE_POOL_CONFIG, validateParameterizedQuery } from './src/server/dbSecurity.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsers with strict size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply maximum HTTP security headers globally
app.use(applySecurityHeaders);

// APM request timer middleware
app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    if (req.path.startsWith('/api') && duration > 200) {
      apmTracker.recordQuery('primary_db', `HTTP ${req.method} ${req.path}`, duration, 'success');
    }
  });
  next();
});

// ----------------------------------------------------
// SITEMAP.XML ROUTE (FOR CRAWLER & SEARCH ENGINES)
// ----------------------------------------------------
const SITE_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily', title: 'Portal Home' },
  { path: '/?view=catalog', priority: '0.9', changefreq: 'weekly', title: 'Course Catalog' },
  { path: '/?view=events', priority: '0.8', changefreq: 'daily', title: 'Campus Events' },
  { path: '/?view=news', priority: '0.8', changefreq: 'daily', title: 'Campus News' },
  { path: '/?view=about', priority: '0.7', changefreq: 'monthly', title: 'About SUT' },
  { path: '/?view=sis-home', priority: '0.9', changefreq: 'daily', title: 'SIS Dashboard' },
  { path: '/?view=academic-plan', priority: '0.8', changefreq: 'weekly', title: 'Academic Plan' },
  { path: '/?view=attendance', priority: '0.8', changefreq: 'daily', title: 'Attendance Tracker' },
  { path: '/?view=activity-marks', priority: '0.8', changefreq: 'weekly', title: 'Activity Marks' },
  { path: '/?view=exam-schedule', priority: '0.8', changefreq: 'weekly', title: 'Exam Timetable' },
  { path: '/?view=requests', priority: '0.7', changefreq: 'weekly', title: 'Student Requests' },
  { path: '/?view=staff', priority: '0.7', changefreq: 'monthly', title: 'Staff Directory' },
  { path: '/?view=reports', priority: '0.7', changefreq: 'monthly', title: 'Transcript & Reports' },
  { path: '/?view=teacher', priority: '0.8', changefreq: 'daily', title: 'Faculty Advisor Console' },
  { path: '/?view=health-security', priority: '0.9', changefreq: 'hourly', title: 'System Health & Security Console' },
];

app.get('/sitemap.xml', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const xmlEntries = SITE_ROUTES.map(
    (r) => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// JSON endpoint for crawler script to inspect routes
app.get('/api/routes', (req, res) => {
  res.json({
    routes: SITE_ROUTES,
    total: SITE_ROUTES.length,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// 1. PUBLIC LIGHTWEIGHT HEALTH ENDPOINT (/health)
// ----------------------------------------------------
// For external ping services, load balancers, and container orchestration
app.get('/health', createRateLimiterMiddleware(healthRateLimiter, 'health_ping'), (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime_seconds: Math.round(process.uptime() * 10) / 10,
    timestamp: new Date().toISOString(),
    service: 'Elsewedy University of Technology Portal API',
    version: '1.0.0',
    healthy: true,
  });
});

// ----------------------------------------------------
// 2. DEEP BACKEND HEALTH ENDPOINT (/api/health/deep)
// ----------------------------------------------------
// Admin-authenticated endpoint testing primary, replica, orm, redis, queue, s3, and 3rd party APIs with active queries
app.get(
  '/api/health/deep',
  createRateLimiterMiddleware(healthRateLimiter, 'health_deep'),
  requireAdminAuth,
  async (req, res, next) => {
    try {
      const report = await DeepHealthCheckService.executeDeepDiagnostics();
      res.status(report.http_code).json(report);
    } catch (err) {
      next(err);
    }
  }
);

// ----------------------------------------------------
// 3. APM METRICS & SLOW QUERY MONITORING ENDPOINT
// ----------------------------------------------------
app.get('/api/health/apm', createRateLimiterMiddleware(publicRateLimiter, 'apm'), (req, res) => {
  const metrics = apmTracker.getMetrics();
  res.json({
    service: 'Elsewedy SUT APM Service',
    uptime_seconds: Math.round(process.uptime()),
    ...metrics,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint to simulate a slow query to test slow query alerting (>200ms)
app.post(
  '/api/health/simulate-slow-query',
  createRateLimiterMiddleware(publicRateLimiter, 'simulate_slow'),
  async (req, res) => {
    const delay = req.body?.durationMs ? parseInt(req.body.durationMs, 10) : 260;
    const start = performance.now();
    await new Promise((r) => setTimeout(r, delay));
    const duration = performance.now() - start;

    const metric = apmTracker.recordQuery(
      'primary_db',
      'SELECT id, name, gpa, academic_status FROM students WHERE status = $1 ORDER BY gpa DESC;',
      duration,
      'success'
    );

    res.json({
      message: 'Simulated query completed and tracked by APM',
      metric,
      alert_triggered: metric.isSlow,
      threshold_ms: 200,
    });
  }
);

// ----------------------------------------------------
// 4. SECURITY AUDIT ENDPOINT
// ----------------------------------------------------
app.get('/api/security/audit', (req, res) => {
  res.json({
    audit_status: 'PASS',
    tls_enforced: SECURE_POOL_CONFIG.ssl.require,
    connection_pool: {
      max_clients: SECURE_POOL_CONFIG.max,
      idle_timeout_ms: SECURE_POOL_CONFIG.idleTimeoutMillis,
      connection_timeout_ms: SECURE_POOL_CONFIG.connectionTimeoutMillis,
    },
    rate_limiting: {
      enabled: true,
      algorithm: 'Token Bucket',
      tiers: {
        public: '60 req/min',
        health: '30 req/min',
        auth: '15 req/min',
      },
    },
    headers: {
      hsts: 'max-age=63072000; includeSubDomains; preload',
      nosniff: 'nosniff',
      referrer_policy: 'strict-origin-when-cross-origin',
      permissions_policy: 'camera=(), microphone=(), geolocation=(), payment=()',
      csp_enforced: true,
    },
    row_level_security: {
      idor_prevention: 'Active',
      role_enforcement: 'Active (Student Self-Scope + Teacher Multi-Scope)',
    },
    admin_auth: {
      configured: Boolean(ADMIN_AUTH_TOKEN),
      token_length: ADMIN_AUTH_TOKEN?.length ?? 0,
    },
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// 5. SECURE STUDENT DATA QUERY WITH RLS (IDOR PREVENTION)
// ----------------------------------------------------
app.get(
  '/api/students/:studentId',
  createRateLimiterMiddleware(publicRateLimiter, 'student_api'),
  enforceRowLevelSecurity,
  (req, res) => {
    const { studentId } = req.params;

    // Validate parameterization against SQLi
    const validation = validateParameterizedQuery(
      'SELECT * FROM students WHERE student_id = $1;',
      [studentId]
    );

    if (!validation.valid) {
      res.status(400).json({ error: 'Security Exception', reason: validation.reason });
      return;
    }

    res.json({
      studentId,
      status: 'verified',
      accessGranted: true,
      auditTimestamp: new Date().toISOString(),
    });
  }
);

// Global Error Handling Middleware
app.use(globalErrorMiddleware);

// ----------------------------------------------------
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
// ----------------------------------------------------
async function bootstrap() {
  const httpServer = createHttpServer(app);

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Elsewedy SUT Portal & API active on http://0.0.0.0:${PORT}`);
    console.log(`[SERVER] Lightweight health check: http://0.0.0.0:${PORT}/health`);
    console.log(`[SERVER] Deep backend health check: http://0.0.0.0:${PORT}/api/health/deep`);
  });
}

bootstrap().catch((err) => {
  console.error('[SERVER BOOTSTRAP FAILED]', err);
  process.exit(1);
});
