import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const ADMIN_TOKEN_KEY = 'admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/admin-login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (data.success && data.token) {
    setAdminToken(data.token);
    return { success: true };
  }
  return { success: false, error: data.error ?? 'Login fehlgeschlagen' };
}

export async function adminAction(action: string, bookingId: string): Promise<{ success: boolean; error?: string }> {
  const token = getAdminToken();
  if (!token) return { success: false, error: 'Nicht eingeloggt' };

  const url = `${supabaseUrl}/functions/v1/admin-ops`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ action, bookingId, token }),
  });
  const data = await res.json();
  if (data.success) return { success: true };
  return { success: false, error: data.error ?? 'Aktion fehlgeschlagen' };
}

export type Booking = {
  id: string;
  name: string;
  subject: string;
  topic: string;
  booking_date: string;
  booking_time: string;
  status: 'confirmed' | 'cancelled';
  cancel_code: string;
  notes: string | null;
  created_at: string;
};

export type BookingInput = {
  name: string;
  subject: string;
  topic: string;
  booking_date: string;
  booking_time: string;
  notes?: string;
};
