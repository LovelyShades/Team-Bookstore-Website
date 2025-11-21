import { useAuth } from '@/contexts/AuthContext';

export default function AdminFulfillmentsSimple() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order Fulfillment</h2>
          <p className="text-muted-foreground">Manage order processing and shipping</p>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Test Component</h3>
        <p>This is a simple test to make sure the route works.</p>
        <p>User: {user?.email || 'Not logged in'}</p>
      </div>
    </div>
  );
}