import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepairOrders, calculateTotals } from '@/lib/repair-orders';
import { RepairOrder, ROStatus } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Clock, CheckCircle, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);

  useEffect(() => {
    setOrders(getRepairOrders());
  }, []);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const todayRevenue = orders
    .filter(o => o.status === 'Delivered' && o.dateIn === new Date().toISOString().split('T')[0])
    .reduce((sum, o) => sum + calculateTotals(o.spareParts, o.laborCharges, o.discount).finalAmount, 0);

  const recentOrders = orders.slice(0, 8);

  const stats = [
    { label: 'Open', value: statusCounts['Open'] || 0, icon: Clock, color: 'text-info' },
    { label: 'In Progress', value: statusCounts['In Progress'] || 0, icon: Wrench, color: 'text-warning' },
    { label: 'Ready', value: statusCounts['Ready for Delivery'] || 0, icon: CheckCircle, color: 'text-success' },
    { label: 'Waiting Parts', value: statusCounts['Waiting for Parts'] || 0, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Patidar Auto Care — Overview</p>
        </div>
        <Link to="/create">
          <Button><Plus className="w-4 h-4 mr-1" /> New Repair Order</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4 flex flex-col items-center text-center">
              <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4 flex flex-col items-center text-center">
            <TrendingUp className="w-6 h-6 mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">₹{todayRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Today's Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Repair Orders</h2>
          <Link to="/orders" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No repair orders yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {recentOrders.map(order => {
              const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount);
              return (
                <Link key={order.id} to={`/orders/${order.id}`}>
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-mono text-sm font-semibold">{order.roNumber}</span>
                          <p className="text-xs text-muted-foreground">{order.customerName} • {order.vehicleNumber}{order.assignedMechanic ? ` • 🔧 ${order.assignedMechanic}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono">₹{totals.finalAmount.toFixed(0)}</span>
                        <StatusBadge status={order.status} />
                        <span className="text-xs text-muted-foreground">{new Date(order.dateIn).toLocaleDateString('en-IN')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
