import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const Navbar = () => {
  const { user, isAdmin } = useAuth();

  const { data: cartCount = 0 } = useQuery({
    queryKey: ['cart-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!cart) return 0;
      
      const { data: items } = await supabase
        .from('cart_items')
        .select('qty')
        .eq('cart_id', cart.id);
      
      return items?.reduce((sum, item) => sum + item.qty, 0) || 0;
    },
    enabled: !!user,
  });

  return (
    <nav className="border-b bg-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between">
        <Link to="/" className="font-bold">Bookstore</Link>
        <div className="flex gap-4">
          <Link to="/catalog">Catalog</Link>
          <Link to="/cart">Cart {cartCount > 0 && `(${cartCount})`}</Link>
          <Link to="/orders">Orders</Link>
          {user ? (
            <>
              <Link to="/account">Account</Link>
              {isAdmin && <Link to="/admin">Admin</Link>}
            </>
          ) : (
            <Link to="/auth">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};
