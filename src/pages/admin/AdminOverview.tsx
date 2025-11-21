import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, BarChart2, BookOpen, ShoppingCart, Users, DollarSign, CalendarDays, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { startOfWeek, startOfMonth, addDays, addWeeks, addMonths, format, isBefore } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountUp from 'react-countup';

export default function AdminOverview() {
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
      color: 'text-success',
      showCountUp: true,
      isCurrency: true,
    },
    {
      title: 'Orders Today',
      value: stats?.ordersToday || 0,
      icon: CalendarDays,
      color: 'text-info',
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
      <div>
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="h-7 w-7 text-primary" />
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        </div>
        <p className="text-muted-foreground">Quick stats about your bookstore</p>
      </div>

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
          <div className="flex gap-2">
            <BarChart2 className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold">Order Stats</span>
          </div>
        </CardHeader>
        <CardContent className="h-96 w-full flex items-center">
          <div className="flex-1 h-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No order data available</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
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
          <Tabs defaultValue={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList className="translate-x-[-36px] -translate-y-40">
              {(['daily', 'weekly', 'monthly'] as const).map((v) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="w-full bg-transparent text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
