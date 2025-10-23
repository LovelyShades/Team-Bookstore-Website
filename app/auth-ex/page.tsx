import { supabaseServer } from '@/lib/supabase/server';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';

// -----------------------------
// Separate subcomponent (server)
// -----------------------------
async function UserProfile({ userId }: { userId: string }) {
  const s = await supabaseServer();

  // Fetch minimal profile data
  const { data: profile } = await s
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single();

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-semibold">
        {profile?.full_name ?? 'User'}
      </div>

      <div>
        Role:{' '}
        <span className="font-mono text-gray-700">
          {profile?.role ?? 'user'}
        </span>
      </div>

      <div className="space-x-4">
        <Link
          href={isAdmin ? '/orders-ex?admin=1' : '/orders-ex'}
          className="text-blue-600 underline"
        >
          {isAdmin ? 'Go to Admin Orders' : 'My Orders'}
        </Link>

        <Link href="/" className="text-blue-600 underline">
          Back to Catalog
        </Link>
      </div>

      {/* 🔴 Modern server-action-based logout button */}
      <LogoutButton />
    </div>
  );
}

// -----------------------------
// Main AuthEx Page (server)
// -----------------------------
export default async function AuthEx() {
  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();

  // If not logged in, show the sign-in form
  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <AuthForm />
      </div>
    );
  }

  // If logged in, show profile
  return (
    <Suspense fallback={<div className="p-6">Loading profile…</div>}>
      <UserProfile userId={user.id} />
    </Suspense>
  );
}
