import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

interface CartItem {
  cart_id: number;
  item_id: number;
  qty: number;
  items: {
    id: number;
    name: string;
    price_cents: number;
    img_url: string;
    stock: number;
  } | null;
}

export default async function CartEx() {
  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600 mb-4">Please sign in to view your cart.</p>
          <Link 
            href="/auth-ex" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user's cart
  const { data: cart, error: cartErr } = await s
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cartErr) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-600">Error loading cart: {cartErr.message}</div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link 
            href="/" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  // Fetch items in cart with related book info
  const { data: items, error } = await s
    .from("cart_items")
    .select(`
      cart_id,
      item_id,
      qty,
      items:items!inner (
        id,
        name,
        price_cents,
        img_url,
        stock
      )
    `)
    .eq("cart_id", cart.id)
    .order('items(name)') as { data: CartItem[] | null, error: any };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-600">Error loading cart items: {error.message}</div>
        </div>
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link 
            href="/" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  // Calculate subtotal
  const subtotal = items.reduce(
    (total, i) => total + ((i.items?.price_cents ?? 0) * i.qty),
    0
  );

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Your Cart</h1>

      <div className="space-y-4">
        {items.map((it) => {
          const book = it.items;
          if (!book) return null;

          return (
            <div key={`${it.cart_id}-${it.item_id}`} className="flex justify-between border-b pb-2">
              <div>
                <div>{book.name}</div>
                <div className="text-sm text-gray-600">Qty: {it.qty}</div>
              </div>
              <div>${((book.price_cents * it.qty) / 100).toFixed(2)}</div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex justify-between font-medium">
            <span>Subtotal:</span>
            <span>${(subtotal / 100).toFixed(2)}</span>
          </div>

          <div className="mt-4 flex gap-4">
            <Link href="/" className="text-blue-600 hover:underline">
              Continue Shopping
            </Link>
            <Link href="/checkout-ex" className="text-blue-600 hover:underline">
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

