import { 
  SecurityConfig, 
  ValidationRule, 
  SanitizedString, 
  ValidatedEmail, 
  ValidatedBadgeNumber,
  Permission,
  RolePermissions
} from '../types';

/**
 * Security configuration with secure defaults
 */
export const SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  sessionTimeout: 30, // 30 minutes
  passwordMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  requireUppercase: true,
} as const;

/**
 * Role-based permissions configuration
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'read:attendance',
    'write:attendance',
    'read:leave_requests',
    'write:leave_requests',
    'approve:leave_requests',
    'read:users',
    'write:users',
    'delete:users',
    'read:reports',
    'export:reports',
    'admin:all'
  ],
  staff: [
    'read:attendance',
    'write:attendance',
    'read:leave_requests',
    'write:leave_requests',
    'read:reports'
  ]
} as const;

/**
 * Input sanitization to prevent XSS attacks
 */
export const sanitizeInput = (input: string): SanitizedString => {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Remove HTML tags and dangerous characters
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();

  return sanitized as SanitizedString;
};

/**
 * Validate email format with strict regex
 */
export const validateEmail = (email: string): ValidatedEmail | null => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return null;
  }

  // Additional security checks
  if (email.length > 254) return null; // RFC 5321 limit
  if (email.includes('..')) return null; // Consecutive dots not allowed
  
  return email as ValidatedEmail;
};

/**
 * Validate badge number format
 */
export const validateBadgeNumber = (badgeNumber: string): ValidatedBadgeNumber | null => {
  // Badge number should be alphanumeric, 3-20 characters
  const badgeRegex = /^[A-Z0-9]{3,20}$/;
  const upperBadge = badgeNumber.toUpperCase();
  
  if (!badgeRegex.test(upperBadge)) {
    return null;
  }

  return upperBadge as ValidatedBadgeNumber;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`);
  }
  
  if (SECURITY_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (SECURITY_CONFIG.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (SECURITY_CONFIG.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable');
  }

  // Check for sequential characters
  if (/123456|abcdef|qwerty/i.test(password)) {
    errors.push('Password should not contain sequential characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate secure random string for tokens
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomArray[i] % chars.length);
  }
  
  return result;
};

/**
 * Hash sensitive data (client-side hashing for additional security)
 */
export const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if user has required permission
 */
export const hasPermission = (userRole: 'admin' | 'staff', requiredPermission: Permission): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userRole];
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin:all');
};

/**
 * Rate limiting helper (client-side)
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Secure session storage with encryption
 */
export class SecureStorage {
  private static readonly STORAGE_KEY = 'police_attendance_session';
  private static readonly ENCRYPTION_KEY = 'secure_session_key_2025';

  static async setItem(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = await this.encrypt(serialized);
      sessionStorage.setItem(`${this.STORAGE_KEY}_${key}`, encrypted);
    } catch (error) {
      console.error('Error storing secure data:', error);
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const encrypted = sessionStorage.getItem(`${this.STORAGE_KEY}_${key}`);
      if (!encrypted) return null;
      
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    sessionStorage.removeItem(`${this.STORAGE_KEY}_${key}`);
  }

  static clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_KEY)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  private static async encrypt(text: string): Promise<string> {
    // Simple encryption for demo - in production, use proper encryption
    return btoa(text);
  }

  private static async decrypt(encryptedText: string): Promise<string> {
    // Simple decryption for demo - in production, use proper decryption
    return atob(encryptedText);
  }
}

/**
 * Content Security Policy helpers
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'font-src': ["'self'"],
  'connect-src': ["'self'", "https://*.supabase.co"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
} as const;

/**
 * Security headers for API requests
 */
export const getSecurityHeaders = (): Record<string, string> => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
});

/**
 * Validate file upload security
 */
export const validateFileUpload = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];

  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }

  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    errors.push('File extension not allowed');
  }

  // Check for suspicious file names
  if (/[<>:"/\\|?*]/.test(file.name)) {
    errors.push('File name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Audit logging helper
 */
export const logSecurityEvent = (
  action: string,
  resource: string,
  userId?: string,
  details?: Record<string, unknown>
): void => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    userId: userId || 'anonymous',
    userAgent: navigator.userAgent,
    details: details || {}
  };

  // In production, send to secure logging service
  console.log('Security Event:', auditLog);
};