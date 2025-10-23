import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Suspense } from 'react';
import Link from 'next/link';

// Types
type Search = Record<string, string | string[]>;

interface BookItem {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
  img_url?: string;
  active: boolean;
}

/**
 * Server action to add an item to the user's cart
 * Creates a new cart if user doesn't have one
 */
async function addToCart(formData: FormData) {
  'use server';
  
  // Get form data
  const qty = Number(formData.get('qty') ?? 1);
  const itemId = String(formData.get('item_id'));
  const supa = await supabaseServer();

  const { data: { user } } = await supa.auth.getUser();
  if (!user) throw new Error('Sign in required.');

  const { data: existing } = await supa.from('carts').select('id').eq('user_id', user.id).maybeSingle();
  let cartId = existing?.id;
  
  if (!cartId) {
    const { data: created, error: ce } = await supa.from('carts').insert({ user_id: user.id }).select('id').single();
    if (ce) throw ce;
    cartId = created.id;
  }

  const { error: upErr } = await supa.from('cart_items').upsert(
    { cart_id: cartId, item_id: itemId, qty },
    { onConflict: 'cart_id,item_id' }
  );
  if (upErr) throw upErr;

  revalidatePath(`/book-ex?id=${itemId}`);
}

async function BookDetails({ id }: { id: string }) {
  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  
  let isAdmin = false;
  if (user) {
    const { data: profile } = await s.from('profiles').select('role').eq('id', user.id).single();
    isAdmin = profile?.role === 'admin';
  }

  const queryBase = s.from('items')
    .select('id,name,stock,created_at,price_cents,img_url,active')
    .eq('id', id);

  const query = isAdmin ? queryBase : queryBase.eq('active', true);
  const { data: item, error: queryError } = await query.single();

  if (queryError || !item) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">
          {queryError 
            ? "Error loading book details" 
            : "Book not found or not available"}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          {!user && "Try signing in to view more items."}
        </div>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <form action={addToCart} className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{item.name}</h1>
      <p>${(item.price_cents / 100).toFixed(2)}</p>
      <input type="hidden" name="item_id" value={item.id} />
      <label className="block">
        Qty:
        <input 
          type="number" 
          name="qty" 
          defaultValue={1} 
          min={1} 
          max={item.stock}
          className="ml-2 border rounded px-2 py-1 w-24" 
        />
      </label>
      <button className="rounded-xl border px-3 py-2">Add to Cart</button>
    </form>
  );
}

/**
 * Main book details page component
 * Handles parameter validation and loading states
 */
export default async function BookEx({ searchParams }: { searchParams: Promise<Search> }) {
  // Get and validate book ID
  const params = await searchParams;
  const id = String(params?.['id'] ?? '');
  
  // Show error if no book ID provided
  if (!id) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">
          Please select a book from the catalog.
        </div>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Show book details with loading state
  return (
    <Suspense fallback={<div className="p-6">Loading book details...</div>}>
      <BookDetails id={id} />
    </Suspense>
  );
}