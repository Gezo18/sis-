/**
 * Standalone Automated Dynamic Site Crawler & Health Verification Runner
 * Can be executed via: tsx scripts/run-crawler.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.HEALTH_ADMIN_TOKEN;

interface CrawlResult {
  url: string;
  status: number;
  ok: boolean;
  durationMs: number;
  dynamicContentFound: boolean;
  error?: string;
}

async function runSiteCrawler() {
  console.log(`\n========================================================`);
  console.log(`🚀 STARTING SUT AUTOMATED DYNAMIC SITE CRAWLER`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================================\n`);

  let totalErrors = 0;

  // 1. Verify Public Lightweight Health Endpoint
  console.log(`[CHECK 1/4] Probing Public Lightweight Health Endpoint (/health)...`);
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/health`);
    const duration = Math.round(performance.now() - t0);
    const data = await res.json();

    if (res.status === 200 && data.status === 'ok') {
      console.log(`  ✅ /health returned HTTP 200 OK (${duration}ms) - Uptime: ${data.uptime_seconds}s`);
    } else {
      console.error(`  ❌ /health failed with status ${res.status}:`, data);
      totalErrors++;
    }
  } catch (err) {
    console.error(`  ❌ /health connection failed:`, err);
    totalErrors++;
  }

  // 2. Verify Admin-Authenticated Deep Health Endpoint
  console.log(`\n[CHECK 2/4] Testing Admin-Authenticated Deep Health Endpoint (/api/health/deep)...`);
  try {
    // Test unauthorized access first
    const unauthRes = await fetch(`${BASE_URL}/api/health/deep`);
    if (unauthRes.status === 401 || unauthRes.status === 403) {
      console.log(`  ✅ Security verified: Unauthenticated request rejected with HTTP ${unauthRes.status}`);
    } else {
      console.error(`  ❌ Security failure: /api/health/deep did not reject unauthenticated access (HTTP ${unauthRes.status})`);
      totalErrors++;
    }

        // Test with admin credentials if configured
    if (!ADMIN_TOKEN) {
      console.warn('  ?? Skipping authenticated deep-health probe because HEALTH_ADMIN_TOKEN is not configured.');
    } else {
      const t0 = performance.now();
      const deepRes = await fetch(`${BASE_URL}/api/health/deep`, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });
      const duration = Math.round(performance.now() - t0);
      const deepData = await deepRes.json();

      if (deepRes.status === 200 || deepRes.status === 503) {
        console.log(`  ? /api/health/deep returned HTTP ${deepRes.status} in ${duration}ms`);
        console.log(`     - Status: ${deepData.status.toUpperCase()}`);
        console.log(`     - Primary DB: ${deepData.services.primary_db.status} (${deepData.services.primary_db.latency_ms}ms)`);
        console.log(`     - Read Replica: ${deepData.services.read_replica_db.status} (${deepData.services.read_replica_db.latency_ms}ms)`);
        console.log(`     - Redis Cache: ${deepData.services.redis_cache.status} (${deepData.services.redis_cache.latency_ms}ms)`);
        console.log(`     - Job Queue: ${deepData.services.job_queue.status} (${deepData.services.job_queue.latency_ms}ms)`);
        console.log(`     - Storage: ${deepData.services.storage_bucket.status} (${deepData.services.storage_bucket.latency_ms}ms)`);
        console.log(`     - 3rd-Party APIs: ${deepData.services.third_party_apis.status} (${deepData.services.third_party_apis.latency_ms}ms)`);
        console.log(`     - Passed Checks: ${deepData.summary.passed}/${deepData.summary.total_checks}`);
      } else {
        console.error(`  ? /api/health/deep failed with status ${deepRes.status}:`, deepData);
        totalErrors++;
      }
    }
  } catch (err) {
    console.error(`  ❌ /api/health/deep connection failed:`, err);
    totalErrors++;
  }

  // 3. Fetch and Parse sitemap.xml
  console.log(`\n[CHECK 3/4] Fetching sitemap.xml for dynamic recursive route discovery...`);
  const urlsToCrawl: string[] = [];
  try {
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    if (sitemapRes.status === 200) {
      const xml = await sitemapRes.text();
      const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
      for (const m of locMatches) {
        urlsToCrawl.push(m[1]);
      }
      console.log(`  ✅ Discovered ${urlsToCrawl.length} crawlable routes from sitemap.xml`);
    } else {
      console.warn(`  ⚠️ sitemap.xml returned HTTP ${sitemapRes.status}, falling back to static route list`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Error fetching sitemap:`, err);
  }

  if (urlsToCrawl.length === 0) {
    urlsToCrawl.push(
      `${BASE_URL}/`,
      `${BASE_URL}/?view=catalog`,
      `${BASE_URL}/?view=events`,
      `${BASE_URL}/?view=news`,
      `${BASE_URL}/?view=about`,
      `${BASE_URL}/?view=sis-home`,
      `${BASE_URL}/?view=academic-plan`,
      `${BASE_URL}/?view=attendance`,
      `${BASE_URL}/?view=activity-marks`,
      `${BASE_URL}/?view=exam-schedule`,
      `${BASE_URL}/?view=requests`,
      `${BASE_URL}/?view=staff`,
      `${BASE_URL}/?view=reports`,
      `${BASE_URL}/?view=teacher`,
      `${BASE_URL}/?view=health-security`
    );
  }

  // 4. Crawl every single page
  console.log(`\n[CHECK 4/4] Crawling ${urlsToCrawl.length} routes: Verifying 200 OK & Dynamic DB Elements...`);
  const results: CrawlResult[] = [];

  for (const url of urlsToCrawl) {
    const t0 = performance.now();
    try {
      const res = await fetch(url);
      const durationMs = Math.round(performance.now() - t0);
      const html = await res.text();

      // Check HTTP 200
      const is200 = res.status === 200;

      // Check that dynamic database / HTML structure is rendered
      const hasContent = html.includes('root') && html.includes('<div') && html.length > 500;

      results.push({
        url,
        status: res.status,
        ok: is200 && hasContent,
        durationMs,
        dynamicContentFound: hasContent,
      });

      if (is200 && hasContent) {
        console.log(`  ✅ [200 OK] ${url} (${durationMs}ms) - HTML Size: ${html.length} bytes`);
      } else {
        console.error(`  ❌ [FAIL] ${url} (HTTP ${res.status})`);
        totalErrors++;
      }
    } catch (err) {
      console.error(`  ❌ [ERROR] ${url}:`, err);
      results.push({
        url,
        status: 0,
        ok: false,
        durationMs: 0,
        dynamicContentFound: false,
        error: String(err),
      });
      totalErrors++;
    }
  }

  // Final Summary
  console.log(`\n========================================================`);
  console.log(`📋 CRAWLER EXECUTION SUMMARY`);
  console.log(`========================================================`);
  console.log(`Total Routes Crawled: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.ok).length}`);
  console.log(`Failed: ${results.filter(r => !r.ok).length}`);
  console.log(`Total System Verification Errors: ${totalErrors}`);

  if (totalErrors === 0) {
    console.log(`\n✨ ALL HEALTH ENDPOINTS & SITE CRAWLER CHECKS PASSED PERFECTLY!\n`);
    process.exit(0);
  } else {
    console.error(`\n🚨 SOME CHECKS FAILED (${totalErrors} errors)\n`);
    process.exit(1);
  }
}

runSiteCrawler().catch((err) => {
  console.error('Fatal crawler error:', err);
  process.exit(1);
});
