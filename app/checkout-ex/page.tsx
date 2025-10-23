import { supabaseServer } from '@/lib/supabase/server';
import CheckoutForm from './CheckoutForm';
import Link from 'next/link';

export default async function CheckoutEx() {
  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">Please sign in to checkout.</p>
        <Link href="/auth-ex" className="text-blue-600 hover:underline">Sign in</Link>
      </div>
    );
  }

  const { data: cart } = await s
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!cart) {
    return (
      <div className="p-6">
        <p className="text-gray-600 mb-4">Your cart is empty.</p>
        <Link href="/" className="text-blue-600 hover:underline">Browse books</Link>
      </div>
    );
  }

  return <CheckoutForm cartId={cart.id} />;
}
