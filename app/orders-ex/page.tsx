import { supabaseServer } from '@/lib/supabase/server';
import { Suspense } from 'react';

type Search = Record<string, string | string[]>;

// Types for orders data
interface Order {
  id: string;
  created_at: string;
  customer_email: string | null;
  total_cents: number;
}

// Helper to parse search params
function parseParam(value: string | string[] | undefined, defaultValue: string): string {
  return (Array.isArray(value) ? value[0] : value) ?? defaultValue;
}

// Orders table component to enable suspense
async function OrdersTable({ userId, isAdmin, sort }: { 
  userId: string;
  isAdmin: boolean;
  sort: string;
}) {
  const s = await supabaseServer();
  
  // Build query with minimal required fields
  let query = s.from('orders')
    .select('id, created_at, customer_email, total_cents')
    .order(sort, { ascending: false });
  
  // Filter by user unless admin view
  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  // Execute query
  const { data: orders, error } = await query;  if (error) {
    return <div className="text-red-600">Error: {error.message}</div>;
  }

  if (!orders?.length) {
    return <div className="text-gray-500">No orders found.</div>;
  }
  
  return (
    <table className="min-w-[600px]">
      <thead>
        <tr>
          <th className="text-left p-2">Date</th>
          <th className="text-left p-2">Customer</th>
          <th className="text-left p-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order: Order) => (
          <tr key={order.id}>
            <td className="p-2">{new Date(order.created_at).toLocaleString()}</td>
            <td className="p-2">{order.customer_email ?? '—'}</td>
            <td className="p-2">${(order.total_cents / 100).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function OrdersEx({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const adminParam = parseParam(params.admin, '0') === '1';
  const sort = parseParam(params.sort, 'created_at');

  const s = await supabaseServer();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  // Get minimal profile data
  const { data: profile } = await s.from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">
        {(adminParam && isAdmin) ? 'Admin Orders' : 'My Orders'}
      </h1>
      <div className="mt-4 overflow-x-auto">
        <Suspense fallback={<div>Loading orders...</div>}>
          <OrdersTable 
            userId={user.id}
            isAdmin={isAdmin && adminParam}
            sort={sort}
          />
        </Suspense>
      </div>
    </div>
  );
}
