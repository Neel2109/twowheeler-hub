import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MechanicForm } from '@/components/MechanicForm';
import { getMechanicById } from '@/lib/mechanics';
import { Mechanic } from '@/types/mechanic';

export default function EditMechanicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getMechanicById(id).then(data => setMechanic(data || null)).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!mechanic) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Mechanic' }} />
      <MechanicForm initialData={mechanic} />
    </>
  );
}
