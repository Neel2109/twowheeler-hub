import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RepairOrder, VehicleType, SparePart, LaborCharge, GSTInfo, BRANDS, STATUS_OPTIONS, ROStatus } from '@/types/repair-order';
import { generateRONumber, addRepairOrder, updateRepairOrder, calculateTotals } from '@/lib/repair-orders';
import { generateRepairOrderPDF } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Trash2, FileDown, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  existing?: RepairOrder;
}

export function ROForm({ existing }: Props) {
  const navigate = useNavigate();
  const isEdit = !!existing;
  const isDelivered = existing?.status === 'Delivered';

  const [form, setForm] = useState<Omit<RepairOrder, 'id' | 'roNumber' | 'createdAt' | 'updatedAt'>>({
    dateIn: existing?.dateIn || new Date().toISOString().split('T')[0],
    customerName: existing?.customerName || '',
    mobileNumber: existing?.mobileNumber || '',
    vehicleNumber: existing?.vehicleNumber || '',
    vehicleType: existing?.vehicleType || 'Bike',
    brand: existing?.brand || '',
    model: existing?.model || '',
    customerComplaints: existing?.customerComplaints || '',
    serviceDetails: existing?.serviceDetails || '',
    remarks: existing?.remarks || '',
    status: existing?.status || 'Open',
    spareParts: existing?.spareParts || [],
    laborCharges: existing?.laborCharges || [],
    discount: existing?.discount || 0,
    gstInfo: existing?.gstInfo || { garageGSTIN: '', customerGSTIN: '', cgstRate: 9, sgstRate: 9 },
  });

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const addPart = () => {
    update('spareParts', [...form.spareParts, { id: crypto.randomUUID(), partName: '', hsnCode: '', quantity: 1, rate: 0, total: 0 }]);
  };

  const updatePart = (id: string, field: string, value: any) => {
    update('spareParts', form.spareParts.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      updated.total = updated.quantity * updated.rate;
      return updated;
    }));
  };

  const removePart = (id: string) => update('spareParts', form.spareParts.filter(p => p.id !== id));

  const addLabor = () => {
    update('laborCharges', [...form.laborCharges, { id: crypto.randomUUID(), description: '', amount: 0 }]);
  };

  const updateLabor = (id: string, field: string, value: any) => {
    update('laborCharges', form.laborCharges.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLabor = (id: string) => update('laborCharges', form.laborCharges.filter(l => l.id !== id));

  const { partsTotal, laborTotal, subtotal, taxableAmount, cgstAmount, sgstAmount, totalGST, finalAmount } = calculateTotals(form.spareParts, form.laborCharges, form.discount, form.gstInfo);

  const updateGST = (field: keyof GSTInfo, value: any) => {
    update('gstInfo', { ...form.gstInfo, [field]: value });
  };

  const handleSave = () => {
    if (!form.customerName || !form.mobileNumber || !form.vehicleNumber || !form.brand || !form.model) {
      toast.error('Please fill all required fields');
      return;
    }

    const now = new Date().toISOString();
    if (isEdit && existing) {
      const updated = { ...existing, ...form, updatedAt: now };
      updateRepairOrder(updated);
      toast.success('Repair Order updated');
      navigate(`/orders/${existing.id}`);
    } else {
      const order: RepairOrder = {
        id: crypto.randomUUID(),
        roNumber: generateRONumber(),
        ...form,
        createdAt: now,
        updatedAt: now,
      };
      addRepairOrder(order);
      toast.success(`Repair Order ${order.roNumber} created`);
      navigate(`/orders/${order.id}`);
    }
  };

  const handlePDF = () => {
    if (isEdit && existing) {
      generateRepairOrderPDF({ ...existing, ...form });
      toast.success('PDF downloaded');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{isEdit ? `Edit ${existing.roNumber}` : 'New Repair Order'}</h2>
          {isEdit && <StatusBadge status={form.status as ROStatus} />}
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <Button variant="outline" onClick={handlePDF}>
              <FileDown className="w-4 h-4 mr-1" /> PDF
            </Button>
          )}
          <Button onClick={handleSave} disabled={isDelivered}>
            <Save className="w-4 h-4 mr-1" /> {isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>

      {isDelivered && (
        <div className="bg-muted border border-border rounded-lg p-3 text-sm text-muted-foreground">
          This order is delivered and locked for editing.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={e => update('customerName', e.target.value)} disabled={isDelivered} />
              </div>
              <div>
                <Label>Mobile Number *</Label>
                <Input value={form.mobileNumber} onChange={e => update('mobileNumber', e.target.value)} disabled={isDelivered} />
              </div>
            </div>
            <div>
              <Label>Date In</Label>
              <Input type="date" value={form.dateIn} onChange={e => update('dateIn', e.target.value)} disabled={isDelivered} />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vehicle No. *</Label>
                <Input value={form.vehicleNumber} onChange={e => update('vehicleNumber', e.target.value.toUpperCase())} disabled={isDelivered} placeholder="MH12AB1234" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.vehicleType} onValueChange={v => update('vehicleType', v)} disabled={isDelivered}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Scooter">Scooter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brand *</Label>
                <Select value={form.brand} onValueChange={v => update('brand', v)} disabled={isDelivered}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model *</Label>
                <Input value={form.model} onChange={e => update('model', e.target.value)} disabled={isDelivered} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GST Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">GST Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Garage GSTIN</Label>
              <Input value={form.gstInfo.garageGSTIN} onChange={e => updateGST('garageGSTIN', e.target.value.toUpperCase())} disabled={isDelivered} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <Label>Customer GSTIN (Optional)</Label>
              <Input value={form.gstInfo.customerGSTIN} onChange={e => updateGST('customerGSTIN', e.target.value.toUpperCase())} disabled={isDelivered} placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CGST Rate (%)</Label>
              <Input type="number" value={form.gstInfo.cgstRate} onChange={e => updateGST('cgstRate', Number(e.target.value))} disabled={isDelivered} min={0} max={28} />
            </div>
            <div>
              <Label>SGST Rate (%)</Label>
              <Input type="number" value={form.gstInfo.sgstRate} onChange={e => updateGST('sgstRate', Number(e.target.value))} disabled={isDelivered} min={0} max={28} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints & Service */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Service Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEdit && (
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)} disabled={isDelivered}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Customer Complaints</Label>
            <Textarea value={form.customerComplaints} onChange={e => update('customerComplaints', e.target.value)} rows={3} disabled={isDelivered} />
          </div>
          <div>
            <Label>Service Details</Label>
            <Textarea value={form.serviceDetails} onChange={e => update('serviceDetails', e.target.value)} rows={3} disabled={isDelivered} />
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={e => update('remarks', e.target.value)} rows={2} disabled={isDelivered} />
          </div>
        </CardContent>
      </Card>

      {/* Spare Parts */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Spare Parts</CardTitle>
          {!isDelivered && (
            <Button size="sm" variant="outline" onClick={addPart}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Part
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {form.spareParts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No spare parts added</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_100px_80px_100px_100px_40px] gap-2 text-xs font-semibold text-muted-foreground px-1">
                <span>Part Name</span><span>HSN Code</span><span>Qty</span><span>Rate (₹)</span><span>Total (₹)</span><span />
              </div>
              {form.spareParts.map(p => (
                <div key={p.id} className="grid grid-cols-[1fr_100px_80px_100px_100px_40px] gap-2 items-center">
                  <Input value={p.partName} onChange={e => updatePart(p.id, 'partName', e.target.value)} disabled={isDelivered} placeholder="Part name" />
                  <Input value={p.hsnCode} onChange={e => updatePart(p.id, 'hsnCode', e.target.value)} disabled={isDelivered} placeholder="HSN" />
                  <Input type="number" value={p.quantity} onChange={e => updatePart(p.id, 'quantity', Number(e.target.value))} disabled={isDelivered} min={1} />
                  <Input type="number" value={p.rate} onChange={e => updatePart(p.id, 'rate', Number(e.target.value))} disabled={isDelivered} />
                  <Input value={`₹${p.total.toFixed(2)}`} disabled className="font-mono" />
                  {!isDelivered && (
                    <Button size="icon" variant="ghost" onClick={() => removePart(p.id)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="text-right font-semibold text-sm pt-2 pr-12">Parts Total: ₹{partsTotal.toFixed(2)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labor */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Labor & Service Charges</CardTitle>
          {!isDelivered && (
            <Button size="sm" variant="outline" onClick={addLabor}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Service
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {form.laborCharges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No labor charges added</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_120px_40px] gap-2 text-xs font-semibold text-muted-foreground px-1">
                <span>Description</span><span>Amount (₹)</span><span />
              </div>
              {form.laborCharges.map(l => (
                <div key={l.id} className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
                  <Input value={l.description} onChange={e => updateLabor(l.id, 'description', e.target.value)} disabled={isDelivered} placeholder="Service description" />
                  <Input type="number" value={l.amount} onChange={e => updateLabor(l.id, 'amount', Number(e.target.value))} disabled={isDelivered} />
                  {!isDelivered && (
                    <Button size="icon" variant="ghost" onClick={() => removeLabor(l.id)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="text-right font-semibold text-sm pt-2 pr-12">Labor Total: ₹{laborTotal.toFixed(2)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-end gap-1.5 text-sm">
            <div className="flex gap-8"><span className="text-muted-foreground">Parts Total:</span><span className="font-mono">₹{partsTotal.toFixed(2)}</span></div>
            <div className="flex gap-8"><span className="text-muted-foreground">Labor Total:</span><span className="font-mono">₹{laborTotal.toFixed(2)}</span></div>
            <div className="flex gap-8"><span className="text-muted-foreground">Subtotal:</span><span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span></div>
            <div className="flex gap-8 items-center">
              <span className="text-muted-foreground">Discount:</span>
              <Input
                type="number"
                value={form.discount}
                onChange={e => update('discount', Number(e.target.value))}
                disabled={isDelivered}
                className="w-28 text-right font-mono"
              />
            </div>
            <div className="flex gap-8"><span className="text-muted-foreground">Taxable Amount:</span><span className="font-mono">₹{taxableAmount.toFixed(2)}</span></div>
            <div className="flex gap-8"><span className="text-muted-foreground">CGST ({form.gstInfo.cgstRate}%):</span><span className="font-mono">₹{cgstAmount.toFixed(2)}</span></div>
            <div className="flex gap-8"><span className="text-muted-foreground">SGST ({form.gstInfo.sgstRate}%):</span><span className="font-mono">₹{sgstAmount.toFixed(2)}</span></div>
            <div className="flex gap-8 text-lg mt-2 pt-2 border-t border-primary/30">
              <span className="font-bold text-primary">Final Amount (Incl. GST):</span>
              <span className="font-mono font-bold text-primary">₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
