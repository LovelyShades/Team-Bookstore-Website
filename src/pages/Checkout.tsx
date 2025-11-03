import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { CartItem as CartItemType, Item } from '@/types';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['checkout-cart', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) return null;

      const { data: items, error } = await supabase
        .from('cart_items')
        .select('*, items(*)')
        .eq('cart_id', cart.id);

      if (error) throw error;
      return {
        cartId: cart.id,
        items: items as (CartItemType & { items: Item })[],
      };
    },
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!cartData) throw new Error('No cart found');

      const { data, error } = await supabase.rpc('fn_checkout', {
        p_cart_id: cartData.cartId,
        p_discount_code: discountCode || null,
      });

      if (error) {
        if (error.message.includes('OUT_OF_STOCK')) {
          throw new Error('Some items are out of stock');
        }
        if (error.message.includes('INVALID_DISCOUNT')) {
          throw new Error('Discount code is invalid or expired');
        }
        if (error.message.includes('SESSION_EXPIRED')) {
          throw new Error('Session expired. Please sign in again');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
      navigate('/orders');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      if (error.message.includes('Session expired')) {
        navigate('/auth');
      }
    },
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = cartData.items.reduce(
    (sum, item) => sum + item.items.price_cents * item.qty,
    0
  );
  const discountAmount = Math.round((subtotal * appliedDiscount) / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = Math.round(afterDiscount * 0.0825);
  const total = afterDiscount + tax;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Checkout</h1>

        {/* Order Summary */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-medium mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            {cartData.items.map((item) => (
              <div key={item.item_id} className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <img
                    src={item.items.img_url || '/placeholder.svg'}
                    alt={item.items.name}
                    className="h-16 w-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-foreground">{item.items.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                  </div>
                </div>
                <p className="font-medium text-foreground">
                  ${((item.items.price_cents * item.qty) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-accent">
                <span>Discount ({appliedDiscount}%)</span>
                <span>-${(discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground">
              <span>Tax (8.25%)</span>
              <span>${(tax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground text-xl font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-accent">${(total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Discount Code */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-medium mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Have a discount code?
          </h3>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => {
                // This is just a UI demonstration
                // The actual validation happens in fn_checkout
                toast.info('Discount code will be validated at checkout');
              }}
            >
              Apply
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Discount will be validated when you place your order
          </p>
        </div>

        {/* Place Order */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? 'Processing...' : 'Place Order'}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          By placing your order, you agree to our terms and conditions
        </p>
      </div>
    </div>
  );
};

export default Checkout;
