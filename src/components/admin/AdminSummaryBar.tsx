'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
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
  }, []);

  const cardStyle = "p-4 rounded-lg shadow-sm bg-muted/40";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Total Orders</h3>
            <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
          </div>
          <BarChart2 className="h-6 w-6 text-primary" />
        </div>
      </Card>

      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Total Sales</h3>
            <p className="text-2xl font-bold text-green-600">${(stats.totalSales / 100).toFixed(2)}</p>
          </div>
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
      </Card>

      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Orders Today</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.ordersToday}</p>
          </div>
          <CalendarDays className="h-6 w-6 text-blue-600" />
        </div>
      </Card>

      <Card className={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Active Discounts</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.activeDiscounts}</p>
          </div>
          <Percent className="h-6 w-6 text-purple-600" />
        </div>
      </Card>
    </div>
  );
}