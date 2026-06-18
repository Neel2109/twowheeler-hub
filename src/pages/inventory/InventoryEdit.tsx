import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InventoryForm } from '@/components/InventoryForm';
import { InventoryItem } from '@/types/inventory';
import { getInventoryItemById } from '@/lib/inventory';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getInventoryItemById(id)
        .then(setItem)
        .catch(e => {
          toast.error('Failed to load item');
          navigate('/inventory');
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!item) return <div className="text-center p-12 text-muted-foreground">Item not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Inventory Item</h2>
        <p className="text-muted-foreground">Update details for {item.partName}.</p>
      </div>
      <InventoryForm initialData={item} />
    </div>
  );
}
