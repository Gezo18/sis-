export interface QueryMetric {
  query: string;
  durationMs: number;
  timestamp: string;
  isSlow: boolean;
  status: 'success' | 'timeout' | 'error';
  target: 'primary_db' | 'read_replica' | 'redis' | 'orm_pool' | 'storage';
}

export interface APMAlert {
  id: string;
  type: 'SLOW_QUERY' | 'DB_TIMEOUT_SPIKE' | 'HIGH_LATENCY' | 'CIRCUIT_BREAKER';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: string;
  details: Record<string, unknown>;
}

class APMTrackerService {
  private queryHistory: QueryMetric[] = [];
  private alerts: APMAlert[] = [];
  private totalQueries = 0;
  private slowQueriesCount = 0;
  private timeoutCount = 0;
  private readonly SLOW_QUERY_THRESHOLD_MS = 200;
  private readonly MAX_HISTORY = 100;
  private readonly MAX_ALERTS = 50;

  public recordQuery(
    target: QueryMetric['target'],
    query: string,
    durationMs: number,
    status: 'success' | 'timeout' | 'error' = 'success'
  ): QueryMetric {
    const isSlow = durationMs > this.SLOW_QUERY_THRESHOLD_MS;
    const now = new Date().toISOString();

    const metric: QueryMetric = {
      query,
      durationMs: Math.round(durationMs * 10) / 10,
      timestamp: now,
      isSlow,
      status,
      target,
    };

    this.totalQueries += 1;
    if (isSlow) this.slowQueriesCount += 1;
    if (status === 'timeout') this.timeoutCount += 1;

    this.queryHistory.unshift(metric);
    if (this.queryHistory.length > this.MAX_HISTORY) {
      this.queryHistory.pop();
    }

    // Trigger alert if slow query detected
    if (isSlow) {
      this.triggerAlert({
        type: 'SLOW_QUERY',
        severity: durationMs > 500 ? 'critical' : 'warning',
        message: `Slow Query Detected on ${target}: execution took ${metric.durationMs}ms (threshold: ${this.SLOW_QUERY_THRESHOLD_MS}ms)`,
        details: { target, query, durationMs: metric.durationMs },
      });
    }

    // Trigger alert if timeout occurs
    if (status === 'timeout') {
      this.triggerAlert({
        type: 'DB_TIMEOUT_SPIKE',
        severity: 'critical',
        message: `Database query timeout detected on ${target} after ${metric.durationMs}ms`,
        details: { target, query, durationMs: metric.durationMs },
      });
    }

    return metric;
  }

  public triggerAlert(alert: Omit<APMAlert, 'id' | 'timestamp'>): APMAlert {
    const newAlert: APMAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    console.warn(`[APM-ALERT] [${newAlert.severity.toUpperCase()}] ${newAlert.message}`);
    this.alerts.unshift(newAlert);
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts.pop();
    }
    return newAlert;
  }

  public getMetrics() {
    const durations = this.queryHistory.map(q => q.durationMs).sort((a, b) => a - b);
    const count = durations.length;

    const p50 = count > 0 ? durations[Math.floor(count * 0.5)] : 0;
    const p95 = count > 0 ? durations[Math.floor(count * 0.95)] : 0;
    const p99 = count > 0 ? durations[Math.floor(count * 0.99)] : 0;
    const avg = count > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;

    return {
      totalQueries: this.totalQueries,
      slowQueriesCount: this.slowQueriesCount,
      timeoutCount: this.timeoutCount,
      slowQueryThresholdMs: this.SLOW_QUERY_THRESHOLD_MS,
      percentiles: { p50, p95, p99, avg },
      recentQueries: this.queryHistory.slice(0, 15),
      activeAlerts: this.alerts.slice(0, 10),
      status: this.timeoutCount > 0 ? 'degraded' : this.slowQueriesCount > 5 ? 'warning' : 'optimal',
    };
  }

  public clearMetrics() {
    this.queryHistory = [];
    this.alerts = [];
    this.totalQueries = 0;
    this.slowQueriesCount = 0;
    this.timeoutCount = 0;
  }
}

export const apmTracker = new APMTrackerService();
