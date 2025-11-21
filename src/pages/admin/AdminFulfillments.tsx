import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fulfillmentService } from '@/services/fulfillmentService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FulfillmentWithDetails {
  id: string;
  order_id: string;
  item_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipped_qty: number;
  tracking_number: string | null;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  shipped_at: string | null;
  created_at: string;
  orders: {
    id: string;
    customer_email: string;
    created_at: string;
  };
  items: {
    name: string;
    img_url: string | null;
    author: string | null;
  };
}

export default function AdminFulfillments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState<{ [key: string]: string }>({});
  const [shippedQty, setShippedQty] = useState<{ [key: string]: number }>({});

  // Helper function to format dates safely
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Fetch pending fulfillments
  const { data: pendingFulfillments = [], isLoading: loadingPending, error: pendingError } = useQuery({
    queryKey: ['fulfillments', 'pending'],
    queryFn: () => fulfillmentService.getPendingFulfillments(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch processing fulfillments
  const { data: processingFulfillments = [], isLoading: loadingProcessing } = useQuery({
    queryKey: ['fulfillments', 'processing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_fulfillments')
        .select('*')
        .eq('status', 'processing')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Enrich with order and item data
      const enrichedFulfillments = await Promise.all(
        (data || []).map(async (fulfillment) => {
          const { data: order } = await supabase
            .from('orders')
            .select('id, customer_email, created_at')
            .eq('id', fulfillment.order_id)
            .single();

          const { data: item } = await supabase
            .from('items')
            .select('name, img_url, author')
            .eq('id', fulfillment.item_id)
            .single();

          return { ...fulfillment, orders: order, items: item };
        })
      );
      
      return enrichedFulfillments;
    },
    refetchInterval: 30000,
  });

  // Fetch shipped fulfillments
  const { data: shippedFulfillments = [], isLoading: loadingShipped } = useQuery({
    queryKey: ['fulfillments', 'shipped'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_fulfillments')
        .select('*')
        .eq('status', 'shipped')
        .order('shipped_at', { ascending: false });
      
      if (error) throw error;
      
      // Enrich with order and item data
      const enrichedFulfillments = await Promise.all(
        (data || []).map(async (fulfillment) => {
          const { data: order } = await supabase
            .from('orders')
            .select('id, customer_email, created_at')
            .eq('id', fulfillment.order_id)
            .single();

          const { data: item } = await supabase
            .from('items')
            .select('name, img_url, author')
            .eq('id', fulfillment.item_id)
            .single();

          return { ...fulfillment, orders: order, items: item };
        })
      );
      
      return enrichedFulfillments;
    },
    refetchInterval: 30000,
  });

  // Update fulfillment mutation
  const updateFulfillmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      fulfillmentService.updateFulfillment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
      toast.success('Fulfillment updated successfully');
    },
    onError: (error) => {
      console.error('Error updating fulfillment:', error);
      toast.error('Failed to update fulfillment');
    },
  });

  // Mark as shipped mutation
  const markAsShippedMutation = useMutation({
    mutationFn: ({ id, trackingNumber, shippedQty }: { 
      id: string; 
      trackingNumber: string; 
      shippedQty: number; 
    }) => fulfillmentService.markAsShipped(id, trackingNumber, shippedQty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
      toast.success('Order marked as shipped');
    },
    onError: (error) => {
      console.error('Error marking as shipped:', error);
      toast.error('Failed to mark as shipped');
    },
  });

  const handleStatusUpdate = (fulfillmentId: string, newStatus: string) => {
    updateFulfillmentMutation.mutate({
      id: fulfillmentId,
      data: { 
        status: newStatus,
        fulfilled_by: user?.id 
      }
    });
  };

  const handleMarkAsShipped = (fulfillmentId: string) => {
    const tracking = trackingNumber[fulfillmentId];
    const qty = shippedQty[fulfillmentId] || 1;

    if (!tracking) {
      toast.error('Please enter a tracking number');
      return;
    }

    markAsShippedMutation.mutate({
      id: fulfillmentId,
      trackingNumber: tracking,
      shippedQty: qty,
    });

    // Clear form fields
    setTrackingNumber(prev => ({ ...prev, [fulfillmentId]: '' }));
    setShippedQty(prev => ({ ...prev, [fulfillmentId]: 0 }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-warning';
      case 'processing':
        return 'status-info';
      case 'shipped':
        return 'status-info';
      case 'delivered':
        return 'status-success';
      case 'cancelled':
        return 'status-error';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Show error state
  if (pendingError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Order Fulfillment</h2>
            <p className="text-muted-foreground">Manage order processing and shipping</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error Loading Fulfillments</h3>
              <p className="text-muted-foreground">
                There was an error loading fulfillment data. Please check your connection and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderFulfillmentCard = (fulfillment: FulfillmentWithDetails) => (
    <Card key={fulfillment.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {fulfillment.items?.name || 'Unknown Item'}
              <Badge className={getStatusColor(fulfillment.status)}>
                {getStatusIcon(fulfillment.status)}
                {fulfillment.status}
              </Badge>
            </CardTitle>
            <CardDescription className="space-y-1 mt-2">
              <span className="block">Order ID: {fulfillment.order_id.slice(0, 8)}...</span>
              <span className="block">Customer: {fulfillment.orders?.customer_email || 'Unknown'}</span>
              <span className="block">Order Date: {formatDate(fulfillment.orders?.created_at || fulfillment.created_at)}</span>
              {fulfillment.items?.author && <span className="block">Author: {fulfillment.items.author}</span>}
            </CardDescription>
          </div>
          {fulfillment.items?.img_url && (
            <img
              src={fulfillment.items.img_url}
              alt={fulfillment.items.name}
              className="w-16 h-20 object-cover rounded"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Update */}
          <div className="flex items-center gap-2">
            <Label>Update Status:</Label>
            <Select 
              value={fulfillment.status} 
              onValueChange={(value) => handleStatusUpdate(fulfillment.id, value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shipping Details */}
          {fulfillment.status === 'processing' && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold">Ship this item:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`tracking-${fulfillment.id}`}>Tracking Number</Label>
                  <Input
                    id={`tracking-${fulfillment.id}`}
                    value={trackingNumber[fulfillment.id] || ''}
                    onChange={(e) => setTrackingNumber(prev => ({ 
                      ...prev, 
                      [fulfillment.id]: e.target.value 
                    }))}
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <Label htmlFor={`qty-${fulfillment.id}`}>Shipped Quantity</Label>
                  <Input
                    id={`qty-${fulfillment.id}`}
                    type="number"
                    min="1"
                    value={shippedQty[fulfillment.id] || 1}
                    onChange={(e) => setShippedQty(prev => ({ 
                      ...prev, 
                      [fulfillment.id]: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => handleMarkAsShipped(fulfillment.id)}
                    disabled={markAsShippedMutation.isPending}
                    className="w-full"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Mark as Shipped
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {fulfillment.tracking_number && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tracking Number:</strong> {fulfillment.tracking_number}
              </p>
              {fulfillment.shipped_at && (
                <p className="text-sm text-muted-foreground">
                  <strong>Shipped:</strong> {formatDate(fulfillment.shipped_at)}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Order Fulfillment</h2>
            <p className="text-muted-foreground">Manage order processing and shipping</p>
          </div>
        </div>
      </div>

      {/* Pending Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Pending Orders ({pendingFulfillments.length})</h3>
        </div>
        {loadingPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : pendingFulfillments.length > 0 ? (
          <div className="space-y-4">
            {pendingFulfillments.map(renderFulfillmentCard)}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                <p>No pending orders</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Processing Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Package className="h-5 w-5 text-info" />
          <h3 className="text-lg font-semibold">Processing Orders ({processingFulfillments.length})</h3>
        </div>
        {loadingProcessing ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : processingFulfillments.length > 0 ? (
          <div className="space-y-4">
            {processingFulfillments.map((fulfillment) => renderFulfillmentCard(fulfillment as FulfillmentWithDetails))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 text-info/50" />
                <p>No orders being processed</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Shipped Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Truck className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Shipped Orders ({shippedFulfillments.length})</h3>
        </div>
        {loadingShipped ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : shippedFulfillments.length > 0 ? (
          <div className="space-y-4">
            {shippedFulfillments.map((fulfillment) => renderFulfillmentCard(fulfillment as FulfillmentWithDetails))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                <p>No shipped orders</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}