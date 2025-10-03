import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type AttendanceRecord = Database['public']['Tables']['attendance']['Row'] & {
  profiles?: {
    full_name: string;
    badge_number: string;
    department: string | null;
  };
};

interface UseAllAttendanceOptions {
  page?: number;
  pageSize?: number;
  dateFilter?: string;
  statusFilter?: string;
  userFilter?: string;
}

export const useAllAttendance = (options: UseAllAttendanceOptions = {}) => {
  const { page = 1, pageSize = 50, dateFilter, statusFilter, userFilter } = options;

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAttendance();

    const channel = supabase
      .channel('all_attendance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        () => {
          fetchAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, pageSize, dateFilter, statusFilter, userFilter]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id (
            full_name,
            badge_number,
            department
          )
        `, { count: 'exact' });

      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('timestamp', startOfDay.toISOString())
          .lte('timestamp', endOfDay.toISOString());
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (userFilter) {
        query = query.eq('user_id', userFilter);
      }

      query = query
        .order('timestamp', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setAttendance(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  return {
    attendance,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    refetch: fetchAttendance
  };
};
