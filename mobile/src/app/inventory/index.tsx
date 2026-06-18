import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Package, Plus, AlertCircle, Edit, Trash2 } from 'lucide-react-native';
import { getInventory, deleteInventoryItem } from '@/lib/inventory';
import { InventoryItem } from '@/types/inventory';

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchItems = () => {
    setLoading(true);
    getInventory().then(setItems).catch(err => {
      Alert.alert('Error', err.message);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this part?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteInventoryItem(id);
          fetchItems();
        } catch(e: any) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Inventory Management' }} />
      <View className="flex-1 bg-background">
        <View className="flex-row justify-between p-4 border-b border-border bg-card items-center">
          <Text className="text-xl font-bold text-foreground">Spare Parts</Text>
          <Pressable 
            onPress={() => router.push('/inventory/create')}
            className="flex-row bg-primary px-3 py-2 rounded-md items-center"
          >
            <Plus size={16} color="white" />
            <Text className="text-white ml-1 font-medium">Add Part</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
        ) : (
          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {items.length === 0 ? (
              <View className="items-center py-10">
                <Package size={48} color="#9ca3af" className="mb-4" />
                <Text className="text-muted-foreground">No inventory items found.</Text>
              </View>
            ) : (
              items.map(item => {
                const isLowStock = item.currentStock <= item.minimumStock;
                return (
                  <View key={item.id} className={`p-4 rounded-xl border mb-3 bg-card ${isLowStock ? 'border-destructive/50' : 'border-border'}`}>
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">{item.partName}</Text>
                        <Text className="text-muted-foreground text-xs">HSN: {item.hsnCode || 'N/A'}</Text>
                      </View>
                      <Text className="text-lg font-bold text-foreground">₹{item.rate.toFixed(0)}</Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center mt-2">
                      <View className="flex-row items-center">
                        <Text className="text-sm font-medium text-muted-foreground mr-2">Stock:</Text>
                        <Text className={`text-lg font-bold ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                          {item.currentStock}
                        </Text>
                        {isLowStock && <AlertCircle size={14} color="#ef4444" className="ml-1" />}
                      </View>
                      <View className="flex-row gap-x-4">
                        <Pressable onPress={() => router.push(`/inventory/${item.id}/edit`)}>
                          <Edit size={20} color="#3b82f6" />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(item.id)}>
                          <Trash2 size={20} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}
