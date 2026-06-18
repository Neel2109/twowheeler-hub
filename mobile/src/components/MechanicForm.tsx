import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Mechanic } from '@/types/mechanic';
import { addMechanic, updateMechanic } from '@/lib/mechanics';
import { useRouter } from 'expo-router';

interface MechanicFormProps {
  initialData?: Mechanic;
}

export function MechanicForm({ initialData }: MechanicFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [baseSalary, setBaseSalary] = useState(initialData?.baseSalary.toString() || '0');
  const [commissionRate, setCommissionRate] = useState(initialData?.commissionRate.toString() || '0');
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();

  const handleSave = async () => {
    if (!name) return alert('Name is required');

    setSaving(true);
    try {
      const mechanicData = {
        name,
        phone,
        baseSalary: parseFloat(baseSalary) || 0,
        commissionRate: parseFloat(commissionRate) || 0,
      };

      if (initialData) {
        await updateMechanic({ ...initialData, ...mechanicData });
      } else {
        await addMechanic(mechanicData);
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
        <Text className="text-sm font-medium text-foreground mb-1">Full Name <Text className="text-destructive">*</Text></Text>
        <TextInput 
          className="border border-border rounded-md p-3 text-foreground bg-background mb-4"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rahul Sharma"
          placeholderTextColor="#9ca3af"
        />

        <Text className="text-sm font-medium text-foreground mb-1">Phone Number</Text>
        <TextInput 
          className="border border-border rounded-md p-3 text-foreground bg-background mb-4"
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 9876543210"
          keyboardType="phone-pad"
          placeholderTextColor="#9ca3af"
        />

        <View className="flex-row gap-x-4 mb-6">
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground mb-1">Base Salary (₹)</Text>
            <TextInput 
              className="border border-border rounded-md p-3 text-foreground bg-background"
              value={baseSalary}
              onChangeText={setBaseSalary}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground mb-1">Commission (%)</Text>
            <TextInput 
              className="border border-border rounded-md p-3 text-foreground bg-background"
              value={commissionRate}
              onChangeText={setCommissionRate}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Pressable 
          onPress={handleSave} 
          disabled={saving}
          className={`py-3 rounded-md items-center ${saving ? 'bg-primary/70' : 'bg-primary'}`}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Mechanic</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}
