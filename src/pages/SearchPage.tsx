import { useState } from 'react';
import { getServiceHistory, calculateTotals } from '@/lib/repair-orders';
import { RepairOrder } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [results, setResults] = useState<RepairOrder[] | null>(null);

  const handleSearch = () => {
    if (vehicleNumber.trim()) {
      setResults(getServiceHistory(vehicleNumber.trim()));
    }
  };

  const totalSpent = results?.reduce((sum, o) => sum + calculateTotals(o.spareParts, o.laborCharges, o.discount).finalAmount, 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Vehicle Service History</h1>

      <Card>
        <CardContent className="pt-5">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Vehicle Number</Label>
              <Input
                placeholder="Enter vehicle number (e.g. MH12AB1234)"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <SearchIcon className="w-4 h-4 mr-1" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {results !== null && (
        <>
          {results.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No service history found for {vehicleNumber}</CardContent></Card>
          ) : (
            <>
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">Total services: <strong>{results.length}</strong></span>
                <span className="text-muted-foreground">Total spent: <strong className="text-primary">₹{totalSpent.toFixed(0)}</strong></span>
              </div>
              <div className="grid gap-2">
                {results.map(order => {
                  const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount);
                  return (
                    <Link key={order.id} to={`/orders/${order.id}`}>
                      <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                        <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-mono text-sm font-semibold">{order.roNumber}</span>
                            <p className="text-xs text-muted-foreground">{order.brand} {order.model} • {new Date(order.dateIn).toLocaleDateString('en-IN')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm">₹{totals.finalAmount.toFixed(0)}</span>
                            <StatusBadge status={order.status} />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
