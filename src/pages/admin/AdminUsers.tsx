import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Search, Edit, Save, X, Trash2, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface UserWithRole {
  id: string;
  full_name: string | null;
  user_roles: Array<{ role: string }>;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState({ full_name: '', role: '' });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: '', password: '', full_name: '', role: 'user' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id).map(r => ({ role: r.role })) || []
      })) || [];
      
      return usersWithRoles;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, full_name }: { userId: string; full_name: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated!');
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      // First, delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated!');
    },
    onError: (error: any) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });

  const deleteUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Note: This will delete user roles and profile data
      // The actual auth user will still exist in auth.users
      // You may want to use Supabase's deleteUser() function via a secure admin endpoint

      // Delete user roles first
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .in('user_id', userIds);
      if (rolesError) throw rolesError;

      // Delete profiles
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds);
      if (profilesError) throw profilesError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Users removed successfully!');
      setSelectedUsers(new Set());
    },
    onError: (error: any) => {
      toast.error('Failed to remove users: ' + error.message);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; full_name: string; role: string }) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Add role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: authData.user.id, role: userData.role }]);

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created successfully!');
      setShowAddUser(false);
      setNewUserData({ email: '', password: '', full_name: '', role: 'user' });
    },
    onError: (error: any) => {
      toast.error('Failed to create user: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user: UserWithRole) => {
    setEditingUser(user.id);
    setEditData({
      full_name: user.full_name || '',
      role: user.user_roles[0]?.role || 'user',
    });
  };

  const handleSave = (userId: string) => {
    const currentUser = users?.find(u => u.id === userId);
    const currentRole = currentUser?.user_roles[0]?.role || 'user';

    // Check if we're changing the last admin to non-admin
    if (currentRole === 'admin' && editData.role !== 'admin') {
      const allAdmins = users?.filter(u => u.user_roles[0]?.role === 'admin') || [];
      if (allAdmins.length === 1) {
        toast.error('Cannot change the last admin user! At least one admin must remain.');
        setEditingUser(null);
        return;
      }
    }

    updateMutation.mutate({ userId, full_name: editData.full_name });
    if (editData.role !== currentRole) {
      updateRoleMutation.mutate({ userId, role: editData.role as 'admin' | 'moderator' | 'user' });
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers?.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers?.map(u => u.id) || []));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.size === 0) return;

    // Check if we're trying to delete all admins
    const selectedUsersList = Array.from(selectedUsers);
    const allAdmins = users?.filter(u => u.user_roles[0]?.role === 'admin') || [];
    const selectedAdmins = allAdmins.filter(admin => selectedUsersList.includes(admin.id));

    if (selectedAdmins.length === allAdmins.length && allAdmins.length > 0) {
      toast.error('Cannot delete all admin users! At least one admin must remain.');
      return;
    }

    if (confirm(`Are you sure you want to remove ${selectedUsers.size} user(s)? This will delete their profile and role data.`)) {
      deleteUsersMutation.mutate(selectedUsersList);
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
      toast.error('Please fill in all fields');
      return;
    }
    createUserMutation.mutate(newUserData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">View and manage user accounts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>All Users</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedUsers.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteUsersMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove ({selectedUsers.size})
                </Button>
              )}
              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user account with email and password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        placeholder="John Doe"
                        value={newUserData.full_name}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUserData.role}
                        onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddUser(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 border-b">
                <Checkbox
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">Select All ({filteredUsers.length})</span>
              </div>
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  {editingUser === user.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editData.full_name}
                          onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Full Name"
                        />
                        <Select
                          value={editData.role}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(user.id)}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                        />
                        <div>
                          <p className="font-semibold">{user.full_name || 'No name set'}</p>
                          <p className="text-sm text-muted-foreground">
                            Role: {user.user_roles[0]?.role || 'user'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
