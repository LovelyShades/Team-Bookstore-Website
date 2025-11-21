import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingAddressService, CreateShippingAddressData, UpdateShippingAddressData } from '@/services/shippingAddressService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Plus, Edit, Trash2, Star, StarOff } from 'lucide-react';
import { toast } from 'sonner';
import { ShippingAddress } from '@/types';

interface ShippingAddressFormData extends CreateShippingAddressData {}

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function ShippingAddressManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [formData, setFormData] = useState<ShippingAddressFormData>({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
    is_default: false,
  });

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['shipping-addresses', user?.id],
    queryFn: () => user ? shippingAddressService.getUserShippingAddresses(user.id) : [],
    enabled: !!user,
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: CreateShippingAddressData) =>
      shippingAddressService.createShippingAddress(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('Shipping address added successfully');
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating address:', error);
      toast.error('Failed to add shipping address');
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShippingAddressData }) =>
      shippingAddressService.updateShippingAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('Shipping address updated successfully');
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating address:', error);
      toast.error('Failed to update shipping address');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => shippingAddressService.deleteShippingAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('Shipping address deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete shipping address');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (addressId: string) => shippingAddressService.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      toast.success('Default address updated');
    },
    onError: (error) => {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    },
  });

  const resetForm = () => {
    setFormData({
      label: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      phone: '',
      is_default: false,
    });
    setEditingAddress(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = shippingAddressService.validateAddress(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      createAddressMutation.mutate(formData);
    }
  };

  const handleEdit = (address: ShippingAddress) => {
    setFormData({
      label: address.label || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default,
    });
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDelete = (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate(addressId);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to manage shipping addresses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Shipping Addresses</h2>
            <p className="text-muted-foreground">Manage your delivery addresses</p>
          </div>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress ? 'Update your shipping address details' : 'Add a new shipping address to your account'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="label">Address Label (Optional)</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., Home, Work, Office"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="line1">Address Line 1 *</Label>
                  <Input
                    id="line1"
                    value={formData.line1}
                    onChange={(e) => setFormData(prev => ({ ...prev, line1: e.target.value }))}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="line2">Address Line 2</Label>
                  <Input
                    id="line2"
                    value={formData.line2}
                    onChange={(e) => setFormData(prev => ({ ...prev, line2: e.target.value }))}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  {formData.country === 'US' ? (
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State/Province"
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="postal_code">Postal Code *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="Postal code"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, is_default: checked as boolean }))
                      }
                    />
                    <Label htmlFor="is_default">Set as default address</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-lg"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  className="btn-primary"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          [...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))
        ) : addresses.length > 0 ? (
          addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {address.label || 'Address'}
                    </CardTitle>
                    {address.is_default && (
                      <Badge variant="default" className="status-success">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!address.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(address.id)}
                      disabled={deleteAddressMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {shippingAddressService.formatAddress(address, true)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No addresses yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first shipping address to get started
            </p>
            <Button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
