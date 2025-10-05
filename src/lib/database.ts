import { supabase } from './supabase';
import type { 
  AttendanceRecord, 
  LeaveRequest, 
  Profile, 
  DashboardStats, 
  AttendanceSummary,
  PunchType,
  LeaveStatus
} from '../types';

export interface EnhancedPunchData {
  shiftId?: string;
  complianceStatus?: string;
  gracePeriodUsed?: boolean;
  minutesLate?: number;
  minutesEarly?: number;
  overtimeMinutes?: number;
  isWithinGeofence?: boolean;
  geofenceId?: string;
}

export const punchInOut = async (
  userId: string,
  punchType: PunchType,
  latitude?: number,
  longitude?: number,
  photoUrl?: string,
  enhancedData?: EnhancedPunchData
): Promise<AttendanceRecord> => {
  try {
    const insertData: any = {
      user_id: userId,
      punch_type: punchType,
      latitude: latitude || null,
      longitude: longitude || null,
      photo_url: photoUrl || null,
      status: 'active' as const,
    };

    if (enhancedData) {
      if (enhancedData.shiftId) insertData.shift_id = enhancedData.shiftId;
      if (enhancedData.complianceStatus) insertData.compliance_status = enhancedData.complianceStatus;
      if (enhancedData.gracePeriodUsed !== undefined) insertData.grace_period_used = enhancedData.gracePeriodUsed;
      if (enhancedData.minutesLate !== undefined) insertData.minutes_late = enhancedData.minutesLate;
      if (enhancedData.minutesEarly !== undefined) insertData.minutes_early = enhancedData.minutesEarly;
      if (enhancedData.overtimeMinutes !== undefined) insertData.overtime_minutes = enhancedData.overtimeMinutes;
      if (enhancedData.isWithinGeofence !== undefined) insertData.is_within_geofence = enhancedData.isWithinGeofence;
      if (enhancedData.geofenceId) insertData.geofence_id = enhancedData.geofenceId;
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create attendance record');
    }

    return data;
  } catch (error) {
    console.error('Error punching in/out:', error);
    throw error;
  }
};

export const getUserAttendance = async (
  userId: string, 
  limit: number = 10
): Promise<(AttendanceRecord & { profiles: Profile })[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user attendance:', error);
    throw error;
  }
};

export const getAllAttendanceLogs = async (
  limit: number = 50
): Promise<(AttendanceRecord & { profiles: Profile })[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        profiles!inner(*)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting all attendance logs:', error);
    throw error;
  }
};

// Leave request functions
export const submitLeaveRequest = async (
  userId: string,
  startDate: string,
  endDate: string,
  reason: string,
  attachmentUrl?: string
): Promise<LeaveRequest> => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([{
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        attachment_url: attachmentUrl || null,
        status: 'pending' as const
      }] as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create leave request');
    }

    return data;
  } catch (error) {
    console.error('Error submitting leave request:', error);
    throw error;
  }
};

export const getUserLeaveRequests = async (
  userId: string
): Promise<(LeaveRequest & { approved_by_profile?: Profile })[]> => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        approved_by_profile:profiles!leave_requests_approver_id_fkey(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user leave requests:', error);
    throw error;
  }
};

export const getAllLeaveRequests = async (): Promise<(LeaveRequest & { 
  profiles: Profile;
  approved_by_profile?: Profile;
})[]> => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        profiles!leave_requests_user_id_fkey(*),
        approved_by_profile:profiles!leave_requests_approver_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting all leave requests:', error);
    throw error;
  }
};

export const updateLeaveRequestStatus = async (
  requestId: string,
  status: LeaveStatus,
  adminReason?: string,
  approvedBy?: string
): Promise<LeaveRequest> => {
  try {
    const updateData: Partial<LeaveRequest> = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (adminReason) {
      updateData.admin_reason = adminReason;
    }

    if (approvedBy) {
      updateData.approved_by = approvedBy;
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updateData as any)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to update leave request');
    }

    return data as LeaveRequest;
  } catch (error) {
    console.error('Error updating leave request status:', error);
    throw error;
  }
};

// Profile functions
export const getAllProfiles = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        department
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting all profiles:', error);
    throw error;
  }
};

export const createProfile = async (profileData: Partial<Profile>): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData] as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create profile');
    }

    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

export const updateProfile = async (
  userId: string, 
  updateData: Partial<Profile>
): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to update profile');
    }

    return data as Profile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total staff count
    const { count: totalStaff, error: staffError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (staffError) throw staffError;

    // Get today's attendance count
    const today = new Date().toISOString().split('T')[0];
    const { count: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('punch_type', 'in')
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`);

    if (attendanceError) throw attendanceError;

    // Get pending leave requests count
    const { count: pendingLeaves, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (leaveError) throw leaveError;

    // Get this month's approved leaves
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const { count: approvedLeaves, error: approvedError } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('created_at', startOfMonth.toISOString());

    if (approvedError) throw approvedError;

    return {
      totalStaff: totalStaff || 0,
      presentToday: todayAttendance || 0,
      pendingLeaves: pendingLeaves || 0,
      approvedThisMonth: approvedLeaves || 0
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

// Get attendance summary for a user
export const getUserAttendanceSummary = async (userId: string): Promise<AttendanceSummary> => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    
    // Get this month's attendance
    const { data: monthlyAttendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startOfMonth.toISOString());

    if (error) throw error;

    // Calculate stats
    const punchIns = (monthlyAttendance || []).filter(record => (record as any).punch_type === 'in');
    const presentDays = punchIns.length;
    
    // Calculate working days in month (assuming 22 working days)
    const totalWorkingDays = 22;
    const absentDays = Math.max(0, totalWorkingDays - presentDays);
    
    // Calculate late days (assuming 9:00 AM is the standard time)
    const lateDays = punchIns.filter(record => {
      const punchTime = new Date((record as any).timestamp);
      const standardTime = new Date(punchTime);
      standardTime.setHours(9, 0, 0, 0);
      return punchTime > standardTime;
    }).length;

    return {
      presentDays,
      absentDays,
      lateDays,
      totalWorkingDays
    };
  } catch (error) {
    console.error('Error getting user attendance summary:', error);
    throw error;
  }
};

// Utility functions
export const calculateWorkingHours = (timeIn: string, timeOut: string): number => {
  const timeInDate = new Date(timeIn);
  const timeOutDate = new Date(timeOut);
  const diffMs = timeOutDate.getTime() - timeInDate.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
};

export const isLateArrival = (timestamp: string, standardTime: string = '09:00'): boolean => {
  const punchTime = new Date(timestamp);
  const [hours, minutes] = standardTime.split(':').map(Number);
  const standard = new Date(punchTime);
  standard.setHours(hours, minutes, 0, 0);
  return punchTime > standard;
};

export const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};