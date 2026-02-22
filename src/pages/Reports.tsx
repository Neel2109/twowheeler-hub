import { useState } from 'react';
import { getOrdersByDateRange, calculateTotals } from '@/lib/repair-orders';
import { generateRepairOrderPDF } from '@/lib/pdf-generator';
import { RepairOrder } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [orders, setOrders] = useState<RepairOrder[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    const data = await getOrdersByDateRange(dateFrom, dateTo);
    setOrders(data);
    setLoading(false);
  };

  const totalRevenue = orders?.reduce((sum, o) => sum + calculateTotals(o.spareParts, o.laborCharges, o.discount, o.gstInfo).finalAmount, 0) || 0;

  const downloadDailyPDF = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders to generate PDF');
      return;
    }

    const doc = new jsPDF();
    const fromDate = new Date(dateFrom).toLocaleDateString('en-IN', { dateStyle: 'long' });
    const toDate = new Date(dateTo).toLocaleDateString('en-IN', { dateStyle: 'long' });
    const title = dateFrom === dateTo ? `Repair Orders — ${fromDate}` : `Repair Orders — ${fromDate} to ${toDate}`;

    // Header
    doc.setFillColor(30, 35, 50);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 165, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIDAR AUTO CARE', 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(title, 105, 22, { align: 'center' });

    // Summary table
    const rows = orders.map((o, i) => {
      const t = calculateTotals(o.spareParts, o.laborCharges, o.discount, o.gstInfo);
      return [
        i + 1,
        o.roNumber,
        new Date(o.dateIn).toLocaleDateString('en-IN'),
        o.customerName,
        o.vehicleNumber,
        `${o.brand} ${o.model}`,
        o.status,
        `₹${t.finalAmount.toFixed(0)}`,
      ];
    });

    autoTable(doc, {
      startY: 38,
      head: [['#', 'RO Number', 'Date', 'Customer', 'Vehicle No.', 'Vehicle', 'Status', 'Amount']],
      body: rows,
      foot: [['', '', '', '', '', '', 'Total', `₹${totalRevenue.toFixed(0)}`]],
      theme: 'striped',
      headStyles: { fillColor: [30, 35, 50], textColor: [255, 165, 0], fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], textColor: [30, 35, 50], fontStyle: 'bold' },
      styles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | Total Orders: ${orders.length}`, 105, 285, { align: 'center' });

    const fileName = dateFrom === dateTo ? `RepairOrders-${dateFrom}.pdf` : `RepairOrders-${dateFrom}-to-${dateTo}.pdf`;
    doc.save(fileName);
    toast.success('PDF downloaded');
  };

  const downloadIndividualPDF = (order: RepairOrder) => {
    generateRepairOrderPDF(order);
    toast.success(`${order.roNumber} PDF downloaded`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Reports & PDFs</h1>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Date Range Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end flex-wrap">
            <div><Label className="text-xs">From Date</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To Date</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
            <Button onClick={handleFetch} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null} View Orders
            </Button>
            {orders && orders.length > 0 && (
              <Button variant="outline" onClick={downloadDailyPDF}>
                <FileDown className="w-4 h-4 mr-1" /> Download Summary PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {orders !== null && (
        <>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Orders: <strong>{orders.length}</strong></span>
            <span className="text-muted-foreground">Total Revenue: <strong className="text-primary">₹{totalRevenue.toFixed(0)}</strong></span>
          </div>

          {orders.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No orders found for selected dates</CardContent></Card>
          ) : (
            <div className="grid gap-2">
              {orders.map(order => {
                const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount, order.gstInfo);
                return (
                  <Card key={order.id} className="hover:border-primary/40 transition-colors">
                    <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
                      <Link to={`/orders/${order.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-semibold">{order.roNumber}</span>
                          <p className="text-xs text-muted-foreground truncate">{order.customerName} • {order.vehicleNumber} • {order.brand} {order.model}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm">₹{totals.finalAmount.toFixed(0)}</span>
                        <StatusBadge status={order.status} />
                        <Button size="sm" variant="ghost" onClick={() => downloadIndividualPDF(order)}>
                          <FileDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
