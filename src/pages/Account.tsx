import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, ShoppingCart, MapPin, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import ShippingAddressManager from '@/components/ShippingAddressManager';

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
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">My Account</h1>

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
                        <p className="text-foreground">
                          {user.user_metadata?.full_name || 'Not set'}
                        </p>
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
                    
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        To update your profile information, please contact support.
                      </p>
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
    </div>
  );
};

export default Account;
