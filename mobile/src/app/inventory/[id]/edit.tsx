import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { InventoryForm } from '@/components/InventoryForm';
import { getInventoryItemById } from '@/lib/inventory';
import { InventoryItem } from '@/types/inventory';

export default function EditInventoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getInventoryItemById(id).then(data => setItem(data || null)).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!item) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Part' }} />
      <InventoryForm initialData={item} />
    </>
  );
}
