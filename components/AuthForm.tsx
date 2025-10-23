'use client';
import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState<string | null>(null);

  /**
   * Handle form submission for sign in/up
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      // Attempt authentication
      const result = await supabaseClient.auth[mode === 'signin' ? 'signInWithPassword' : 'signUp']({
        email,
        password: pw,
      });

      if (result.error) throw result.error;

      // Refresh session to set httpOnly cookies
      const { error: refreshErr } = await supabaseClient.auth.refreshSession();
      if (refreshErr) throw refreshErr;

      // Reload page to sync auth state
      window.location.reload();
  } catch (err: any) {
    console.error('[Auth Error]', err);
    setMsg(err.message ?? 'Auth error');
  }
}


  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
      <h2 className="text-xl font-bold">{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
      <input className="w-full border rounded px-3 py-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full border rounded px-3 py-2" placeholder="password" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
      <button className="border rounded px-3 py-2">{mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
      <button type="button" className="text-sm underline ml-3" onClick={()=>setMode(mode==='signin'?'signup':'signin')}>
        {mode === 'signin' ? 'Need an account?' : 'Have an account? Sign in'}
      </button>
      {msg && <div className="text-red-600">{msg}</div>}
    </form>
  );
}
