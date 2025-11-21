import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fulfillmentService } from '@/services/fulfillmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowUpDown, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fulfillmentService as fs } from '@/services/fulfillmentService';

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
  const queryClient = useQueryClient();

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

  // Get fulfillments for all orders
  const { data: allFulfillments = [] } = useQuery({
    queryKey: ['admin-all-fulfillments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_fulfillments')
        .select('order_id, status')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get cancellable orders status
  const { data: cancellableOrders = {} } = useQuery({
    queryKey: ['admin-cancellable-orders'],
    queryFn: async () => {
      if (!orders) return {};
      
      const cancellableStatus: Record<string, boolean> = {};
      await Promise.all(
        orders.map(async (order) => {
          cancellableStatus[order.id] = await fs.canCancelOrder(order.id);
        })
      );
      
      return cancellableStatus;
    },
    enabled: !!orders && orders.length > 0,
  });

  // Helper function to get fulfillment status for an order
  const getOrderFulfillmentStatus = (orderId: string) => {
    const orderFulfillments = allFulfillments.filter(f => f.order_id === orderId);
    
    if (orderFulfillments.length === 0) {
      return { hasAny: false, status: 'none' };
    }

    const allCancelled = orderFulfillments.every(f => f.status === 'cancelled');
    const allDelivered = orderFulfillments.every(f => f.status === 'delivered');
    const anyShipped = orderFulfillments.some(f => f.status === 'shipped');
    const anyProcessing = orderFulfillments.some(f => f.status === 'processing');
    const allPending = orderFulfillments.every(f => f.status === 'pending');

    if (allCancelled) return { hasAny: true, status: 'cancelled' };
    if (allDelivered) return { hasAny: true, status: 'delivered' };
    if (anyShipped) return { hasAny: true, status: 'shipped' };
    if (anyProcessing) return { hasAny: true, status: 'processing' };
    if (allPending) return { hasAny: true, status: 'pending' };
    return { hasAny: true, status: 'mixed' };
  };

  // Helper function to get status display
  const getStatusDisplay = (status: string) => {
    const configs = {
      pending: { label: 'Pending Fulfillment', color: 'status-warning', icon: Clock },
      processing: { label: 'Processing', color: 'status-info', icon: Package },
      shipped: { label: 'Shipped', color: 'status-info', icon: Truck },
      delivered: { label: 'Delivered', color: 'status-success', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'status-error', icon: XCircle },
      mixed: { label: 'Mixed Status', color: 'status-info', icon: Package },
      none: { label: 'No Fulfillments', color: 'bg-muted text-muted-foreground', icon: Clock },
    };
    
    return configs[status as keyof typeof configs] || configs.none;
  };

  // Create fulfillments for an order
  const handleCreateFulfillments = async (orderId: string) => {
    try {
      console.log('Creating fulfillments for order:', orderId);
      const success = await fs.createFulfillmentsForOrder(orderId);
      if (success) {
        // Invalidate both queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['admin-all-fulfillments'] });
        queryClient.invalidateQueries({ queryKey: ['admin-cancellable-orders'] });
        queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
        alert('Fulfillments created successfully!');
        console.log('Fulfillments created successfully for order:', orderId);
      } else {
        alert('Failed to create fulfillments - check console for details');
        console.error('Failed to create fulfillments for order:', orderId);
      }
    } catch (error) {
      console.error('Error creating fulfillments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error creating fulfillments: ${errorMessage}`);
    }
  };

  // Cancel an order
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Cancelling order:', orderId);
      const success = await fs.cancelOrder(orderId);
      if (success) {
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['admin-all-fulfillments'] });
        queryClient.invalidateQueries({ queryKey: ['admin-cancellable-orders'] });
        queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
        alert('Order cancelled successfully!');
        console.log('Order cancelled successfully:', orderId);
      } else {
        alert('Failed to cancel order - check console for details');
        console.error('Failed to cancel order:', orderId);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error cancelling order: ${errorMessage}`);
    }
  };

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

  // Categorize orders by their fulfillment status
  const ongoingOrders = sortedOrders.filter((order) => {
    const fulfillmentStatus = getOrderFulfillmentStatus(order.id);
    return ['pending', 'processing', 'shipped'].includes(fulfillmentStatus.status);
  });

  const completedOrders = sortedOrders.filter((order) => {
    const fulfillmentStatus = getOrderFulfillmentStatus(order.id);
    return fulfillmentStatus.status === 'delivered';
  });

  const cancelledOrders = sortedOrders.filter((order) => {
    const fulfillmentStatus = getOrderFulfillmentStatus(order.id);
    return fulfillmentStatus.status === 'cancelled';
  });

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

      <Tabs defaultValue="ongoing" className="space-y-6">
        <TabsList className="bg-card border border-border p-1 grid grid-cols-3 w-full">
          <TabsTrigger
            value="ongoing"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center justify-center gap-2"
          >
            <Package className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden lg:inline">Ongoing ({ongoingOrders.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden lg:inline">Completed ({completedOrders.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center justify-center gap-2"
          >
            <XCircle className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden lg:inline">Cancelled ({cancelledOrders.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing">
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : ongoingOrders.length > 0 ? (
              ongoingOrders.map((order) => {
                const fulfillmentStatus = getOrderFulfillmentStatus(order.id);
                const statusDisplay = getStatusDisplay(fulfillmentStatus.status);
                const StatusIcon = statusDisplay.icon;
                
                return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Order #{order.id.slice(0, 8)}
                          <Badge variant="outline" className="status-info">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {order.order_items.reduce((sum, item) => sum + item.qty, 0)} items
                          </Badge>
                        </CardTitle>
                        <CardDescription className="space-y-1 mt-2">
                          <span className="block">Customer: {order.customer_email || 'N/A'}</span>
                          <span className="block">Date: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${(order.total_cents / 100).toFixed(2)}
                        </p>
                        <div className="mt-2">
                          {fulfillmentStatus.hasAny ? (
                            <div className="flex flex-col gap-2 items-end">
                              <Badge className={`${statusDisplay.color} text-xs`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusDisplay.label}
                              </Badge>
                              {cancellableOrders[order.id] && (
                                <Button
                                  onClick={() => handleCancelOrder(order.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 items-end">
                              <Button
                                onClick={() => handleCreateFulfillments(order.id)}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                <Package className="h-3 w-3 mr-1" />
                                Create Fulfillments
                              </Button>
                              {cancellableOrders[order.id] && (
                                <Button
                                  onClick={() => handleCancelOrder(order.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">ORDER ITEMS</h4>
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded bg-muted/50 border">
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
                          <div className="text-right">
                            <p className="font-semibold">
                              ${((item.qty * item.price_cents) / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {fulfillmentStatus.hasAny ? (
                          <><strong>Status:</strong> {statusDisplay.label} - Fulfillments have been created for this order.</>
                        ) : (
                          <>Click "Create Fulfillments" to initialize order processing and tracking for this order.</>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Ongoing Orders</h3>
                    <p className="text-muted-foreground">Orders being processed or shipped will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : completedOrders.length > 0 ? (
              completedOrders.map((order) => {
                const fulfillmentStatus = getOrderFulfillmentStatus(order.id);
                const statusDisplay = getStatusDisplay(fulfillmentStatus.status);
                const StatusIcon = statusDisplay.icon;
                
                return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Order #{order.id.slice(0, 8)}
                          <Badge variant="outline" className="status-info">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {order.order_items.reduce((sum, item) => sum + item.qty, 0)} items
                          </Badge>
                        </CardTitle>
                        <CardDescription className="space-y-1 mt-2">
                          <span className="block">Customer: {order.customer_email || 'N/A'}</span>
                          <span className="block">Date: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${(order.total_cents / 100).toFixed(2)}
                        </p>
                        <div className="mt-2">
                          <Badge className={`${statusDisplay.color} text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusDisplay.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">ORDER ITEMS</h4>
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded bg-muted/50 border">
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
                          <div className="text-right">
                            <p className="font-semibold">
                              ${((item.qty * item.price_cents) / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Completed Orders</h3>
                    <p className="text-muted-foreground">Delivered orders will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : cancelledOrders.length > 0 ? (
              cancelledOrders.map((order) => {
                const fulfillmentStatus = getOrderFulfillmentStatus(order.id);
                const statusDisplay = getStatusDisplay(fulfillmentStatus.status);
                const StatusIcon = statusDisplay.icon;
                
                return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Order #{order.id.slice(0, 8)}
                          <Badge variant="outline" className="status-info">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {order.order_items.reduce((sum, item) => sum + item.qty, 0)} items
                          </Badge>
                        </CardTitle>
                        <CardDescription className="space-y-1 mt-2">
                          <span className="block">Customer: {order.customer_email || 'N/A'}</span>
                          <span className="block">Date: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${(order.total_cents / 100).toFixed(2)}
                        </p>
                        <div className="mt-2">
                          <Badge className={`${statusDisplay.color} text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusDisplay.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">ORDER ITEMS</h4>
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded bg-muted/50 border">
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
                          <div className="text-right">
                            <p className="font-semibold">
                              ${((item.qty * item.price_cents) / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Cancelled Orders</h3>
                    <p className="text-muted-foreground">Cancelled orders will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
