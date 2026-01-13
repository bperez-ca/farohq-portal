/**
 * Log Sanitization Utility
 * Redacts sensitive information from logs (tokens, passwords, etc.)
 */

const SENSITIVE_PATTERNS = [
  // JWT tokens (Bearer tokens, Clerk tokens)
  /Bearer\s+[\w\-._~+/]+=*/gi,
  // Authorization headers
  /authorization:\s*[\w\-._~+/]+=*/gi,
  // Token-like strings (long alphanumeric strings)
  /token["\s:=]+([\w\-._~+/]{20,})/gi,
  // Common token field names
  /(?:token|accessToken|refreshToken|sessionToken|authToken|clerkToken|apiKey|secret)["\s:=]+([\w\-._~+/]{10,})/gi,
  // Password fields
  /password["\s:=]+([^\s"']+)/gi,
  // Email addresses (optional - can be enabled if needed)
  // /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
];

const REDACTION_PLACEHOLDER = '[REDACTED]';

/**
 * Sanitize a string by redacting sensitive patterns
 */
export function sanitizeString(str: string): string {
  let sanitized = str;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      // For patterns with capture groups, replace the captured part
      if (match.includes(':')) {
        const [key, ...valueParts] = match.split(':');
        return `${key}: ${REDACTION_PLACEHOLDER}`;
      }
      return REDACTION_PLACEHOLDER;
    });
  }
  
  return sanitized;
}

/**
 * Sanitize an object by recursively redacting sensitive fields
 */
export function sanitizeObject(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle objects
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'token', 'accessToken', 'refreshToken', 'sessionToken', 'authToken',
    'clerkToken', 'apiKey', 'secret', 'password', 'authorization',
    'Authorization', 'x-api-key', 'X-API-Key', 'cookie', 'Cookie',
  ];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Redact sensitive keys entirely
    if (sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()))) {
      sanitized[key] = REDACTION_PLACEHOLDER;
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize error objects for logging
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const sanitized = {
      name: error.name,
      message: sanitizeString(error.message),
      stack: error.stack ? sanitizeString(error.stack) : undefined,
    };
    return JSON.stringify(sanitized, null, 2);
  }
  
  if (typeof error === 'string') {
    return sanitizeString(error);
  }
  
  return sanitizeString(JSON.stringify(error));
}

/**
 * Safe console.error that sanitizes sensitive data
 */
export function safeLogError(message: string, error?: unknown, data?: any): void {
  const sanitizedMessage = sanitizeString(message);
  const sanitizedError = error ? sanitizeError(error) : undefined;
  const sanitizedData = data ? sanitizeObject(data) : undefined;

  if (sanitizedError && sanitizedData) {
    console.error(sanitizedMessage, sanitizedError, sanitizedData);
  } else if (sanitizedError) {
    console.error(sanitizedMessage, sanitizedError);
  } else if (sanitizedData) {
    console.error(sanitizedMessage, sanitizedData);
  } else {
    console.error(sanitizedMessage);
  }
}

/**
 * Safe console.log that sanitizes sensitive data
 */
export function safeLog(message: string, data?: any): void {
  const sanitizedMessage = sanitizeString(message);
  const sanitizedData = data ? sanitizeObject(data) : undefined;

  if (sanitizedData) {
    console.log(sanitizedMessage, sanitizedData);
  } else {
    console.log(sanitizedMessage);
  }
}

/**
 * Safe console.warn that sanitizes sensitive data
 */
export function safeLogWarn(message: string, data?: any): void {
  const sanitizedMessage = sanitizeString(message);
  const sanitizedData = data ? sanitizeObject(data) : undefined;

  if (sanitizedData) {
    console.warn(sanitizedMessage, sanitizedData);
  } else {
    console.warn(sanitizedMessage);
  }
}
