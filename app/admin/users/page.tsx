import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';


    const s = await supabaseServer();

    const {data: {user}} = await s.auth.getUser();
    const {data : profile} = await s
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if(profile?.role !== 'admin') redirect('/');
    


