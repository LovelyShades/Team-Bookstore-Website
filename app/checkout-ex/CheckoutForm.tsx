'use client';

import { useState } from 'react';

export default function CheckoutForm({ cartId }: { cartId: string }) {
  const [discountCode, setDiscountCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function doCheckout() {
    setErr(null);
    setResult(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, discountCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      setResult(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Checkout</h1>

      <input
        className="block w-full max-w-sm border rounded p-2"
        placeholder="Discount code (optional)"
        value={discountCode}
        onChange={(e) => setDiscountCode(e.target.value)}
      />

      <button
        onClick={doCheckout}
        disabled={loading}
        className="block w-full max-w-sm bg-blue-600 text-white rounded p-2"
      >
        {loading ? 'Processing...' : 'Complete Order'}
      </button>

      {err && <div className="text-red-600">{err}</div>}
      {result && (
        <div className="p-4 bg-gray-100 rounded">
          <div>
            ✅ Order placed! Total: ${(result.total_cents / 100).toFixed(2)}
          </div>
          {result.discount_applied > 0 && (
            <div className="text-green-600">
              Discount applied: {result.discount_applied}% off
            </div>
          )}
        </div>
      )}
    </div>
  );
}
