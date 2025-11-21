import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutGrid, ShoppingCart, Package, BookOpen, Percent, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/admin', label: 'Overview', icon: LayoutGrid },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/fulfillments', label: 'Fulfillments', icon: Package },
    { to: '/admin/books', label: 'Books', icon: BookOpen },
    { to: '/admin/discounts', label: 'Discounts', icon: Percent },
  ];

  const SidebarContent = () => (
    <nav className="space-y-2 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Admin Panel
        </h2>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setIsSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-foreground hover:bg-accent/10"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-border bg-background sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-20 left-4 z-40 bg-background border border-border shadow-md"
              aria-label="Open admin menu"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
};
