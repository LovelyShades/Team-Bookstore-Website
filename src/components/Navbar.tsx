import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Menu, X, ShoppingCart, Heart, Package, User, LogIn, Shield, Tag, BookOpen, BookHeart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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

  const menuItems = [
    { to: '/catalog', label: 'Catalog', icon: BookOpen },
    { to: '/discounts', label: 'Sale', icon: Tag },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { to: '/orders', label: 'Orders', icon: Package },
  ];

  const NavLink = ({ to, label, icon: Icon, badge, mobile = false }: { to: string; label: string; icon?: any; badge?: number; mobile?: boolean }) => (
    <Link
      to={to}
      onClick={() => setIsOpen(false)}
      className={mobile
        ? "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-colors text-foreground"
        : "text-foreground hover:text-primary transition-colors font-medium"
      }
    >
      {Icon && mobile && <Icon className="h-5 w-5" />}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={mobile
          ? "ml-auto bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-bold"
          : "ml-1 text-accent font-bold"
        }>
          {mobile ? badge : `(${badge})`}
        </span>
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo - Left */}
          <Link
            to="/"
            className="font-bold text-xl text-primary hover:text-primary/80 transition-colors flex-shrink-0 flex items-center gap-2"
          >
            <BookHeart className="h-6 w-6 text-accent" />
            <span className="hidden sm:inline">Hearts & Pages</span>
            <span className="sm:hidden">H&P</span>
          </Link>

          {/* Desktop Navigation - Center/Right */}
          <div className="hidden md:flex items-center gap-6">
            {menuItems.map(item => (
              <NavLink key={item.to} {...item} />
            ))}

            {user ? (
              <>
                <NavLink to="/account" label="Account" icon={User} />
                {isAdmin && <NavLink to="/admin" label="Admin" icon={Shield} />}
              </>
            ) : (
              <NavLink to="/auth" label="Sign In" icon={LogIn} />
            )}
          </div>

          {/* Mobile Menu Button - Right */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-primary"
                  aria-label="Open menu"
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left text-primary">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-2 mt-8">
                  {menuItems.map(item => (
                    <NavLink key={item.to} {...item} mobile />
                  ))}

                  <div className="border-t border-border my-4" />

                  {user ? (
                    <>
                      <NavLink to="/account" label="Account" icon={User} mobile />
                      {isAdmin && <NavLink to="/admin" label="Admin" icon={Shield} mobile />}
                    </>
                  ) : (
                    <NavLink to="/auth" label="Sign In" icon={LogIn} mobile />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
