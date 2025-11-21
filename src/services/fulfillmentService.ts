import { supabase } from '@/integrations/supabase/client';
import { OrderFulfillment } from '@/types';

export interface CreateFulfillmentData {
  order_id: string;
  item_id: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipped_qty?: number;
  tracking_number?: string;
}

export interface UpdateFulfillmentData {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipped_qty?: number;
  tracking_number?: string;
  fulfilled_by?: string;
  fulfilled_at?: string;
  shipped_at?: string;
}

export const fulfillmentService = {
  // Create a new fulfillment record
  async createFulfillment(data: CreateFulfillmentData): Promise<OrderFulfillment | null> {
    try {
      console.log('Creating fulfillment with data:', data);
      
      const { data: result, error } = await supabase
        .from('order_fulfillments')
        .insert({
          order_id: data.order_id,
          item_id: data.item_id,
          status: data.status || 'pending',
          shipped_qty: data.shipped_qty || 0,
          tracking_number: data.tracking_number || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating fulfillment:', error);
        return null;
      }
      
      console.log('Created fulfillment result:', result);
      return result as OrderFulfillment;
    } catch (error) {
      console.error('Error in createFulfillment:', error);
      return null;
    }
  },

  // Get fulfillments for a specific order
  async getFulfillmentsByOrderId(orderId: string): Promise<OrderFulfillment[]> {
    try {
      const { data, error } = await supabase
        .from('order_fulfillments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching fulfillments by order ID:', error);
        return [];
      }
      return (data || []) as OrderFulfillment[];
    } catch (error) {
      console.error('Error in getFulfillmentsByOrderId:', error);
      return [];
    }
  },

  // Get fulfillments for a specific order item
  async getFulfillmentsByOrderItem(orderId: string, itemId: string): Promise<OrderFulfillment[]> {
    try {
      const { data, error } = await supabase
        .from('order_fulfillments')
        .select('*')
        .eq('order_id', orderId)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching fulfillments by order item:', error);
        return [];
      }
      return (data || []) as OrderFulfillment[];
    } catch (error) {
      console.error('Error in getFulfillmentsByOrderItem:', error);
      return [];
    }
  },

  // Get all pending fulfillments (for admin dashboard)
  async getPendingFulfillments(): Promise<any[]> {
    try {
      console.log('Fetching pending fulfillments...');
      
      // First, get the basic fulfillments
      const { data: fulfillments, error: fulfillmentError } = await supabase
        .from('order_fulfillments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (fulfillmentError) {
        console.error('Error fetching pending fulfillments:', fulfillmentError);
        return [];
      }

      if (!fulfillments || fulfillments.length === 0) {
        console.log('No pending fulfillments found');
        return [];
      }

      // Get additional data for each fulfillment
      const enrichedFulfillments = await Promise.all(
        fulfillments.map(async (fulfillment) => {
          // Get order data
          const { data: order } = await supabase
            .from('orders')
            .select('id, customer_email, created_at')
            .eq('id', fulfillment.order_id)
            .single();

          // Get item data
          const { data: item } = await supabase
            .from('items')
            .select('name, img_url, author')
            .eq('id', fulfillment.item_id)
            .single();

          return {
            ...fulfillment,
            orders: order,
            items: item,
          };
        })
      );
      
      console.log('Fetched pending fulfillments:', enrichedFulfillments);
      return enrichedFulfillments;
    } catch (error) {
      console.error('Error in getPendingFulfillments:', error);
      return [];
    }
  },

  // Update fulfillment status and details
  async updateFulfillment(fulfillmentId: string, data: UpdateFulfillmentData): Promise<OrderFulfillment | null> {
    try {
      const updateData: any = { ...data };
      
      // Auto-set timestamps based on status changes
      if (data.status === 'processing' && !data.fulfilled_at) {
        updateData.fulfilled_at = new Date().toISOString();
      }
      if (data.status === 'shipped' && !data.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from('order_fulfillments')
        .update(updateData)
        .eq('id', fulfillmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating fulfillment:', error);
        return null;
      }
      return result as OrderFulfillment;
    } catch (error) {
      console.error('Error in updateFulfillment:', error);
      return null;
    }
  },

  // Mark fulfillment as shipped with tracking
  async markAsShipped(fulfillmentId: string, trackingNumber: string, shippedQty?: number): Promise<OrderFulfillment | null> {
    return this.updateFulfillment(fulfillmentId, {
      status: 'shipped',
      tracking_number: trackingNumber,
      shipped_qty: shippedQty,
      shipped_at: new Date().toISOString(),
    });
  },

  // Mark fulfillment as delivered
  async markAsDelivered(fulfillmentId: string): Promise<OrderFulfillment | null> {
    return this.updateFulfillment(fulfillmentId, {
      status: 'delivered',
    });
  },

  // Cancel fulfillment
  async cancelFulfillment(fulfillmentId: string): Promise<OrderFulfillment | null> {
    return this.updateFulfillment(fulfillmentId, {
      status: 'cancelled',
    });
  },

  // Cancel all fulfillments for an order (only if all are pending)
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      console.log('Attempting to cancel order:', orderId);
      
      // First, get all fulfillments for this order with more details
      const { data: fulfillments, error: fetchError } = await supabase
        .from('order_fulfillments')
        .select('id, status, shipped_qty, order_id')
        .eq('order_id', orderId);

      if (fetchError) {
        console.error('Error fetching fulfillments for cancellation:', fetchError);
        return false;
      }

      if (!fulfillments || fulfillments.length === 0) {
        console.log('No fulfillments found for order:', orderId);
        return false;
      }

      console.log('Found fulfillments for cancellation:', fulfillments);

      // Check if all fulfillments are pending and unshipped
      const allPending = fulfillments.every(f => f.status === 'pending');
      const allUnshipped = fulfillments.every(f => f.shipped_qty === 0);
      
      console.log('All pending?', allPending, 'All unshipped?', allUnshipped);
      
      if (!allPending) {
        console.error('Cannot cancel order - some fulfillments are not pending:', fulfillments.filter(f => f.status !== 'pending'));
        return false;
      }
      
      if (!allUnshipped) {
        console.error('Cannot cancel order - some fulfillments have shipped items:', fulfillments.filter(f => f.shipped_qty > 0));
        return false;
      }

      // Update all fulfillments to cancelled
      console.log('Attempting to update fulfillments to cancelled...');
      const { data: updateResult, error: updateError } = await supabase
        .from('order_fulfillments')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId)
        .select();

      if (updateError) {
        console.error('Error cancelling fulfillments:', updateError);
        console.error('Error details:', JSON.stringify(updateError, null, 2));
        return false;
      }

      console.log('Update result:', updateResult);
      console.log('Successfully cancelled order:', orderId);
      return true;
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      return false;
    }
  },

  // Check if an order can be cancelled (all fulfillments are pending)
  async canCancelOrder(orderId: string): Promise<boolean> {
    try {
      console.log('Checking if order can be cancelled:', orderId);
      const { data: fulfillments, error } = await supabase
        .from('order_fulfillments')
        .select('status, shipped_qty')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error checking if order can be cancelled:', error);
        return false;
      }

      if (!fulfillments || fulfillments.length === 0) {
        console.log('No fulfillments found for order, cannot cancel:', orderId);
        return false;
      }

      const allPending = fulfillments.every(f => f.status === 'pending');
      const allUnshipped = fulfillments.every(f => f.shipped_qty === 0);
      const canCancel = allPending && allUnshipped;
      
      console.log('Can cancel order?', canCancel, 'fulfillments:', fulfillments);
      return canCancel;
    } catch (error) {
      console.error('Error in canCancelOrder:', error);
      return false;
    }
  },

  // Automatically create fulfillments when an order is placed
  async createFulfillmentsForOrder(orderId: string): Promise<boolean> {
    try {
      console.log('Creating fulfillments for order:', orderId);
      
      // Get order items for this order
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select('item_id, qty')
        .eq('order_id', orderId);

      if (orderError) {
        console.error('Error fetching order items:', orderError);
        return false;
      }
      
      console.log('Found order items:', orderItems);
      
      if (!orderItems?.length) {
        console.log('No order items found for order:', orderId);
        return true; // No items to fulfill
      }

      // Create fulfillment records for each order item
      const fulfillmentPromises = orderItems.map(item => {
        console.log('Creating fulfillment for item:', item);
        return this.createFulfillment({
          order_id: orderId,
          item_id: item.item_id,
          status: 'pending',
          shipped_qty: 0,
        });
      });

      const results = await Promise.allSettled(fulfillmentPromises);
      console.log('Fulfillment creation results:', results);
      
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value !== null).length;
      
      console.log(`Successfully created ${successCount} out of ${orderItems.length} fulfillments`);
      return successCount === orderItems.length;
    } catch (error) {
      console.error('Error in createFulfillmentsForOrder:', error);
      return false;
    }
  },

  // Get fulfillment statistics for admin dashboard
  async getFulfillmentStats(): Promise<{
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('order_fulfillments')
        .select('status');

      if (error) {
        console.error('Error fetching fulfillment stats:', error);
        return {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        };
      }

      const stats = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      (data || []).forEach((fulfillment: any) => {
        if (fulfillment.status in stats) {
          stats[fulfillment.status as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getFulfillmentStats:', error);
      return {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
    }
  },
};