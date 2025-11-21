import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fulfillmentService } from '@/services/fulfillmentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DeliveryStatusTester = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newStatus, setNewStatus] = useState('pending');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Get recent orders with items
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-with-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_cents,
          order_items(
            item_id,
            qty,
            items(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Get all fulfillments
  const { data: fulfillments = [] } = useQuery({
    queryKey: ['all-fulfillments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_fulfillments')
        .select(`
          *,
          orders(id, total_cents),
          items(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Create fulfillment mutation
  const createFulfillmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrderId || !selectedItemId) {
        throw new Error('Please select an order and item');
      }

      return fulfillmentService.createFulfillment({
        order_id: selectedOrderId,
        item_id: selectedItemId,
        status: newStatus as any,
        tracking_number: trackingNumber || undefined,
        shipped_qty: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-fulfillments'] });
      toast({
        title: 'Success',
        description: 'Fulfillment created successfully',
      });
      setTrackingNumber('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update fulfillment mutation
  const updateFulfillmentMutation = useMutation({
    mutationFn: async ({ fulfillmentId, status, tracking }: { fulfillmentId: string, status: string, tracking?: string }) => {
      return fulfillmentService.updateFulfillment(fulfillmentId, {
        status: status as any,
        tracking_number: tracking,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-fulfillments'] });
      toast({
        title: 'Success',
        description: 'Fulfillment updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete fulfillment mutation
  const deleteFulfillmentMutation = useMutation({
    mutationFn: async (fulfillmentId: string) => {
      const { error } = await supabase
        .from('order_fulfillments')
        .delete()
        .eq('id', fulfillmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-fulfillments'] });
      toast({
        title: 'Success',
        description: 'Fulfillment deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'status-warning',
      processing: 'status-info',
      shipped: 'status-info',
      delivered: 'status-success',
      cancelled: 'status-error',
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Delivery Status Tester</h2>
      
      {/* Create New Fulfillment */}
      <Card>
        <CardHeader>
          <CardTitle>Create Test Fulfillment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Select Order</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order: any) => (
                    <SelectItem key={order.id} value={order.id}>
                      Order {order.id.slice(0, 8)} - ${(order.total_cents / 100).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  {selectedOrderId && orders
                    .find((order: any) => order.id === selectedOrderId)
                    ?.order_items.map((item: any) => (
                      <SelectItem key={item.item_id} value={item.item_id}>
                        {item.items.name} (Qty: {item.qty})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
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

            <div>
              <Label>Tracking Number (optional)</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="TRK123456789"
              />
            </div>
          </div>

          <Button 
            onClick={() => createFulfillmentMutation.mutate()}
            disabled={createFulfillmentMutation.isPending || !selectedOrderId || !selectedItemId}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Fulfillment
          </Button>
        </CardContent>
      </Card>

      {/* Existing Fulfillments */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Fulfillments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fulfillments.map((fulfillment: any) => (
              <div key={fulfillment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{fulfillment.items?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Order: {fulfillment.order_id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(fulfillment.status)}>
                      {fulfillment.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteFulfillmentMutation.mutate(fulfillment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {fulfillment.tracking_number && (
                  <p className="text-sm">Tracking: {fulfillment.tracking_number}</p>
                )}

                <div className="flex gap-2">
                  {['pending', 'processing', 'shipped', 'delivered'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={fulfillment.status === status ? 'default' : 'outline'}
                      onClick={() => updateFulfillmentMutation.mutate({
                        fulfillmentId: fulfillment.id,
                        status,
                        tracking: status === 'shipped' ? `TRK${Date.now()}` : fulfillment.tracking_number,
                      })}
                      disabled={updateFulfillmentMutation.isPending}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {fulfillments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No fulfillments found. Create one above to test delivery statuses.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryStatusTester;