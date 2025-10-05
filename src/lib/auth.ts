import { supabase } from './supabase';
import type { User, AuthResponse, Profile } from '../types';
import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '../types/database';


export const getEmailFromBadge = async (badgeNumber: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_email_from_badge', {
      badge_num: badgeNumber
    } as any);

    if (error) {
      console.error('Error getting email from badge:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getEmailFromBadge:', error);
    return null;
  }
};


export const loginWithBadge = async (
  badgeNumber: string, 
  password: string
): Promise<AuthResponse> => {
  try {
    // Get the email associated with the badge number
    const email = await getEmailFromBadge(badgeNumber);
    
    if (!email) {
      throw new Error('Invalid badge number or email not found');
    }

    // Login with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Authentication failed');
    }

    // Get user profile with retry mechanism
    let profile: Profile | null = null;
    let profileError: any = null;
    
    // Retry mechanism for profile fetch
    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (data && !error) {
        profile = data;
        break;
      }
      
      profileError = error;
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }

    if (!profile) {
      throw new Error('Profile not found after multiple attempts: ' + (profileError?.message || 'Unknown error'));
    }

    return {
      user: authData.user,
      profile: profile
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getCurrentUserProfile = async (): Promise<Profile | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found');
      return null;
    }

    // Retry mechanism for profile fetch
    let profile: Profile | null = null;
    let error: any = null;
    
    for (let i = 0; i < 3; i++) {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !fetchError) {
        profile = data;
        break;
      }
      
      error = fetchError;
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }

    if (error) {
      console.error('Error getting profile after retries:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Auth check error:', error);
      return false;
    }
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const transformProfileToUser = (profile: Profile, email?: string): User => {
  return {
    id: profile.id,
    badge_number: profile.badge_number,
    full_name: profile.full_name,
    role: profile.role === 'admin' ? 'admin' : 'staff',
    rank: profile.rank || 'Officer',
    station_id: profile.station_id,
    phone: profile.phone || undefined,
    email: email || profile.email,

export const validateBadgeNumber = (badgeNumber: string): boolean => {
  // Badge number should be alphanumeric and at least 3 characters
  const badgeRegex = /^[A-Z0-9]{3,}$/;
  return badgeRegex.test(badgeNumber.toUpperCase());
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};