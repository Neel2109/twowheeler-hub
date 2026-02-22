import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getRepairOrderById } from '@/lib/repair-orders';
import { RepairOrder } from '@/types/repair-order';
import { ROForm } from '@/components/ROForm';
import { Loader2 } from 'lucide-react';

export default function EditRO() {
  const { id } = useParams();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getRepairOrderById(id).then(o => {
        if (o) setOrder(o);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return <p className="text-center py-20 text-muted-foreground">Order not found</p>;

  return <ROForm existing={order} />;
}
