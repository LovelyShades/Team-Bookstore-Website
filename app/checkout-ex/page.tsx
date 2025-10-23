'use client';
import { useState } from 'react';

export default function CheckoutEx() {
  const [cartId, setCartId] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function doCheckout() {
    setErr(null); setResult(null); setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, discountCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      setResult(data);
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Checkout (example)</h1>
      <input className="border rounded px-3 py-2 w-full max-w-sm"
        placeholder="cartId (uuid)" value={cartId} onChange={e=>setCartId(e.target.value)} />
      <input className="border rounded px-3 py-2 w-full max-w-sm"
        placeholder="discountCode (optional)" value={discountCode} onChange={e=>setDiscountCode(e.target.value)} />
      <button onClick={doCheckout} className="border rounded px-3 py-2">
        {loading ? 'Processing…' : 'Checkout'}
      </button>
      {err && <div className="text-red-600">{err}</div>}
      {result && <pre className="bg-black text-white p-3 rounded overflow-auto">
{JSON.stringify(result, null, 2)}
      </pre>}
    </div>
  );
}
