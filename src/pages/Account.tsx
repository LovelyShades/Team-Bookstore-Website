import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, ShoppingCart, MapPin, LogOut, Shield, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import ShippingAddressManager from '@/components/ShippingAddressManager';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';

const Account = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  const handleUpdateName = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;

      toast.success('Name updated successfully!');
      setIsEditingName(false);
    } catch (error) {
      toast.error('Failed to update name');
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={User}
          title="My Account"
          description="Manage your profile and preferences"
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">
                      {user.user_metadata?.full_name || 'User'}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin && (
                  <Badge variant="secondary" className="status-info">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </Badge>
                )}
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-lg"
                    onClick={() => navigate('/orders')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Orders
                  </Button>
                  
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start rounded-lg"
                      onClick={() => navigate('/admin')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSignOut}
                    variant="destructive"
                    className="w-full rounded-lg"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="bg-card border border-border p-1">
                <TabsTrigger 
                  value="profile"
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="addresses"
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Addresses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Name
                        </label>
                        {isEditingName ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="flex-1 px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
                              placeholder="Enter your full name"
                            />
                            <Button onClick={handleUpdateName} size="sm" className="btn-primary">
                              Save
                            </Button>
                            <Button onClick={() => setIsEditingName(false)} size="sm" variant="outline">
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-foreground">
                              {user.user_metadata?.full_name || 'Not set'}
                            </p>
                            <Button
                              onClick={() => setIsEditingName(true)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email Address
                        </label>
                        <p className="text-foreground">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Account Type
                        </label>
                        <p className="text-foreground">
                          {isAdmin ? 'Administrator' : 'Customer'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Member Since
                        </label>
                        <p className="text-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses">
                <ShippingAddressManager />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Account;
