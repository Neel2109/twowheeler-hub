import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getRepairOrderById } from '@/lib/repair-orders';
import { RepairOrder } from '@/types/repair-order';
import { ROForm } from '@/components/ROForm';

export default function EditRO() {
  const { id } = useParams();
  const [order, setOrder] = useState<RepairOrder | null>(null);

  useEffect(() => {
    if (id) {
      const o = getRepairOrderById(id);
      if (o) setOrder(o);
    }
  }, [id]);

  if (!order) return <p className="text-center py-20 text-muted-foreground">Order not found</p>;

  return <ROForm existing={order} />;
}
