import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { getRepairOrderById } from '@/lib/repair-orders';
import { RepairOrder } from '@/types/repair-order';
import { ROForm } from '@/components/ROForm';

export default function EditRO() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getRepairOrderById(id).then(o => setOrder(o || null)).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="hsl(221.2 83.2% 53.3%)" /></View>;
  if (!order) return <View className="flex-1 justify-center items-center"><Text>Order not found</Text></View>;

  return <ROForm existing={order} />;
}
