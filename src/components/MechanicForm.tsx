import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mechanic } from '@/types/mechanic';
import { addMechanic, updateMechanic } from '@/lib/mechanics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  initialData?: Mechanic;
}

export function MechanicForm({ initialData }: Props) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [active, setActive] = useState(initialData?.active ?? true);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!name) return toast.error('Name is required');

    setSaving(true);
    try {
      const mechanicData = { name, phone, role, active };

      if (initialData) {
        await updateMechanic({ ...initialData, ...mechanicData, updatedAt: new Date().toISOString() });
        toast.success('Mechanic updated');
      } else {
        await addMechanic(mechanicData);
        toast.success('Mechanic created');
      }
      navigate('/mechanics');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Mechanic' : 'Add Mechanic'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name <span className="text-destructive">*</span></Label>
          <Input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Kumar"
          />
        </div>

        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 9876543210"
          />
        </div>

        <div className="space-y-2">
          <Label>Specialization / Role</Label>
          <Input 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Engine Specialist"
          />
        </div>

        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Active Status</Label>
            <p className="text-sm text-muted-foreground">Is this mechanic currently available for assignment?</p>
          </div>
          <Switch 
            checked={active}
            onCheckedChange={setActive}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Mechanic
        </Button>
      </CardContent>
    </Card>
  );
}
