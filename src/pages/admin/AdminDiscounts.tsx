import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDiscounts() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    pct_off: 10,
    max_uses: null as number | null,
    expires_at: '',
    active: true,
  });

  const { data: discounts, isLoading } = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('discounts').insert([{
        ...data,
        expires_at: data.expires_at || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      toast.success('Discount code created!');
      setFormData({ code: '', pct_off: 10, max_uses: null, expires_at: '', active: true });
    },
    onError: (error: any) => {
      toast.error('Failed to create discount: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('code', code);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      toast.success('Discount deleted!');
    },
    onError: (error: any) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ code, active }: { code: string; active: boolean }) => {
      const { error } = await supabase
        .from('discounts')
        .update({ active })
        .eq('code', code);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      toast.success('Discount updated!');
    },
    onError: (error: any) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Discount Codes</h2>
          <p className="text-muted-foreground">Create and manage promotional codes</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Discount Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Discount Code</CardTitle>
            <CardDescription>Add a new promotional discount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code">Discount Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER2025"
              />
            </div>

            <div>
              <Label htmlFor="pct_off">Percent Off</Label>
              <Input
                id="pct_off"
                type="number"
                min="1"
                max="100"
                value={formData.pct_off}
                onChange={(e) => setFormData(prev => ({ ...prev, pct_off: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="max_uses">Max Uses (optional)</Label>
              <Input
                id="max_uses"
                type="number"
                value={formData.max_uses || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <Label htmlFor="expires_at">Expires At (optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>

            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.code || createMutation.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Discount
            </Button>
          </CardContent>
        </Card>

        {/* Existing Discounts */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Discounts</CardTitle>
            <CardDescription>Manage your discount codes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : discounts && discounts.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {discounts.map((discount) => (
                  <Card key={discount.code} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{discount.code}</span>
                          <span className="text-sm bg-accent text-accent-foreground px-2 py-1 rounded">
                            {discount.pct_off}% off
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <p>Used: {discount.used_count} {discount.max_uses ? `/ ${discount.max_uses}` : ''}</p>
                          {discount.expires_at && (
                            <p>Expires: {new Date(discount.expires_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={discount.active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ code: discount.code, active: checked })
                          }
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteMutation.mutate(discount.code)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No discounts created yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
