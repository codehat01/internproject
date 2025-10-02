// Database Types
export interface Profile {
  id: string;
  full_name: string;
  badge_number: string;
  role: 'admin' | 'staff'; // Updated to match database values
  rank?: string;
  station_id: string;
  phone?: string;
  department?: string;
  email?: string; // Add email field
  avatar_url?: string; // optional avatar image url
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  punch_type: 'in' | 'out';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  profiles?: Profile;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  attachment_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  admin_reason?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  approved_by_profile?: Profile;
}

// Application Types
export interface User {
  id: string;
  badge_number: string;
  full_name: string;
  role: 'admin' | 'staff';
  rank?: string;
  station_id?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export interface LoginFormData {
  badgeId: string;
  password: string;
}

export interface LeaveFormData {
  startDate: string;
  endDate: string;
  reason: string;
  file: File | null;
}

export interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkingDays: number;
}

export interface DashboardStats {
  totalStaff: number;
  presentToday: number;
  pendingLeaves: number;
  approvedThisMonth: number;
}

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  show: boolean;
}

// Component Props Types
export interface LoginProps {
  onLogin: (user: User) => void;
}

export interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export interface AdminDashboardProps {
  user: User;
}

export interface StaffDashboardProps {
  user: User;
}

export interface AttendanceViewProps {
  user: User;
}

export interface LeaveRequestViewProps {
  user: User;
}

export interface UserManagementProps {}

// API Response Types
export interface AuthResponse {
  user: any; // Supabase User type
  profile: Profile;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Form Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

// Location Types
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  is_active: boolean;
  created_at: string;
}

// Chart Data Types
export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// Table Types
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

// Status Types
export type AttendanceStatus = 'Present' | 'Late' | 'Absent';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type PunchType = 'in' | 'out';
export type UserRole = 'admin' | 'user';
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Environment Types
export interface EnvironmentConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Supabase Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: any | null;
}

// Event Handler Types
export type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;
export type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
export type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

// Security Types
export interface SecurityConfig {
  maxLoginAttempts: number;
  sessionTimeout: number; // in minutes
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

// Input Validation Types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface FormValidation {
  [key: string]: ValidationRule[];
}

// Error Handling Types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  path: string;
}

// Permission Types
export type Permission = 
  | 'read:attendance'
  | 'write:attendance'
  | 'read:leave_requests'
  | 'write:leave_requests'
  | 'approve:leave_requests'
  | 'read:users'
  | 'write:users'
  | 'delete:users'
  | 'read:reports'
  | 'export:reports'
  | 'admin:all';

export interface RolePermissions {
  admin: Permission[];
  staff: Permission[];
}

// Data Sanitization Types
export type SanitizedString = string & { __brand: 'sanitized' };
export type ValidatedEmail = string & { __brand: 'validatedEmail' };
export type ValidatedBadgeNumber = string & { __brand: 'validatedBadgeNumber' };

// Rate Limiting Types
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

// Session Types
export interface SessionData {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  loginTime: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

// Encryption Types
export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
}

// File Upload Security Types
export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  scanForMalware: boolean;
}

export interface SecureFileUpload {
  file: File;
  hash: string;
  scanResult?: 'clean' | 'infected' | 'pending';
  uploadedBy: string;
  uploadedAt: string;
}