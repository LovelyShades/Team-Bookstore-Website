import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const navItems = [
    { path: '/admin', label: 'Overview', exact: true },
    { path: '/admin/books', label: 'Books' },
    { path: '/admin/discounts', label: 'Discounts' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/fulfillments', label: 'Fulfillments' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <UserCheck className="h-10 w-10 text-primary" />
          <span className="text-foreground">Admin Dashboard</span>
        </h1>

        <div className="flex gap-6">
          <aside className="w-48 border-r pr-6">
            <nav>
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-2 py-1 mb-1 rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
