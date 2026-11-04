import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vbhvorgjeivvvjktspee.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiaHZvcmdqZWl2dnZqa3RzcGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MDQ4ODYsImV4cCI6MjEwOTM4MDg4Nn0.qexsyw5N3lPbU4jlXXkwBkVVzDthifHWjaWwsiOcwCE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Send passwordless Magic Link + OTP code to user's email
 * Works for both new user registration and existing user login!
 */
export async function sendMagicLink(email: string, redirectTo?: string) {
  const redirectUrl = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined);
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
      shouldCreateUser: true
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Verify 6-digit OTP code entered by the customer
 */
export async function verifyOtpCode(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: token.trim(),
    type: 'email'
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('Sign out error:', error.message);
  }
  localStorage.removeItem('oj_auth_token');
  localStorage.removeItem('oj_user');
}

