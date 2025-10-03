import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type AttendanceRecord = Database['public']['Tables']['attendance']['Row'] & {
  profiles?: {
    full_name: string;
    badge_number: string;
  };
};

interface AttendanceWithCalculations extends AttendanceRecord {
  hoursWorked?: number;
  displayStatus?: string;
}

export const useAttendance = (userId: string) => {
  const [attendance, setAttendance] = useState<AttendanceWithCalculations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();

    const channel = supabase
      .channel('attendance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id (
            full_name,
            badge_number
          )
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      const processedData = processAttendanceData(data || []);
      setAttendance(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const processAttendanceData = (records: AttendanceRecord[]): AttendanceWithCalculations[] => {
    const groupedByDate: { [date: string]: AttendanceRecord[] } = {};

    records.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(record);
    });

    const processed: AttendanceWithCalculations[] = [];

    Object.keys(groupedByDate).forEach(date => {
      const dayRecords = groupedByDate[date];
      const punchIn = dayRecords.find(r => r.punch_type === 'in');
      const punchOut = dayRecords.find(r => r.punch_type === 'out');

      if (punchIn) {
        const record: AttendanceWithCalculations = { ...punchIn };

        if (punchOut) {
          const timeIn = new Date(punchIn.timestamp).getTime();
          const timeOut = new Date(punchOut.timestamp).getTime();
          record.hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
        }

        const inTime = new Date(punchIn.timestamp);
        const hour = inTime.getHours();
        const minute = inTime.getMinutes();

        if (hour > 9 || (hour === 9 && minute > 15)) {
          record.displayStatus = 'late';
        } else {
          record.displayStatus = 'present';
        }

        processed.push(record);
      } else if (dayRecords.length > 0) {
        processed.push({ ...dayRecords[0], displayStatus: 'absent' });
      }
    });

    return processed;
  };

  return { attendance, loading, error, refetch: fetchAttendance };
};
