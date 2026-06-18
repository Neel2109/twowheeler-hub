import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { getRepairOrders, calculateTotals } from '@/lib/repair-orders';
import { RepairOrder, STATUS_OPTIONS } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Search } from 'lucide-react-native';

export default function OrderList() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    getRepairOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = !q || o.roNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.vehicleNumber.toLowerCase().includes(q) || o.mobileNumber.includes(q);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="hsl(221.2 83.2% 53.3%)" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 bg-card border-b border-border">
        <Text className="text-2xl font-bold text-foreground mb-4">All Orders</Text>
        
        <View className="flex-row items-center bg-background border border-input rounded-md px-3 h-10 mb-4">
          <Search size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-foreground"
            placeholder="Search RO#, Name, Vehicle..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-1">
            <Pressable
              onPress={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full mr-2 ${statusFilter === 'all' ? 'bg-primary' : 'bg-secondary'}`}
            >
              <Text className={`text-sm font-medium ${statusFilter === 'all' ? 'text-primary-foreground' : 'text-secondary-foreground'}`}>
                All
              </Text>
            </Pressable>
            {STATUS_OPTIONS.map(status => (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full mr-2 ${statusFilter === status ? 'bg-primary' : 'bg-secondary'}`}
              >
                <Text className={`text-sm font-medium ${statusFilter === status ? 'text-primary-foreground' : 'text-secondary-foreground'}`}>
                  {status}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="text-sm text-muted-foreground mb-3">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''} found
        </Text>
        
        <View className="gap-y-2">
          {filtered.map(order => {
            const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount);
            return (
              <Link key={order.id} href={`/orders/${order.id}`} asChild>
                <Pressable className="bg-card p-4 rounded-xl border border-border flex-row items-center justify-between">
                  <View className="flex-1 min-w-0 mr-4">
                    <Text className="font-medium text-foreground mb-1">{order.roNumber}</Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                      {order.customerName} • {order.brand} {order.model} • {order.vehicleNumber}
                    </Text>
                  </View>
                  <View className="items-end gap-y-1 shrink-0">
                    <Text className="font-medium text-foreground">₹{totals.finalAmount.toFixed(0)}</Text>
                    <StatusBadge status={order.status} />
                    <Text className="text-xs text-muted-foreground">{new Date(order.dateIn).toLocaleDateString('en-IN')}</Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
          
          {filtered.length === 0 && (
            <View className="py-10 items-center">
              <Text className="text-muted-foreground text-center">No orders found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
