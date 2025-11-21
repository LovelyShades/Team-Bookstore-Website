import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fulfillmentService } from '@/services/fulfillmentService';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  CheckCircle, 
  CalendarDays,
  Clock, 
  MapPin,
  Calendar,
  ShoppingBag,
  Package2,
  XCircle,
   User,
} from 'lucide-react';
import { format } from 'date-fns';
import { Order as OrderType, OrderItem as OrderItemType, Item, ShippingAddress } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Orders = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const { data: myOrders = [], isLoading: loadingMyOrders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *, 
          order_items(*, items(*)),
          shipping_addresses(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (OrderType & { 
        order_items: (OrderItemType & { items: Item })[];
        shipping_addresses: ShippingAddress | null;
      })[];
    },
    enabled: !!user,
  });

  const { data: allOrders = [], isLoading: loadingAllOrders } = useQuery({
    queryKey: ['orders', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *, 
          order_items(*, items(*)),
          shipping_addresses(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (OrderType & { 
        order_items: (OrderItemType & { items: Item })[];
        shipping_addresses: ShippingAddress | null;
      })[];
    },
    enabled: isAdmin,
  });

  // Get fulfillments for specific order
  const { data: fulfillmentsByOrder } = useQuery({
    queryKey: ['fulfillments', 'by-order', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      const orderIds = myOrders.map(order => order.id);
      const fulfillmentPromises = orderIds.map(async (orderId) => {
        const fulfillments = await fulfillmentService.getFulfillmentsByOrderId(orderId);
        return { orderId, fulfillments };
      });
      
      const results = await Promise.all(fulfillmentPromises);
      return results.reduce((acc, { orderId, fulfillments }) => {
        acc[orderId] = fulfillments;
        return acc;
      }, {} as Record<string, any[]>);
    },
    enabled: !!user && myOrders.length > 0,
  });

  // Get cancellable orders status for user
  const { data: cancellableOrders = {} } = useQuery({
    queryKey: ['user-cancellable-orders', user?.id],
    queryFn: async () => {
      if (!user || !myOrders || myOrders.length === 0) return {};
      
      console.log('Checking cancellable orders for user:', user.id);
      console.log('Available orders:', myOrders);
      
      const cancellableStatus: Record<string, boolean> = {};
      await Promise.all(
        myOrders.map(async (order) => {
          const canCancel = await fulfillmentService.canCancelOrder(order.id);
          cancellableStatus[order.id] = canCancel;
          console.log(`Order ${order.id} can be cancelled:`, canCancel);
        })
      );
      
      console.log('Final cancellable status:', cancellableStatus);
      return cancellableStatus;
    },
    enabled: !!user && !!myOrders && myOrders.length > 0,
  });

  // Cancel order handler for users
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?\n\nThis action cannot be undone and you will need to place a new order if you change your mind.')) {
      return;
    }

    try {
      console.log('User cancelling order:', orderId);
      const success = await fulfillmentService.cancelOrder(orderId);
      if (success) {
        // Invalidate ALL relevant queries to refresh the UI immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['orders'] }),
          queryClient.invalidateQueries({ queryKey: ['fulfillments'] }),
          queryClient.invalidateQueries({ queryKey: ['user-cancellable-orders'] }),
        ]);
        
        // Force refetch of the specific fulfillment query
        await queryClient.refetchQueries({ 
          queryKey: ['fulfillments', 'by-order', user?.id] 
        });
        
        toast({
          title: 'Order Cancelled',
          description: 'Your order has been cancelled successfully.',
        });
        console.log('Order cancelled successfully:', orderId);
      } else {
        toast({
          title: 'Cancellation Failed',
          description: 'Failed to cancel order. Please try again or contact support.',
          variant: 'destructive',
        });
        console.error('Failed to cancel order:', orderId);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: `Error cancelling order: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getOrderStatus = (orderId: string) => {
    const fulfillments = fulfillmentsByOrder?.[orderId] || [];
    
    if (fulfillments.length === 0) {
      return { status: 'ordered', step: 0 };
    }
    
    const allDelivered = fulfillments.every(f => f.status === 'delivered');
    const anyShipped = fulfillments.some(f => f.status === 'shipped');
    const anyProcessing = fulfillments.some(f => f.status === 'processing');
    
    if (allDelivered) return { status: 'delivered', step: 3 };
    if (anyShipped) return { status: 'shipped', step: 2 };
    if (anyProcessing) return { status: 'processing', step: 1 };
    return { status: 'ordered', step: 0 };
  };

  const getItemFulfillmentStatus = (orderId: string, itemId: string) => {
    const fulfillments = fulfillmentsByOrder?.[orderId] || [];
    const itemFulfillment = fulfillments.find(f => f.item_id === itemId);
    
    // Debug logging
    console.log('Getting fulfillment status for order:', orderId, 'item:', itemId);
    console.log('Available fulfillments:', fulfillments);
    console.log('Found item fulfillment:', itemFulfillment);
    
    if (!itemFulfillment) {
      console.log('No fulfillment found, returning Ordered status');
      return {
        status: 'ordered',
        badge: 'Ordered',
        color: 'status-info',
        icon: Package,
        tracking: null,
        shippedAt: null
      };
    }
    
    const status = itemFulfillment.status;
    console.log('Item fulfillment status:', status);
    
    const configs = {
      pending: { badge: 'Pending', color: 'status-warning', icon: Clock },
      processing: { badge: 'Processing', color: 'status-info', icon: Package2 },
      shipped: { badge: 'Shipped', color: 'status-info', icon: Truck },
      delivered: { badge: 'Delivered', color: 'status-success', icon: CheckCircle },
      cancelled: { badge: 'Cancelled', color: 'status-error', icon: XCircle },
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    console.log('Using config:', config);
    
    return {
      status,
      ...config,
      tracking: itemFulfillment.tracking_number,
      shippedAt: itemFulfillment.shipped_at,
    };
  };

  // Separate orders into different categories based on fulfillment status
  const upcomingOrders = myOrders.filter(order => {
    const fulfillments = fulfillmentsByOrder?.[order.id] || [];
    
    // If no fulfillments, consider it upcoming (shouldn't happen with auto-creation)
    if (fulfillments.length === 0) return true;
    
    // Check if all fulfillments are cancelled
    const allCancelled = fulfillments.every(f => f.status === 'cancelled');
    if (allCancelled) return false; // Exclude cancelled orders
    
    // Check if all fulfillments are delivered
    const allDelivered = fulfillments.every(f => f.status === 'delivered');
    if (allDelivered) return false; // Exclude delivered orders
    
    // Include orders that have pending, processing, or shipped fulfillments
    return true;
  });

  const completedOrders = myOrders.filter(order => {
    const fulfillments = fulfillmentsByOrder?.[order.id] || [];
    
    // An order is completed if ALL its fulfillments are delivered
    return fulfillments.length > 0 && fulfillments.every(f => f.status === 'delivered');
  });

  // Get cancelled orders
  const cancelledOrders = myOrders.filter(order => {
    const fulfillments = fulfillmentsByOrder?.[order.id] || [];
    // An order is cancelled if ALL its fulfillments are cancelled
    return fulfillments.length > 0 && fulfillments.every(f => f.status === 'cancelled');
  });

  const renderDeliveryStatusSteps = (currentStep: number) => {
    const steps = [
      { label: 'Ordered', icon: Package },
      { label: 'Processing', icon: Package2 },
      { label: 'Shipped', icon: Truck },
      { label: 'Delivered', icon: CheckCircle }
    ];

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          const IconComponent = step.icon;
          
          return (
            <div key={step.label} className="flex flex-col items-center flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive 
                    ? 'bg-accent border-accent text-accent-foreground' 
                    : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                }`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <span className={`text-sm mt-2 font-medium ${
                isCurrent ? 'text-accent' : isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div 
                  className={`absolute h-0.5 w-full max-w-24 mt-5 ${
                    isActive ? 'bg-accent' : 'bg-muted'
                  }`}
                  style={{ 
                    left: `${((index + 1) * 100) / steps.length}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderCard = (order: OrderType & { 
    order_items: (OrderItemType & { items: Item })[];
    shipping_addresses: ShippingAddress | null;
  }) => {
    const isExpanded = expandedOrders.has(order.id);
    const itemCount = order.order_items.reduce((sum, item) => sum + item.qty, 0);
    const { status, step } = getOrderStatus(order.id);

    return (
      <Card key={order.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(order.created_at), 'PPP')}
              </p>
              <p className="text-sm text-muted-foreground">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              
              {/* Item Names and Quantities */}
              <div className="space-y-1 mt-2">
                {order.order_items.map((item, idx) => (
                  <p key={idx} className="text-sm text-foreground">
                    {item.items.name} × {item.qty}
                  </p>
                ))}
              </div>
              
              {isAdmin && order.customer_email && (
                <p className="text-sm text-muted-foreground">
                  Customer: {order.customer_email}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-accent">
                ${(order.total_cents / 100).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
              <Badge 
                variant="secondary" 
                className={`mt-2 ${
                  status === 'delivered'
                    ? 'status-success'
                    : status === 'shipped'
                    ? 'status-info'
                    : 'status-info'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Button
            variant="ghost"
            className="w-full justify-between mb-4"
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

          {isExpanded && (
            <div className="space-y-6">
              {/* Delivery Status Timeline */}
              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Status
                </h4>
                <div className="relative">
                  {renderDeliveryStatusSteps(step)}
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {(() => {
                    const fulfillments = fulfillmentsByOrder?.[order.id] || [];
                    const allCancelled = fulfillments.length > 0 && fulfillments.every(f => f.status === 'cancelled');
                    return allCancelled ? 'Items Cancelled' : 'Items Ordered';
                  })()}
                </h4>
                <div className="space-y-3">
                  {order.order_items.map((item) => {
                    const fulfillmentStatus = getItemFulfillmentStatus(order.id, item.item_id);
                    const IconComponent = fulfillmentStatus.icon;
                    
                    return (
                      <div
                        key={item.item_id}
                        className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
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
                          <div className="mt-2 flex items-center gap-3">
                            <Badge className={fulfillmentStatus.color}>
                              <IconComponent className="h-3 w-3 mr-1" />
                              {fulfillmentStatus.badge}
                            </Badge>
                            {fulfillmentStatus.tracking && (
                              <span className="text-xs text-muted-foreground">
                                Tracking: {fulfillmentStatus.tracking}
                              </span>
                            )}
                          </div>
                          {fulfillmentStatus.shippedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Shipped: {format(new Date(fulfillmentStatus.shippedAt), 'PPp')}
                            </p>
                          )}
                        </div>
                        <p className="font-bold text-foreground">
                          ${((item.price_cents * item.qty) / 100).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Shipping Information */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h4>
                <div className="p-4 bg-muted/30 rounded-lg">
                  {order.shipping_addresses ? (
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">
                        {order.shipping_addresses.line1}
                        {order.shipping_addresses.line2 && `, ${order.shipping_addresses.line2}`}
                      </p>
                      <p className="text-sm text-foreground">
                        {order.shipping_addresses.city}, {order.shipping_addresses.state} {order.shipping_addresses.postal_code}
                      </p>
                      {order.shipping_addresses.phone && (
                        <p className="text-sm text-muted-foreground">
                          Phone: {order.shipping_addresses.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No shipping address on file for this order.
                    </p>
                  )}
                </div>
              </div>

              {/* Cancel Order Button - Only show for pending orders */}
              {(() => {
                const canCancel = cancellableOrders[order.id];
                console.log(`Rendering cancel button for order ${order.id}:`, canCancel);
                return canCancel;
              })() && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="text-red-600 hover:text-red-700 underline text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <Card className="max-w-md text-center bg-card backdrop-blur-sm border-border p-8">
            <Calendar className="h-20 w-20 mx-auto mb-6 text-muted" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Sign in to view your orders
            </h2>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access your order history.
            </p>
            <Link to="/auth">
              <Button size="lg" className="w-full rounded-lg">
                  Go to Login
              </Button>
            </Link>
          </Card>
      </div>
    );
  }

  if (loadingMyOrders) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <CalendarDays className="h-10 w-10 text-primary" />
          <span className="text-primary">
            {isAdmin ? 'Orders Management' : 'My Orders'}
          </span>
        </h1>

        {isAdmin ? (
          <Tabs defaultValue="my-orders" className="space-y-6">
            <TabsList className="bg-card border border-border p-1 grid grid-cols-2 w-full">
              <TabsTrigger
                value="my-orders"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-soft flex items-center justify-center gap-2"
              >
                <User className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden md:inline">My Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="all-orders"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-soft flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden md:inline">All Orders</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-orders">
              {/* Nested tabs for admin's personal orders */}
              <Tabs defaultValue="upcoming" className="space-y-6">
                <TabsList className="bg-muted border border-border p-1 grid grid-cols-3 w-full">
                  <TabsTrigger
                    value="upcoming"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                  >
                    <Truck className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden lg:inline">Upcoming ({upcomingOrders.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden lg:inline">History ({completedOrders.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden lg:inline">Cancelled ({cancelledOrders.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                  {upcomingOrders.length > 0 ? (
                    upcomingOrders.map(renderOrderCard)
                  ) : (
                    <div className="text-center py-12">
                      <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Deliveries</h3>
                      <p className="text-muted-foreground">You have no orders currently being processed or shipped.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  {completedOrders.length > 0 ? (
                    completedOrders.map(renderOrderCard)
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Purchase History</h3>
                      <p className="text-muted-foreground">You haven't completed any orders yet.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                  {cancelledOrders.length > 0 ? (
                    cancelledOrders.map(renderOrderCard)
                  ) : (
                    <div className="text-center py-12">
                      <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Cancelled Orders</h3>
                      <p className="text-muted-foreground">You haven't cancelled any orders.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {myOrders.length === 0 && (
                <div className="text-center py-20">
                  <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">Your orders will appear here once you make a purchase</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all-orders">
              <div className="space-y-4">
                {allOrders.map(renderOrderCard)}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-card border border-border p-1 grid grid-cols-3 w-full">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-soft flex items-center justify-center gap-2"
              >
                <Truck className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Upcoming ({upcomingOrders.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-soft flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden lg:inline">History ({completedOrders.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-soft flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Cancelled ({cancelledOrders.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingOrders.length > 0 ? (
                upcomingOrders.map(renderOrderCard)
              ) : (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Deliveries</h3>
                  <p className="text-muted-foreground">You have no orders currently being processed or shipped.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {completedOrders.length > 0 ? (
                completedOrders.map(renderOrderCard)
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Purchase History</h3>
                  <p className="text-muted-foreground">You haven't completed any orders yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledOrders.length > 0 ? (
                cancelledOrders.map(renderOrderCard)
              ) : (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Cancelled Orders</h3>
                  <p className="text-muted-foreground">You haven't cancelled any orders.</p>
                </div>
              )}
            </TabsContent>

            {myOrders.length === 0 && (
              <div className="text-center py-20">
                <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
                <h3 className="text-2xl font-bold text-foreground mb-2">No orders yet</h3>
                <p className="text-muted-foreground">Your orders will appear here once you make a purchase</p>
              </div>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Orders;