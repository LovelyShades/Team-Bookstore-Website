import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Order as OrderType, OrderItem as OrderItemType, Item } from '@/types';
import { Button } from '@/components/ui/button';

const Orders = () => {
  const { user, isAdmin } = useAuth();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const { data: myOrders = [], isLoading: loadingMyOrders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, items(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (OrderType & { order_items: (OrderItemType & { items: Item })[] })[];
    },
    enabled: !!user,
  });

  const { data: allOrders = [], isLoading: loadingAllOrders } = useQuery({
    queryKey: ['orders', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, items(*))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (OrderType & { order_items: (OrderItemType & { items: Item })[] })[];
    },
    enabled: isAdmin,
  });

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const renderOrdersList = (orders: typeof myOrders, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-20">
          <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
          <h3 className="text-2xl font-bold text-foreground mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Your orders will appear here once you make a purchase</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const itemCount = order.order_items.reduce((sum, item) => sum + item.qty, 0);

          return (
            <div
              key={order.id}
              className="bg-card rounded-xl border border-border shadow-soft overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Order Date: {format(new Date(order.created_at), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Order ID: {order.id.slice(0, 8)}...
                    </p>
                    {isAdmin && order.customer_email && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Customer: {order.customer_email}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">
                      ${(order.total_cents / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => toggleOrder(order.id)}
                >
                  <span className="font-medium">
                    {isExpanded ? 'Hide' : 'Show'} Order Details
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-muted/30 p-6">
                  <h4 className="font-semibold text-foreground mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center gap-4 p-3 bg-card rounded-lg"
                      >
                        <img
                          src={item.items.img_url || '/placeholder.svg'}
                          alt={item.items.name}
                          className="h-16 w-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.items.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.qty} × ${(item.price_cents / 100).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold text-foreground">
                          ${((item.price_cents * item.qty) / 100).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Please sign in</h2>
          <p className="text-muted-foreground">Sign in to view your orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          {isAdmin ? 'Orders Management' : 'My Orders'}
        </h1>

        {isAdmin ? (
          <Tabs defaultValue="my-orders" className="space-y-6">
            <TabsList className="bg-card border border-border p-1">
              <TabsTrigger 
                value="my-orders"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-soft"
              >
                My Orders
              </TabsTrigger>
              <TabsTrigger 
                value="all-orders"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-soft"
              >
                All Orders (Admin)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-orders">
              {renderOrdersList(myOrders, loadingMyOrders)}
            </TabsContent>

            <TabsContent value="all-orders">
              {renderOrdersList(allOrders, loadingAllOrders)}
            </TabsContent>
          </Tabs>
        ) : (
          renderOrdersList(myOrders, loadingMyOrders)
        )}
      </div>
    </div>
  );
};

export default Orders;
