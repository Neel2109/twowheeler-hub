import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { getRepairOrders, calculateTotals } from '@/lib/repair-orders';
import { RepairOrder } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { Wrench, Clock, CheckCircle, AlertTriangle, TrendingUp, Plus, Package, Users } from 'lucide-react-native';

export default function Dashboard() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRepairOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const todayRevenue = orders
    .filter(o => o.status === 'Delivered' && o.dateIn === new Date().toISOString().split('T')[0])
    .reduce((sum, o) => sum + calculateTotals(o.spareParts, o.laborCharges, o.discount).finalAmount, 0);

  const recentOrders = orders.slice(0, 8);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="hsl(221.2 83.2% 53.3%)" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-muted-foreground text-sm mt-1">Patidar Auto Care — Overview</Text>
        </View>
        <Link href="/orders/create" asChild>
          <Pressable className="bg-primary flex-row items-center px-3 py-2 rounded-md">
            <Plus size={16} color="white" />
            <Text className="text-white font-medium ml-1">New RO</Text>
          </Pressable>
        </Link>
      </View>

      <View className="flex-row flex-wrap justify-between mb-6 gap-y-3">
        {[
          { label: 'Open', value: statusCounts['Open'] || 0, icon: Clock, colorValue: '#3b82f6' },
          { label: 'In Progress', value: statusCounts['In Progress'] || 0, icon: Wrench, colorValue: '#f59e0b' },
          { label: 'Ready', value: statusCounts['Ready for Delivery'] || 0, icon: CheckCircle, colorValue: '#22c55e' },
          { label: 'Waiting Parts', value: statusCounts['Waiting for Parts'] || 0, icon: AlertTriangle, colorValue: '#ef4444' },
        ].map(s => (
          <View key={s.label} className="w-[48%] bg-card p-4 rounded-xl border border-border items-center">
            <s.icon size={24} color={s.colorValue} className="mb-2" />
            <Text className="text-2xl font-bold text-foreground">{s.value}</Text>
            <Text className="text-xs text-muted-foreground">{s.label}</Text>
          </View>
        ))}
        <View className="w-[48%] bg-primary/10 p-4 rounded-xl border border-primary/30 items-center">
          <TrendingUp size={24} color="hsl(221.2 83.2% 53.3%)" className="mb-2" />
          <Text className="text-2xl font-bold text-primary">₹{todayRevenue.toFixed(0)}</Text>
          <Text className="text-xs text-primary">Today's Revenue</Text>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">Management</Text>
        <View className="flex-row gap-x-3">
          <Link href="/inventory" asChild>
            <Pressable className="flex-1 bg-card p-4 rounded-xl border border-border items-center flex-row">
              <View className="bg-primary/10 p-2 rounded-lg mr-3">
                <Package size={20} color="hsl(221.2 83.2% 53.3%)" />
              </View>
              <Text className="text-foreground font-medium">Inventory</Text>
            </Pressable>
          </Link>
          <Link href="/mechanics" asChild>
            <Pressable className="flex-1 bg-card p-4 rounded-xl border border-border items-center flex-row">
              <View className="bg-primary/10 p-2 rounded-lg mr-3">
                <Users size={20} color="hsl(221.2 83.2% 53.3%)" />
              </View>
              <Text className="text-foreground font-medium">Staff</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-foreground">Recent Repair Orders</Text>
          <Link href="/orders">
            <Text className="text-sm text-primary">View all →</Text>
          </Link>
        </View>

        {recentOrders.length === 0 ? (
          <View className="bg-card p-8 rounded-xl border border-border items-center">
            <Wrench size={40} color="#9ca3af" className="mb-3" />
            <Text className="text-muted-foreground text-center">No repair orders yet. Create your first one!</Text>
          </View>
        ) : (
          <View className="gap-y-2">
            {recentOrders.map(order => {
              const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount);
              return (
                <Link key={order.id} href={`/orders/${order.id}`} asChild>
                  <Pressable className="bg-card p-4 rounded-xl border border-border flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium text-foreground mb-1">{order.roNumber}</Text>
                      <Text className="text-xs text-muted-foreground">{order.customerName} • {order.vehicleNumber}</Text>
                    </View>
                    <View className="items-end gap-y-1">
                      <Text className="font-medium text-foreground">₹{totals.finalAmount.toFixed(0)}</Text>
                      <StatusBadge status={order.status} />
                    </View>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
