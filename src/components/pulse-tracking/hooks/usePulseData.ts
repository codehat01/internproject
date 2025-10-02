import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Profile, AttendanceRecord, LeaveRequest } from '../../../types';

export interface PulseUser extends Profile {
  status: 'On Duty' | 'On Leave' | 'Absent';
  lastSeen?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  };
}

export interface AttendanceStats {
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  hoursWorked: number;
  status: 'Present' | 'Late' | 'Absent';
}

export const usePulseUsers = () => {
  const [users, setUsers] = useState<PulseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();

    const attendanceChannel = supabase
      .channel('attendance_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchUsers();
      })
      .subscribe();

    const locationChannel = supabase
      .channel('location_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, () => {
        fetchUsers();
      })
      .subscribe();

    const leaveChannel = supabase
      .channel('leave_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(locationChannel);
      supabase.removeChannel(leaveChannel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profileError) throw profileError;

      // Get today's attendance for status
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('user_id, punch_type, timestamp')
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`);

      if (attendanceError) throw attendanceError;

      // Get active leave requests
      const { data: activeLeaves, error: leaveError } = await supabase
        .from('leave_requests')
        .select('user_id, status, start_date, end_date')
        .eq('status', 'approved')
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (leaveError) throw leaveError;

      // Get latest locations for all users
      const { data: locations, error: locationError } = await supabase
        .from('user_locations')
        .select('user_id, latitude, longitude, accuracy, timestamp')
        .eq('is_active', true);

      if (locationError) throw locationError;

      // Process users with status and location
      const processedUsers: PulseUser[] = profiles?.map(profile => {
        // Check if on leave
        const onLeave = activeLeaves?.some(leave => leave.user_id === profile.id);
        if (onLeave) {
          return {
            ...profile,
            status: 'On Leave' as const
          };
        }

        // Check attendance status
        const userAttendance = todayAttendance?.filter(att => att.user_id === profile.id);
        const hasPunchedIn = userAttendance?.some(att => att.punch_type === 'in');
        const hasPunchedOut = userAttendance?.some(att => att.punch_type === 'out');

        let status: 'On Duty' | 'On Leave' | 'Absent' = 'Absent';
        if (hasPunchedIn && !hasPunchedOut) {
          status = 'On Duty';
        } else if (hasPunchedIn && hasPunchedOut) {
          status = 'Absent';
        }

        // Get user's current location
        const userLocation = locations?.find(loc => loc.user_id === profile.id);

        return {
          ...profile,
          status,
          lastSeen: userAttendance?.[userAttendance.length - 1]?.timestamp,
          currentLocation: userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            accuracy: userLocation.accuracy || undefined,
            timestamp: userLocation.timestamp
          } : undefined
        };
      }) || [];

      setUsers(processedUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, refetch: fetchUsers };
};

export const usePulseUserDetail = (badgeNumber: string) => {
  const [user, setUser] = useState<PulseUser | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (badgeNumber) {
      fetchUserDetail();

      const attendanceChannel = supabase
        .channel(`user_attendance_${badgeNumber}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          fetchUserDetail();
        })
        .subscribe();

      const locationChannel = supabase
        .channel(`user_location_${badgeNumber}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, () => {
          fetchUserDetail();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(attendanceChannel);
        supabase.removeChannel(locationChannel);
      };
    }
  }, [badgeNumber]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('User not found');

      // Get last 7 days attendance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .gte('timestamp', sevenDaysAgo.toISOString())
        .order('timestamp', { ascending: true });

      if (attendanceError) throw attendanceError;

      // Get leave requests
      const { data: leaves, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          approved_by_profile:profiles!leave_requests_approver_id_fkey(full_name)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (leaveError) throw leaveError;

      // Get current location
      const { data: locationData, error: locationError } = await supabase
        .from('user_locations')
        .select('latitude, longitude, accuracy, timestamp')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (locationError) console.error('Location fetch error:', locationError);

      // Process attendance stats
      const stats: AttendanceStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayAttendance = attendance?.filter(att =>
          att.timestamp.startsWith(dateStr)
        ) || [];

        const punchIn = dayAttendance.find(att => att.punch_type === 'in');
        const punchOut = dayAttendance.find(att => att.punch_type === 'out');

        let hoursWorked = 0;
        let status: 'Present' | 'Late' | 'Absent' = 'Absent';

        if (punchIn && punchOut) {
          const inTime = new Date(punchIn.timestamp);
          const outTime = new Date(punchOut.timestamp);
          hoursWorked = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);

          const nineAM = new Date(inTime);
          nineAM.setHours(9, 0, 0, 0);
          status = inTime > nineAM ? 'Late' : 'Present';
        } else if (punchIn) {
          status = 'Present';
        }

        stats.push({
          date: dateStr,
          punchIn: punchIn?.timestamp || null,
          punchOut: punchOut?.timestamp || null,
          hoursWorked,
          status
        });
      }

      // Determine current status
      const today = new Date().toISOString().split('T')[0];
      const todayStats = stats.find(s => s.date === today);
      let currentStatus: 'On Duty' | 'On Leave' | 'Absent' = 'Absent';

      if (todayStats?.punchIn && !todayStats?.punchOut) {
        currentStatus = 'On Duty';
      }

      setUser({
        ...profile,
        status: currentStatus,
        currentLocation: locationData ? {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy || undefined,
          timestamp: locationData.timestamp
        } : undefined
      });
      setAttendanceStats(stats);
      setLeaveRequests(leaves || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { user, attendanceStats, leaveRequests, loading, error, refetch: fetchUserDetail };
};