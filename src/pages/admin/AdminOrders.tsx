import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderWithItems {
  id: string;
  created_at: string;
  customer_email: string | null;
  total_cents: number;
  order_items: Array<{
    qty: number;
    price_cents: number;
    items: {
      name: string;
      img_url: string | null;
    } | null;
  }>;
}

export default function AdminOrders() {
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'total'>('date');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          customer_email,
          total_cents,
          order_items (
            qty,
            price_cents,
            items (
              name,
              img_url
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });

  const sortedOrders = orders ? [...orders].sort((a, b) => {
    switch (sortBy) {
      case 'customer':
        return (a.customer_email || '').localeCompare(b.customer_email || '');
      case 'total':
        return b.total_cents - a.total_cents;
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Order Management</h2>
            <p className="text-muted-foreground">View and track all orders</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="customer">Sort by Customer</SelectItem>
              <SelectItem value="total">Sort by Total</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription className="space-y-1 mt-2">
                      <p>Customer: {order.customer_email || 'N/A'}</p>
                      <p>Date: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</p>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${(order.total_cents / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.order_items.reduce((sum, item) => sum + item.qty, 0)} items
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.order_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                      {item.items?.img_url && (
                        <img
                          src={item.items.img_url}
                          alt={item.items.name}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.items?.name || 'Unknown Item'}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.qty} × ${(item.price_cents / 100).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${((item.qty * item.price_cents) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-muted-foreground text-center">No orders placed yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
