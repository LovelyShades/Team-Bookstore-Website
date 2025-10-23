'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/app/actions/logout';

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
      className="mt-4 px-4 py-2 rounded-xl border border-red-500 text-red-600 hover:bg-red-50"
    >
      {pending ? 'Logging out…' : 'Log Out'}
    </button>
  );
}
