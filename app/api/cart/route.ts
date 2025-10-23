import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { itemId, qty } = body as { itemId: string; qty: number };

  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await s.from('carts').select('id').eq('user_id', user.id).maybeSingle();
  let cartId = existing?.id;
  if (!cartId) {
    const { data: created, error: ce } = await s.from('carts').insert({ user_id: user.id }).select('id').single();
    if (ce) return NextResponse.json({ error: ce.message }, { status: 400 });
    cartId = created.id;
  }

  const { error } = await s.from('cart_items').upsert(
    { cart_id: cartId, item_id: itemId, qty },
    { onConflict: 'cart_id,item_id' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, cartId });
}
