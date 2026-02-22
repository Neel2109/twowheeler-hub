import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getRepairOrderById, calculateTotals, deleteRepairOrder, getServiceHistory } from '@/lib/repair-orders';
import { generateRepairOrderPDF } from '@/lib/pdf-generator';
import { RepairOrder } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Pencil, Trash2, ArrowLeft, History, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [history, setHistory] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getRepairOrderById(id).then(async (o) => {
        if (o) {
          setOrder(o);
          const hist = await getServiceHistory(o.vehicleNumber);
          setHistory(hist.filter(h => h.id !== o.id));
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!order) return (
    <div className="text-center py-20 text-muted-foreground">
      <p>Order not found</p>
      <Link to="/orders" className="text-primary hover:underline text-sm">← Back to orders</Link>
    </div>
  );

  const { partsTotal, laborTotal, subtotal, taxableAmount, cgstAmount, sgstAmount, totalGST, finalAmount } = calculateTotals(order.spareParts, order.laborCharges, order.discount, order.gstInfo);

  const handleDelete = async () => {
    if (confirm('Delete this repair order?')) {
      await deleteRepairOrder(order.id);
      toast.success('Deleted');
      navigate('/orders');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{order.roNumber}</h1>
            <p className="text-sm text-muted-foreground">{new Date(order.dateIn).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { generateRepairOrderPDF(order); toast.success('PDF downloaded'); }}>
            <FileDown className="w-4 h-4 mr-1" /> PDF
          </Button>
          {order.status !== 'Delivered' && (
            <Link to={`/orders/${order.id}/edit`}><Button variant="outline"><Pencil className="w-4 h-4 mr-1" /> Edit</Button></Link>
          )}
          <Button variant="destructive" size="icon" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Customer</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.mobileNumber}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Vehicle</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{order.vehicleNumber}</p>
            <p className="text-sm text-muted-foreground">{order.vehicleType} • {order.brand} {order.model}</p>
          </CardContent>
        </Card>
      </div>

      {order.customerComplaints && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Customer Complaints</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{order.customerComplaints}</p></CardContent>
        </Card>
      )}

      {order.serviceDetails && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Service Details</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{order.serviceDetails}</p></CardContent>
        </Card>
      )}

      {order.spareParts.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Spare Parts</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground text-left"><th className="py-2">Part</th><th>HSN</th><th>Qty</th><th>Rate</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {order.spareParts.map(p => (
                    <tr key={p.id} className="border-b border-border/50"><td className="py-1.5">{p.partName}</td><td className="text-muted-foreground">{p.hsnCode || '-'}</td><td>{p.quantity}</td><td>₹{p.rate}</td><td className="text-right font-mono">₹{p.total.toFixed(2)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={4} className="text-right font-semibold pt-2">Total:</td><td className="text-right font-mono font-semibold pt-2">₹{partsTotal.toFixed(2)}</td></tr></tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {order.laborCharges.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Labor Charges</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground text-left"><th className="py-2">Service</th><th className="text-right">Amount</th></tr></thead>
                <tbody>
                  {order.laborCharges.map(l => (
                    <tr key={l.id} className="border-b border-border/50"><td className="py-1.5">{l.description}</td><td className="text-right font-mono">₹{l.amount.toFixed(2)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td className="text-right font-semibold pt-2">Total:</td><td className="text-right font-mono font-semibold pt-2">₹{laborTotal.toFixed(2)}</td></tr></tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30">
        <CardContent className="pt-5">
          <div className="flex flex-col items-end gap-1 text-sm">
            {order.gstInfo?.garageGSTIN && (
              <div className="flex gap-6 w-full mb-2 pb-2 border-b border-border/50 text-xs text-muted-foreground">
                <span>GSTIN: {order.gstInfo.garageGSTIN}</span>
                {order.gstInfo.customerGSTIN && <span>Customer GSTIN: {order.gstInfo.customerGSTIN}</span>}
              </div>
            )}
            <div className="flex gap-6"><span className="text-muted-foreground">Parts:</span><span className="font-mono">₹{partsTotal.toFixed(2)}</span></div>
            <div className="flex gap-6"><span className="text-muted-foreground">Labor:</span><span className="font-mono">₹{laborTotal.toFixed(2)}</span></div>
            <div className="flex gap-6"><span className="text-muted-foreground">Subtotal:</span><span className="font-mono">₹{subtotal.toFixed(2)}</span></div>
            <div className="flex gap-6"><span className="text-muted-foreground">Discount:</span><span className="font-mono">-₹{order.discount.toFixed(2)}</span></div>
            <div className="flex gap-6"><span className="text-muted-foreground">Taxable Amount:</span><span className="font-mono">₹{taxableAmount.toFixed(2)}</span></div>
            <div className="flex gap-6"><span className="text-muted-foreground">CGST ({order.gstInfo?.cgstRate ?? 9}%):</span><span className="font-mono">₹{cgstAmount.toFixed(2)}</span></div>
            <div className="flex gap-6"><span className="text-muted-foreground">SGST ({order.gstInfo?.sgstRate ?? 9}%):</span><span className="font-mono">₹{sgstAmount.toFixed(2)}</span></div>
            <div className="flex gap-6 text-lg pt-2 border-t border-primary/30 mt-1">
              <span className="font-bold text-primary">Final (Incl. GST):</span>
              <span className="font-mono font-bold text-primary">₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <History className="w-4 h-4" /> Previous Service History ({order.vehicleNumber})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(h => (
                <Link key={h.id} to={`/orders/${h.id}`} className="flex justify-between items-center p-2 rounded-md hover:bg-accent transition-colors text-sm">
                  <div>
                    <span className="font-mono font-semibold">{h.roNumber}</span>
                    <span className="text-muted-foreground ml-2">{new Date(h.dateIn).toLocaleDateString('en-IN')}</span>
                  </div>
                  <StatusBadge status={h.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
