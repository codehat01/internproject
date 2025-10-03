import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type LeaveRequest = Database['public']['Tables']['leave_requests']['Row'] & {
  profiles?: {
    full_name: string;
    badge_number: string;
    department: string | null;
  };
  approver?: {
    full_name: string;
  };
};

interface UseLeaveRequestsOptions {
  userId?: string;
  isAdmin?: boolean;
}

export const useLeaveRequests = (options: UseLeaveRequestsOptions = {}) => {
  const { userId, isAdmin = false } = options;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveRequests();

    const channel = supabase
      .channel('leave_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_requests'
        },
        () => {
          fetchLeaveRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            badge_number,
            department
          ),
          approver:approved_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLeaveRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const createLeaveRequest = async (
    userId: string,
    startDate: string,
    endDate: string,
    reason: string,
    attachmentUrl?: string
  ) => {
    try {
      const { data, error: insertError } = await supabase
        .from('leave_requests')
        .insert({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          reason,
          attachment_url: attachmentUrl || null,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchLeaveRequests();
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create leave request'
      };
    }
  };

  const approveLeaveRequest = async (requestId: string, approverId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      await fetchLeaveRequests();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to approve leave request'
      };
    }
  };

  const rejectLeaveRequest = async (
    requestId: string,
    approverId: string,
    adminReason: string
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: approverId,
          admin_reason: adminReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      await fetchLeaveRequests();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reject leave request'
      };
    }
  };

  return {
    leaveRequests,
    loading,
    error,
    refetch: fetchLeaveRequests,
    createLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest
  };
};
