// lib/auth.ts
import { supabaseServer } from './supabase/server';

export async function getServerUser() {
  const s = await supabaseServer();
  const { data, error } = await s.auth.getUser();
  if (error) return { user: null, error };
  return { user: data.user, error: null };
}

export async function getServerProfile() {
  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return { profile: null };
  const { data: profile } = await s.from('profiles').select('*').eq('id', user.id).single();
  return { profile };
}

export function isAdmin(profile?: { role?: string }) {
  return profile?.role === 'admin';
}
