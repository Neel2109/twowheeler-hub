import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { getServiceHistory, calculateTotals } from '@/lib/repair-orders';
import { RepairOrder } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Search as SearchIcon } from 'lucide-react-native';

export default function SearchPage() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [results, setResults] = useState<RepairOrder[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (vehicleNumber.trim()) {
      setLoading(true);
      const data = await getServiceHistory(vehicleNumber.trim().toUpperCase());
      setResults(data);
      setLoading(false);
    }
  };

  const totalSpent = results?.reduce((sum, o) => sum + calculateTotals(o.spareParts, o.laborCharges, o.discount, o.gstInfo).finalAmount, 0) || 0;

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 bg-card border-b border-border">
        <Text className="text-2xl font-bold text-foreground mb-4">Vehicle History</Text>
        
        <View className="flex-row gap-x-2">
          <View className="flex-1 bg-background border border-input rounded-md px-3 h-12 flex-row items-center">
            <TextInput
              className="flex-1 text-foreground"
              placeholder="MH12AB1234"
              placeholderTextColor="#9ca3af"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              onSubmitEditing={handleSearch}
              autoCapitalize="characters"
            />
          </View>
          <Pressable 
            onPress={handleSearch} 
            disabled={loading}
            className={`px-4 h-12 rounded-md flex-row items-center justify-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}
          >
            {loading ? <ActivityIndicator size="small" color="white" /> : <SearchIcon size={20} color="white" />}
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {results !== null && (
          <>
            {results.length === 0 ? (
              <View className="py-10 items-center bg-card rounded-xl border border-border mt-4">
                <Text className="text-muted-foreground text-center">No service history found for {vehicleNumber}</Text>
              </View>
            ) : (
              <>
                <View className="flex-row justify-between mb-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <View>
                    <Text className="text-sm text-muted-foreground mb-1">Total Services</Text>
                    <Text className="text-xl font-bold text-foreground">{results.length}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm text-muted-foreground mb-1">Total Spent</Text>
                    <Text className="text-xl font-bold text-primary font-mono">₹{totalSpent.toFixed(0)}</Text>
                  </View>
                </View>
                
                <View className="gap-y-2">
                  {results.map(order => {
                    const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount, order.gstInfo);
                    return (
                      <Link key={order.id} href={`/orders/${order.id}`} asChild>
                        <Pressable className="bg-card p-4 rounded-xl border border-border flex-row items-center justify-between">
                          <View className="flex-1 pr-2">
                            <Text className="font-mono text-sm font-semibold text-foreground mb-1">{order.roNumber}</Text>
                            <Text className="text-xs text-muted-foreground">
                              {order.brand} {order.model} • {new Date(order.dateIn).toLocaleDateString('en-IN')}
                            </Text>
                          </View>
                          <View className="items-end gap-y-1">
                            <Text className="font-mono text-sm font-medium text-foreground">₹{totals.finalAmount.toFixed(0)}</Text>
                            <StatusBadge status={order.status} />
                          </View>
                        </Pressable>
                      </Link>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
