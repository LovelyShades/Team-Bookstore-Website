'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import CountUp from 'react-countup';
import { BarChart2, DollarSign, Percent, CalendarDays } from 'lucide-react';

interface Stats {
  totalOrders: number;
  totalSales: number;
  ordersToday: number;
  activeDiscounts: number;
}

export default function AdminSummaryBar() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalSales: 0,
    ordersToday: 0,
    activeDiscounts: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_cents, created_at');

      const { data: discounts } = await supabase
        .from('discounts')
        .select('active')
        .eq('active', true);

      const totalOrders = orders?.length ?? 0;
      const totalSales = orders?.reduce((sum, o) => sum + o.total_cents, 0) ?? 0;
      const today = new Date().toISOString().split('T')[0];
      const ordersToday = orders?.filter(o => o.created_at.startsWith(today)).length ?? 0;

      setStats({
        totalOrders,
        totalSales,
        ordersToday,
        activeDiscounts: discounts?.length ?? 0,
      });
    }

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const cardStyle = "p-4 rounded-lg shadow-sm bg-background";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Total Orders</h3>
            <p className="text-2xl font-bold text-primary">
              <CountUp end={stats.totalOrders} duration={0.8} />
            </p>
          </div>
          <BarChart2 className="h-6 w-6 text-primary" />
        </div>
      </Card>

      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Total Sales</h3>
            <p className="text-2xl font-bold text-accent">
              $<CountUp end={stats.totalSales / 100} duration={0.8} decimals={2} />
            </p>
          </div>
          <DollarSign className="h-6 w-6 text-accent" />
        </div>
      </Card>

      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Orders Today</h3>
            <p className="text-2xl font-bold text-accent">
              <CountUp end={stats.ordersToday} duration={0.8} />
            </p>
          </div>
          <CalendarDays className="h-6 w-6 text-accent" />
        </div>
      </Card>

      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Active Discounts</h3>
            <p className="text-2xl font-bold text-accent">
              <CountUp end={stats.activeDiscounts} duration={0.8} />
            </p>
          </div>
          <Percent className="h-6 w-6 text-accent" />
        </div>
      </Card>
    </div>
  );
}