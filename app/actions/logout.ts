'use server';

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const s = await supabaseServer();
  await s.auth.signOut();

  // Redirect after sign-out
  redirect('/auth-ex');
}
