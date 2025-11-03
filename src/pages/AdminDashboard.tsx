import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

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
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin</h1>

      <div className="flex gap-6">
        <aside className="w-48 border-r pr-6">
          <nav>
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-2 py-1 mb-1 ${active ? 'bg-black text-white' : ''}`}
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
  );
}
