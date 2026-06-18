import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Users, Plus, Edit, Trash2 } from 'lucide-react-native';
import { getMechanics, deleteMechanic } from '@/lib/mechanics';
import { Mechanic } from '@/types/mechanic';

export default function MechanicsScreen() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMechanics = () => {
    setLoading(true);
    getMechanics().then(setMechanics).catch(err => {
      Alert.alert('Error', err.message);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Delete this mechanic?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteMechanic(id);
          fetchMechanics();
        } catch(e: any) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Staff & Mechanics' }} />
      <View className="flex-1 bg-background">
        <View className="flex-row justify-between p-4 border-b border-border bg-card items-center">
          <Text className="text-xl font-bold text-foreground">Mechanics</Text>
          <Pressable 
            onPress={() => router.push('/mechanics/create')}
            className="flex-row bg-primary px-3 py-2 rounded-md items-center"
          >
            <Plus size={16} color="white" />
            <Text className="text-white ml-1 font-medium">Add Staff</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
        ) : (
          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {mechanics.length === 0 ? (
              <View className="items-center py-10">
                <Users size={48} color="#9ca3af" className="mb-4" />
                <Text className="text-muted-foreground">No mechanics found.</Text>
              </View>
            ) : (
              mechanics.map(m => (
                <View key={m.id} className="p-4 rounded-xl border border-border mb-3 bg-card">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-lg font-semibold text-foreground">{m.name}</Text>
                      <Text className="text-muted-foreground text-sm">{m.phone || 'No phone number'}</Text>
                    </View>
                    <View className="flex-row gap-x-4">
                      <Pressable onPress={() => router.push(`/mechanics/${m.id}/edit`)}>
                        <Edit size={20} color="#3b82f6" />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(m.id)}>
                        <Trash2 size={20} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                  <View className="flex-row mt-2 bg-muted/50 p-2 rounded-md">
                    <View className="flex-1 items-center">
                      <Text className="text-xs text-muted-foreground">Base Salary</Text>
                      <Text className="font-semibold text-foreground">₹{m.baseSalary}</Text>
                    </View>
                    <View className="flex-1 items-center border-l border-border">
                      <Text className="text-xs text-muted-foreground">Commission</Text>
                      <Text className="font-semibold text-foreground">{m.commissionRate}%</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}
