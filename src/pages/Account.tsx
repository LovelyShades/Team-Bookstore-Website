import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Account = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Account</h1>

      <div className="border p-6 mb-6">
        <div className="font-bold mb-2">{user.user_metadata?.full_name || 'User'}</div>
        <div className="text-gray-600 mb-4">{user.email}</div>
        {isAdmin && <div className="text-sm bg-gray-200 inline-block px-2 py-1">Admin</div>}
      </div>

      <div className="border p-6 mb-6">
        <div className="mb-2">
          <button onClick={() => navigate('/orders')} className="underline">
            View Orders
          </button>
        </div>
        {isAdmin && (
          <div className="mb-2">
            <button onClick={() => navigate('/admin')} className="underline">
              Admin Dashboard
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={handleSignOut}
        className="bg-black text-white px-4 py-2"
      >
        Sign Out
      </button>
    </div>
  );
};

export default Account;
