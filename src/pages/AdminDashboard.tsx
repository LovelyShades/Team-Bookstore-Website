import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
