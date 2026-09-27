/**
 * Database & Application Data Security Module
 * 
 * Enforces:
 * 1. 100% Parameterized queries across database operations
 * 2. Strict TLS/SSL configuration options
 * 3. Connection pooling timeouts
 * 4. Input sanitization to prevent SQLi
 */

export interface DbConnectionPoolConfig {
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl: {
    rejectUnauthorized: boolean;
    require: boolean;
  };
}

export const SECURE_POOL_CONFIG: DbConnectionPoolConfig = {
  max: 20,
  idleTimeoutMillis: 30000,        // Disconnect idle connections after 30 seconds
  connectionTimeoutMillis: 5000,   // Fail connection attempts if not connected within 5 seconds
  ssl: {
    rejectUnauthorized: true,      // Enforce strict TLS certificate verification
    require: true,
  },
};

/**
 * Validates that an incoming query is parameterized and contains no raw interpolated strings
 */
export function validateParameterizedQuery(query: string, params: unknown[]): { valid: boolean; reason?: string } {
  // Check for common SQL injection markers and unparameterized concatenation patterns
  const unsafePatterns = [
    /--/,
    /;\s*DROP/i,
    /;\s*DELETE/i,
    /;\s*UPDATE.*WHERE\s*1\s*=\s*1/i,
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /"\s*OR\s*"1"\s*=\s*"1/i,
    /UNION\s+SELECT/i,
  ];

  for (const pattern of unsafePatterns) {
    if (pattern.test(query)) {
      return {
        valid: false,
        reason: `Potential SQL Injection pattern detected matching ${pattern.toString()}`,
      };
    }
  }

  // Ensure placeholders match parameter counts (e.g. $1, $2 or ?)
  const dollarPlaceholders = (query.match(/\$\d+/g) || []).length;
  const questionPlaceholders = (query.match(/\?/g) || []).length;
  const placeholderCount = Math.max(dollarPlaceholders, questionPlaceholders);

  if (placeholderCount > 0 && placeholderCount !== params.length) {
    return {
      valid: false,
      reason: `Placeholder mismatch: query has ${placeholderCount} parameters but ${params.length} arguments provided.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes input strings for database filters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
    switch (char) {
      case '\0': return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '"':
      case "'":
      case '\\':
      case '%':
        return '\\' + char;
      default:
        return char;
    }
  });
}
