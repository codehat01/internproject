// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          badge_number: string;
          role: 'admin' | 'staff';
          station_id: string;
          phone: string | null;
          department: string | null;
          email: string | null; // Add email field
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          badge_number: string;
          role?: 'admin' | 'staff';
          station_id?: string;
          phone?: string | null;
          department?: string | null;
          email?: string | null; // Add email field
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          badge_number?: string;
          role?: 'admin' | 'staff';
          station_id?: string;
          phone?: string | null;
          department?: string | null;
          email?: string | null; // Add email field
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          punch_type: 'in' | 'out';
          timestamp: string;
          latitude: number | null;
          longitude: number | null;
          photo_url: string | null;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          punch_type: 'in' | 'out';
          timestamp?: string;
          latitude?: number | null;
          longitude?: number | null;
          photo_url?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          punch_type?: 'in' | 'out';
          timestamp?: string;
          latitude?: number | null;
          longitude?: number | null;
          photo_url?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          attachment_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          approved_by: string | null;
          admin_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          attachment_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          approved_by?: string | null;
          admin_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string;
          attachment_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          approved_by?: string | null;
          admin_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_email_by_badge: {
        Args: {
          p_badge_number: string;
        };
        Returns: string | null;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}