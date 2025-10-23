import { supabaseServer } from '@/lib/supabase/server';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

// Separate component for user profile to enable suspense
async function UserProfile({ userId }: { userId: string }) {
  const s = await supabaseServer();
  
  // Get minimal profile data needed
  const { data: profile } = await s.from('profiles')
    .select('role,full_name')
    .eq('id', userId)
    .single();
    
  const isAdmin = profile?.role === 'admin';
  
  return (
    <div className="p-6 space-y-3">
      <div className="text-xl font-semibold">
        {profile?.full_name ?? 'User'}
      </div>
      <div>Role: <span className="font-mono">{profile?.role ?? 'user'}</span></div>
      <a 
        className="underline" 
        href={isAdmin ? "/orders-ex?admin=1" : "/orders-ex"}
      >
        {isAdmin ? 'Go to Admin Orders' : 'My Orders'}
      </a>
    </div>
  );
}

export default async function AuthEx() {
  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();

  if (!user) return <div className="p-6"><AuthForm /></div>;

  // Show profile with loading state
  return (
    <Suspense fallback={<div className="p-6">Loading profile...</div>}>
      <UserProfile userId={user.id} />
    </Suspense>
  );
}
