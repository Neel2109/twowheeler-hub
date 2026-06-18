import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '@/types/inventory';
import { addInventoryItem, updateInventoryItem } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  initialData?: InventoryItem;
}

export function InventoryForm({ initialData }: Props) {
  const [partName, setPartName] = useState(initialData?.partName || '');
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode || '');
  const [currentStock, setCurrentStock] = useState(initialData?.currentStock.toString() || '0');
  const [minimumStock, setMinimumStock] = useState(initialData?.minimumStock.toString() || '5');
  const [rate, setRate] = useState(initialData?.rate.toString() || '0');
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!partName) return toast.error('Part Name is required');

    setSaving(true);
    try {
      const itemData = {
        partName,
        hsnCode,
        currentStock: parseInt(currentStock) || 0,
        minimumStock: parseInt(minimumStock) || 0,
        rate: parseFloat(rate) || 0,
      };

      if (initialData) {
        await updateInventoryItem({ ...initialData, ...itemData, updatedAt: new Date().toISOString() });
        toast.success('Inventory item updated');
      } else {
        await addInventoryItem(itemData);
        toast.success('Inventory item created');
      }
      navigate('/inventory');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Inventory Item' : 'Add Inventory Item'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Part Name <span className="text-destructive">*</span></Label>
          <Input 
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            placeholder="e.g. Brake Pad"
          />
        </div>

        <div className="space-y-2">
          <Label>HSN Code</Label>
          <Input 
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            placeholder="e.g. 8714"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Current Stock</Label>
            <Input 
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Min Stock Alert</Label>
            <Input 
              type="number"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Rate (₹)</Label>
          <Input 
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Part
        </Button>
      </CardContent>
    </Card>
  );
}
