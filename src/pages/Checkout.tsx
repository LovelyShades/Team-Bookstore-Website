import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fulfillmentService } from '@/services/fulfillmentService';
import { shippingAddressService } from '@/services/shippingAddressService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Tag, MapPin, Plus, ChevronRight, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { CartItem as CartItemType, Item } from '@/types';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [discountCode, setDiscountCode] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; pct_off: number } | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: ''
  });

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

  // Fetch user's shipping addresses
  const { data: shippingAddresses = [] } = useQuery({
    queryKey: ['shipping-addresses', user?.id],
    queryFn: () => user ? shippingAddressService.getUserShippingAddresses(user.id) : [],
    enabled: !!user,
  });

  // Set default address when addresses load
  useEffect(() => {
    if (shippingAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = shippingAddresses.find(addr => addr.is_default) || shippingAddresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [shippingAddresses, selectedAddressId]);

  // Phone number formatting function
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Return original if not enough digits
    if (digits.length < 10) return phone;
    
    // Format as (XXX) XXX-XXXX
    const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!cartData) throw new Error('No cart found');
      
      let addressId = selectedAddressId;
      
      // If no existing address is selected and we have new address data, create it
      if (!selectedAddressId && shippingAddresses.length === 0) {
        if (!newAddress.line1 || !newAddress.city || !newAddress.postal_code) {
          throw new Error('Please fill in all required address fields');
        }
        
        const createdAddress = await shippingAddressService.createShippingAddress(user!.id, {
          ...newAddress,
          is_default: true // First address becomes default
        });
        
        if (!createdAddress) {
          throw new Error('Failed to create shipping address');
        }
        
        addressId = createdAddress.id;
      }
      
      if (!addressId) throw new Error('Please select or add a shipping address');

      const { data, error } = await supabase.rpc('fn_checkout' as any, {
        p_cart_id: cartData.cartId,
        p_discount_code: appliedDiscount?.code || null,
        p_shipping_address_id: addressId,
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
    onSuccess: async (data) => {
      // Invalidate queries first
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      
      // Create fulfillments for the new order
      if (data && typeof data === 'object' && 'order_id' in data) {
        try {
          const orderId = (data as any).order_id;
          const fulfillmentSuccess = await fulfillmentService.createFulfillmentsForOrder(orderId);
          if (fulfillmentSuccess) {
            toast.success('Order placed successfully! Fulfillment tracking initialized.');
          } else {
            toast.success('Order placed successfully! (Fulfillment setup pending)');
          }
        } catch (error) {
          console.error('Error creating fulfillments:', error);
          toast.success('Order placed successfully! (Fulfillment setup pending)');
        }
      } else {
        toast.success('Order placed successfully!');
      }
      
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

  const subtotal = cartData.items.reduce((sum, item) => {
    const isOnSale = item.items.on_sale && item.items.sale_price_cents;
    const discountedPrice = isOnSale ? (item.items.sale_price_cents || item.items.price_cents) : item.items.price_cents;
    return sum + discountedPrice * item.qty;
  }, 0);

  const discountAmount = appliedDiscount ? Math.round((subtotal * appliedDiscount.pct_off) / 100) : 0;
  const afterDiscount = subtotal - discountAmount;
  const tax = Math.round(afterDiscount * 0.0825);
  const total = afterDiscount + tax;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    setIsValidatingDiscount(true);
    try {
      const { data, error } = await supabase.rpc('fn_validate_discount' as any, {
        p_discount_code: discountCode.trim()
      });

      if (error) {
        console.error('Discount validation error:', error);
        toast.error('Failed to validate discount code');
        setAppliedDiscount(null);
        return;
      }

      const result = data as { valid: boolean; error?: string; code?: string; pct_off?: number };

      if (!result.valid) {
        const errorMessages = {
          INVALID_CODE: 'Invalid discount code',
          INACTIVE: 'This discount code is no longer active',
          EXPIRED: 'This discount code has expired',
          USAGE_LIMIT: 'This discount code has reached its usage limit'
        };
        toast.error(errorMessages[result.error as keyof typeof errorMessages] || 'Invalid discount code');
        setAppliedDiscount(null);
        return;
      }

      setAppliedDiscount({ code: result.code!, pct_off: result.pct_off || 0 });
      toast.success(`Discount applied: ${result.pct_off}% off!`);
    } catch (error) {
      console.error('Discount validation error:', error);
      toast.error('Failed to validate discount code');
      setAppliedDiscount(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Checkout
            </h1>
            <p className="text-muted-foreground">Complete your purchase</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-medium mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            {cartData.items.map((item) => {
              const isOnSale = item.items.on_sale && item.items.sale_price_cents;
              const salePercent = item.items.sale_percentage || 0;
              const discountedPrice = isOnSale ? (item.items.sale_price_cents || item.items.price_cents) : item.items.price_cents;

              return (
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
                      {isOnSale && (
                        <p className="text-xs text-accent font-semibold">{salePercent}% OFF</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {isOnSale && (
                      <p className="text-sm line-through text-muted-foreground">
                        ${((item.items.price_cents * item.qty) / 100).toFixed(2)}
                      </p>
                    )}
                    <p className={`font-medium ${isOnSale ? 'text-accent' : 'text-foreground'}`}>
                      ${((discountedPrice * item.qty) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-accent font-medium">
                <span>Discount ({appliedDiscount.code} - {appliedDiscount.pct_off}%)</span>
                <span>-${(discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground">
              <span>Shipping</span>
              <span>$0.00</span>
            </div>
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
              onChange={(e) => {
                setDiscountCode(e.target.value.toUpperCase());
                if (appliedDiscount) setAppliedDiscount(null);
              }}
              className="flex-1"
              disabled={isValidatingDiscount}
            />
            <Button
              variant="outline"
              onClick={handleApplyDiscount}
              disabled={isValidatingDiscount || !discountCode.trim()}
              className="rounded-lg min-w-[100px]"
            >
              {isValidatingDiscount ? 'Checking...' : 'Apply'}
            </Button>
          </div>
          {appliedDiscount ? (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-accent font-semibold">
                ✓ {appliedDiscount.pct_off}% discount applied!
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDiscountCode('');
                  setAppliedDiscount(null);
                  toast.info('Discount removed');
                }}
                className="h-6 text-xs"
              >
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Enter code and click Apply to see discount
            </p>
          )}
        </div>

        {/* Shipping Address */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-medium mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </h3>
          {shippingAddresses.length > 0 ? (
            <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select shipping address" />
              </SelectTrigger>
              <SelectContent>
                {shippingAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {address.label || 'Address'}
                        {address.is_default && <span className="text-sm text-muted-foreground ml-2">(Default)</span>}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {address.line1}{address.line2 && `, ${address.line2}`}, {address.city}, {address.state} {address.postal_code}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">Add your shipping address to continue</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Address Label</label>
                  <Input
                    placeholder="Home, Work, etc."
                    value={newAddress.label}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                    onBlur={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setNewAddress(prev => ({ ...prev, phone: formatted }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Street Address *</label>
                <Input
                  placeholder="123 Main St"
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, line1: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Apartment, Suite, etc.</label>
                <Input
                  placeholder="Apt 4B"
                  value={newAddress.line2}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, line2: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">City *</label>
                  <Input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">State</label>
                  <Input
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ZIP Code *</label>
                  <Input
                    placeholder="12345"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  This address will be saved to your account and set as default
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/account')}
                  className="flex items-center gap-1 text-sm"
                >
                  Manage Addresses
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Place Order */}
        <Button
          size="lg"
          className="btn-primary w-full"
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