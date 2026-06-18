import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { InventoryItem } from '@/types/inventory';
import { addInventoryItem, updateInventoryItem } from '@/lib/inventory';
import { useRouter } from 'expo-router';

interface InventoryFormProps {
  initialData?: InventoryItem;
}

export function InventoryForm({ initialData }: InventoryFormProps) {
  const [partName, setPartName] = useState(initialData?.partName || '');
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode || '');
  const [currentStock, setCurrentStock] = useState(initialData?.currentStock.toString() || '0');
  const [minimumStock, setMinimumStock] = useState(initialData?.minimumStock.toString() || '5');
  const [rate, setRate] = useState(initialData?.rate.toString() || '0');
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();

  const handleSave = async () => {
    if (!partName) return alert('Part Name is required');

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
      } else {
        await addInventoryItem(itemData);
      }
      router.back();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <View className="bg-card p-4 rounded-xl border border-border">
        <Text className="text-sm font-medium text-foreground mb-1">Part Name <Text className="text-destructive">*</Text></Text>
        <TextInput 
          className="border border-border rounded-md p-3 text-foreground bg-background mb-4"
          value={partName}
          onChangeText={setPartName}
          placeholder="e.g. Brake Pad"
          placeholderTextColor="#9ca3af"
        />

        <Text className="text-sm font-medium text-foreground mb-1">HSN Code</Text>
        <TextInput 
          className="border border-border rounded-md p-3 text-foreground bg-background mb-4"
          value={hsnCode}
          onChangeText={setHsnCode}
          placeholder="e.g. 8714"
          placeholderTextColor="#9ca3af"
        />

        <View className="flex-row gap-x-4 mb-4">
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground mb-1">Current Stock</Text>
            <TextInput 
              className="border border-border rounded-md p-3 text-foreground bg-background"
              value={currentStock}
              onChangeText={setCurrentStock}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground mb-1">Min Stock Alert</Text>
            <TextInput 
              className="border border-border rounded-md p-3 text-foreground bg-background"
              value={minimumStock}
              onChangeText={setMinimumStock}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text className="text-sm font-medium text-foreground mb-1">Rate (₹)</Text>
        <TextInput 
          className="border border-border rounded-md p-3 text-foreground bg-background mb-6"
          value={rate}
          onChangeText={setRate}
          keyboardType="numeric"
        />

        <Pressable 
          onPress={handleSave} 
          disabled={saving}
          className={`py-3 rounded-md items-center ${saving ? 'bg-primary/70' : 'bg-primary'}`}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Part</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}
