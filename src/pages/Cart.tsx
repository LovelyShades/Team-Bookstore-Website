// src/pages/Cart.tsx
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { CartItem as CartItemType, Item } from "@/types";

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Fetch user cart + items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!cart) return [];

      const { data, error } = await supabase
        .from("cart_items")
        .select("*, items(*)")
        .eq("cart_id", cart.id);

      if (error) throw error;
      return data as (CartItemType & { items: Item })[];
    },
    enabled: !!user,
  });

  // --- Update qty / delete item
  const updateQuantityMutation = useMutation({
    mutationFn: async ({
      itemId,
      newQty,
    }: {
      itemId: string;
      newQty: number;
    }) => {
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (newQty === 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cart!.id)
          .eq("item_id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ qty: newQty })
          .eq("cart_id", cart!.id)
          .eq("item_id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: () => toast.error("Failed to update cart"),
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.items.price_cents * item.qty,
    0
  );

  // --- Unauthenticated view
  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md text-center bg-card backdrop-blur-sm border-border p-8">
          <ShoppingBag className="h-20 w-20 mx-auto mb-6 text-muted" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Sign in to view your cart
          </h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to access your shopping cart.
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

  // --- Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // --- Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-6">
            Shopping Cart
          </h1>
          <Card className="text-center bg-card backdrop-blur-sm border-border py-12">
            <svg
              className="w-24 h-24 mx-auto text-muted mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-6">Add some books to get started!</p>
            <Link to="/catalog">
              <Button size="lg" className="rounded-lg">Browse Books</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // --- Main cart
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.item_id}
                className="bg-card backdrop-blur-sm border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-6">
                  <img
                    src={item.items.img_url || "/placeholder.svg"}
                    alt={item.items.name}
                    className="h-32 w-24 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <Link to={`/book/${item.item_id}`}>
                      <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                        {item.items.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">Various Authors</p>
                    <p className="text-lg font-bold text-primary mt-2">
                      ${(item.items.price_cents / 100).toFixed(2)}
                    </p>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantityMutation.mutate({
                              itemId: item.item_id,
                              newQty: item.qty - 1,
                            })
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantityMutation.mutate({
                              itemId: item.item_id,
                              newQty: item.qty + 1,
                            })
                          }
                          disabled={item.qty >= item.items.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error hover:bg-destructive/10"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            itemId: item.item_id,
                            newQty: 0,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${((item.items.price_cents * item.qty) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="bg-card backdrop-blur-sm border-border p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-foreground text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="btn-primary w-full mb-4"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </Button>

              <Link to="/catalog">
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:bg-accent rounded-lg"
                >
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
