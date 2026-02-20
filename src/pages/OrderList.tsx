import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRepairOrders, calculateTotals } from '@/lib/repair-orders';
import { RepairOrder, STATUS_OPTIONS, ROStatus } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function OrderList() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setOrders(getRepairOrders());
  }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = !q || o.roNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.vehicleNumber.toLowerCase().includes(q) || o.mobileNumber.includes(q);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesFrom = !dateFrom || o.dateIn >= dateFrom;
    const matchesTo = !dateTo || o.dateIn <= dateTo;
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold">All Repair Orders</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Search</Label>
              <Input placeholder="RO#, Name, Vehicle, Mobile" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Date To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <p className="text-sm text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? 's' : ''} found</p>
      <div className="grid gap-2">
        {filtered.map(order => {
          const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount);
          return (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-semibold">{order.roNumber}</span>
                      <p className="text-xs text-muted-foreground truncate">{order.customerName} • {order.brand} {order.model} • {order.vehicleNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm">₹{totals.finalAmount.toFixed(0)}</span>
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(order.dateIn).toLocaleDateString('en-IN')}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">No orders found</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
