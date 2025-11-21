import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutGrid, BarChart2, BookOpen, ShoppingCart, Users, DollarSign, CalendarDays, Percent, Trash2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { startOfWeek, startOfMonth, addDays, addWeeks, addMonths, format, isBefore } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminOverview() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [booksResult, ordersResult, usersResult, discountsResult] = await Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_cents, created_at'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('discounts').select('active').eq('active', true),
      ]);

      const orders = ordersResult.data || [];
      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + order.total_cents, 0) || 0;
      const today = new Date().toISOString().split('T')[0];
      const ordersToday = orders.filter(o => o.created_at.startsWith(today)).length;

      return {
        totalBooks: booksResult.count || 0,
        totalOrders: ordersResult.data?.length || 0,
        totalUsers: usersResult.count || 0,
        totalRevenue,
        ordersToday,
        activeDiscounts: discountsResult.data?.length || 0,
        orders,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statCards = [
    {
      title: 'Total Books',
      value: stats?.totalBooks || 0,
      icon: BookOpen,
      color: 'text-primary',
      showCountUp: true,
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: BarChart2,
      color: 'text-primary',
      showCountUp: true,
    },
    {
      title: 'Total Revenue',
      value: stats?.totalRevenue || 0,
      icon: DollarSign,
      color: 'text-accent',
      showCountUp: true,
      isCurrency: true,
    },
    {
      title: 'Orders Today',
      value: stats?.ordersToday || 0,
      icon: CalendarDays,
      color: 'text-accent',
      showCountUp: true,
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-secondary-foreground',
      showCountUp: true,
    },
    {
      title: 'Active Discounts',
      value: stats?.activeDiscounts || 0,
      icon: Percent,
      color: 'text-accent',
      showCountUp: true,
    },
  ];

  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const clearOrdersMutation = useMutation({
    mutationFn: async () => {
      // Delete order_items first (foreign key constraint)
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('order_id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (orderItemsError) throw orderItemsError;

      // Then delete orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (ordersError) throw ordersError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('All orders and sales data have been cleared');
    },
    onError: (error: any) => {
      toast.error('Failed to clear orders: ' + (error.message || 'Unknown error'));
    },
  });

  const clearCartsMutation = useMutation({
    mutationFn: async () => {
      // Delete cart_items first
      const { error: cartItemsError } = await supabase
        .from('cart_items')
        .delete()
        .neq('cart_id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (cartItemsError) throw cartItemsError;

      // Then delete carts
      const { error: cartsError } = await supabase
        .from('carts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (cartsError) throw cartsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('All cart data has been cleared');
    },
    onError: (error: any) => {
      toast.error('Failed to clear carts: ' + (error.message || 'Unknown error'));
    },
  });

  const handleClearOrders = () => {
    if (confirm('⚠️ WARNING: This will permanently delete ALL orders and sales data. This action cannot be undone. Are you sure?')) {
      clearOrdersMutation.mutate();
    }
  };

  const handleClearCarts = () => {
    if (confirm('⚠️ WARNING: This will permanently delete ALL shopping carts. This action cannot be undone. Are you sure?')) {
      clearCartsMutation.mutate();
    }
  };

  const orderDates = stats?.orders?.map(o => new Date(o.created_at)) || [];
  const startDate = orderDates.length ? new Date(Math.min(...orderDates.map(d => d.getTime()))) : new Date();
  const endDate = new Date();

  const groupKeyFn = (date: Date) => {
    if (view === 'weekly') return format(startOfWeek(date), 'yyyy-MM-dd');
    if (view === 'monthly') return format(startOfMonth(date), 'yyyy-MM');
    return format(date, 'yyyy-MM-dd');
  };

  const groupedCounts = stats?.orders?.reduce((acc: Record<string, number>, order) => {
    const key = groupKeyFn(new Date(order.created_at));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}) || {};

  const allBuckets: string[] = [];
  let cursor = new Date(startDate);

  while (isBefore(cursor, endDate) || format(cursor, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
    const key = groupKeyFn(cursor);
    if (!allBuckets.includes(key)) {
      allBuckets.push(key);
    }
    cursor =
      view === 'weekly'
        ? addWeeks(cursor, 1)
        : view === 'monthly'
        ? addMonths(cursor, 1)
        : addDays(cursor, 1);
  }

  const chartData = allBuckets.map(date => ({
    date,
    orders: groupedCounts[date] || 0,
  }));

  const chartConfig = {
    orders: {
      label: 'Orders',
      color: 'hsl(var(--primary))',
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          </div>
          <p className="text-muted-foreground">Quick stats about your bookstore</p>
        </div>
      </div>

      {/* Data Management Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Data Management</CardTitle>
          </div>
          <CardDescription>
            Permanently delete data from your database. These actions cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="destructive"
              onClick={handleClearOrders}
              disabled={clearOrdersMutation.isPending || (stats?.totalOrders || 0) === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Orders & Sales Data
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearCarts}
              disabled={clearCartsMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Shopping Carts
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.showCountUp ? (
                    stat.isCurrency ? (
                      <>
                        $<CountUp end={(stat.value as number) / 100} duration={0.8} decimals={2} />
                      </>
                    ) : (
                      <CountUp end={stat.value as number} duration={0.8} />
                    )
                  ) : (
                    stat.value
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-2">
              <BarChart2 className="h-7 w-7 text-primary" />
              <span className="text-lg font-semibold">Order Stats</span>
            </div>
            <Tabs defaultValue={view} onValueChange={(v) => setView(v as typeof view)} className="sm:hidden">
              <TabsList className="grid grid-cols-3 w-full">
                {(['daily', 'weekly', 'monthly'] as const).map((v) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="bg-transparent text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-80 sm:h-96 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No order data available</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
