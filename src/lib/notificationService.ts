import { supabase } from './supabase';

export type NotificationType =
  | 'shift_reminder'
  | 'leave_approved'
  | 'leave_rejected'
  | 'late_warning'
  | 'absent_marked';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

class NotificationService {
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          notification_type: type,
          title,
          message,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async sendShiftReminders(): Promise<void> {
    try {
      const { error } = await supabase.rpc('send_shift_reminder_notifications');
      if (error) throw error;
    } catch (error) {
      console.error('Error sending shift reminders:', error);
    }
  }

  async markAbsentForMissedShifts(): Promise<void> {
    try {
      const { error } = await supabase.rpc('mark_absent_for_missed_shifts');
      if (error) throw error;
    } catch (error) {
      console.error('Error marking absent for missed shifts:', error);
    }
  }

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private permissionCheckInterval: NodeJS.Timeout | null = null;

  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('Notification permission denied by user');
        return false;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
          return true;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }

      return false;
    } catch (error) {
      console.error('Unexpected error in requestNotificationPermission:', error);
      return false;
    }
  }

  checkPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  startPermissionMonitoring(): void {
    if (this.permissionCheckInterval) {
      clearInterval(this.permissionCheckInterval);
    }

    this.permissionCheckInterval = setInterval(async () => {
      const status = this.checkPermissionStatus();
      if (status === 'default') {
        const granted = await this.requestNotificationPermission();
        if (!granted) {
          console.log('User has not granted notification permission yet');
        }
      }
    }, 60000);
  }

  stopPermissionMonitoring(): void {
    if (this.permissionCheckInterval) {
      clearInterval(this.permissionCheckInterval);
      this.permissionCheckInterval = null;
    }
  }

  showBrowserNotification(title: string, body: string, icon?: string): void {
    try {
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
      }

      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        });
      } else if (Notification.permission === 'default') {
        this.requestNotificationPermission().then(granted => {
          if (granted) {
            new Notification(title, {
              body,
              icon: icon || '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
            });
          }
        });
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
}

export const notificationService = new NotificationService();

export function startNotificationWorker(userId: string): void {
  setInterval(async () => {
    await notificationService.sendShiftReminders();
  }, 60000);

  setInterval(async () => {
    await notificationService.markAbsentForMissedShifts();
  }, 300000);

  notificationService.subscribeToNotifications(userId, (notification) => {
    notificationService.showBrowserNotification(
      notification.title,
      notification.message
    );
  });
}
