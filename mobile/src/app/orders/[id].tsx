import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { getRepairOrderById, calculateTotals, deleteRepairOrder, getServiceHistory } from '@/lib/repair-orders';
import { generateRepairOrderPDF } from '@/lib/pdf-generator';
import { RepairOrder } from '@/types/repair-order';
import { StatusBadge } from '@/components/StatusBadge';
import { FileDown, Pencil, Trash2, ArrowLeft, History, MessageCircle } from 'lucide-react-native';
import { Linking } from 'react-native';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [history, setHistory] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getRepairOrderById(id).then(async (o) => {
        if (o) {
          setOrder(o);
          const hist = await getServiceHistory(o.vehicleNumber);
          setHistory(hist.filter(h => h.id !== o.id));
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="hsl(221.2 83.2% 53.3%)" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-muted-foreground mb-4">Order not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary">← Back to orders</Text>
        </Pressable>
      </View>
    );
  }

  const { partsTotal, laborTotal, subtotal, taxableAmount, cgstAmount, sgstAmount, totalGST, finalAmount } = calculateTotals(order.spareParts, order.laborCharges, order.discount, order.gstInfo);

  const handleDelete = () => {
    Alert.alert('Delete Order', 'Delete this repair order?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await deleteRepairOrder(order.id);
          Alert.alert('Success', 'Deleted');
          router.replace('/orders');
        }
      }
    ]);
  };

  const handleDownloadPDF = async () => {
    try {
      await generateRepairOrderPDF(order);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleWhatsApp = async () => {
    try {
      const message = `Hi ${order.customerName},\n\nYour vehicle ${order.vehicleNumber} is currently: *${order.status}*.\nTotal estimate: ₹${finalAmount.toFixed(0)}.\n\nThank you for choosing Patidar Auto Care!`;
      const url = `whatsapp://send?phone=91${order.mobileNumber}&text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row items-center justify-between flex-wrap gap-y-3 mb-6">
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={20} color="hsl(222.2 84% 4.9%)" />
          </Pressable>
          <View>
            <Text className="text-2xl font-bold font-mono text-foreground">{order.roNumber}</Text>
            <Text className="text-sm text-muted-foreground">{new Date(order.dateIn).toLocaleDateString('en-IN')}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        <View className="flex-row gap-x-2">
          <Pressable onPress={handleWhatsApp} className="flex-row items-center border border-border px-3 py-1.5 rounded-md bg-[#25D366]">
            <MessageCircle size={16} color="white" className="mr-1" />
            <Text className="text-sm font-medium text-white">Share</Text>
          </Pressable>

          <Pressable onPress={handleDownloadPDF} className="flex-row items-center border border-border px-3 py-1.5 rounded-md bg-card">
            <FileDown size={16} color="hsl(222.2 84% 4.9%)" className="mr-1" />
            <Text className="text-sm font-medium text-foreground">PDF</Text>
          </Pressable>
          
          {order.status !== 'Delivered' && (
            <Link href={`/orders/${order.id}/edit`} asChild>
              <Pressable className="flex-row items-center border border-border px-3 py-1.5 rounded-md bg-card">
                <Pencil size={16} color="hsl(222.2 84% 4.9%)" className="mr-1" />
                <Text className="text-sm font-medium text-foreground">Edit</Text>
              </Pressable>
            </Link>
          )}
          
          <Pressable onPress={handleDelete} className="bg-destructive px-3 py-1.5 rounded-md flex-row items-center">
            <Trash2 size={16} color="white" />
          </Pressable>
        </View>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-4 mb-4">
        <View className="w-[48%] bg-card p-4 rounded-xl border border-border">
          <Text className="text-sm text-muted-foreground mb-1">Customer</Text>
          <Text className="font-semibold text-lg text-foreground">{order.customerName}</Text>
          <Text className="text-sm text-muted-foreground">{order.mobileNumber}</Text>
        </View>
        <View className="w-[48%] bg-card p-4 rounded-xl border border-border">
          <Text className="text-sm text-muted-foreground mb-1">Vehicle</Text>
          <Text className="font-semibold text-lg text-foreground">{order.vehicleNumber}</Text>
          <Text className="text-sm text-muted-foreground">{order.vehicleType} • {order.brand} {order.model}</Text>
        </View>
      </View>

      {order.customerComplaints && (
        <View className="bg-card p-4 rounded-xl border border-border mb-4">
          <Text className="text-sm text-muted-foreground mb-1">Customer Complaints</Text>
          <Text className="text-sm text-foreground">{order.customerComplaints}</Text>
        </View>
      )}

      {order.serviceDetails && (
        <View className="bg-card p-4 rounded-xl border border-border mb-4">
          <Text className="text-sm text-muted-foreground mb-1">Service Details</Text>
          <Text className="text-sm text-foreground">{order.serviceDetails}</Text>
        </View>
      )}

      {order.spareParts.length > 0 && (
        <View className="bg-card p-4 rounded-xl border border-border mb-4">
          <Text className="text-sm text-muted-foreground mb-2">Spare Parts</Text>
          {order.spareParts.map((p, index) => (
            <View key={p.id} className={`flex-row justify-between py-2 ${index !== order.spareParts.length - 1 ? 'border-b border-border/50' : ''}`}>
              <View className="flex-1 pr-2">
                <Text className="text-foreground">{p.partName}</Text>
                <Text className="text-xs text-muted-foreground">{p.quantity} x ₹{p.rate}</Text>
              </View>
              <Text className="font-mono text-foreground font-medium mt-1">₹{p.total.toFixed(2)}</Text>
            </View>
          ))}
          <View className="flex-row justify-between pt-3 mt-2 border-t border-border">
            <Text className="font-semibold text-foreground">Total Parts:</Text>
            <Text className="font-mono font-semibold text-foreground">₹{partsTotal.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {order.laborCharges.length > 0 && (
        <View className="bg-card p-4 rounded-xl border border-border mb-4">
          <Text className="text-sm text-muted-foreground mb-2">Labor Charges</Text>
          {order.laborCharges.map((l, index) => (
            <View key={l.id} className={`flex-row justify-between py-2 ${index !== order.laborCharges.length - 1 ? 'border-b border-border/50' : ''}`}>
              <Text className="text-foreground flex-1 pr-2">{l.description}</Text>
              <Text className="font-mono text-foreground">₹{l.amount.toFixed(2)}</Text>
            </View>
          ))}
          <View className="flex-row justify-between pt-3 mt-2 border-t border-border">
            <Text className="font-semibold text-foreground">Total Labor:</Text>
            <Text className="font-mono font-semibold text-foreground">₹{laborTotal.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View className="bg-primary/5 p-5 rounded-xl border border-primary/30 mb-6">
        <View className="gap-y-2 text-sm">
          <View className="flex-row justify-between"><Text className="text-muted-foreground">Subtotal:</Text><Text className="font-mono text-foreground">₹{subtotal.toFixed(2)}</Text></View>
          <View className="flex-row justify-between"><Text className="text-muted-foreground">Discount:</Text><Text className="font-mono text-foreground">-₹{order.discount.toFixed(2)}</Text></View>
          <View className="flex-row justify-between"><Text className="text-muted-foreground">Taxable:</Text><Text className="font-mono text-foreground">₹{taxableAmount.toFixed(2)}</Text></View>
          <View className="flex-row justify-between"><Text className="text-muted-foreground">CGST ({order.gstInfo?.cgstRate ?? 9}%):</Text><Text className="font-mono text-foreground">₹{cgstAmount.toFixed(2)}</Text></View>
          <View className="flex-row justify-between"><Text className="text-muted-foreground">SGST ({order.gstInfo?.sgstRate ?? 9}%):</Text><Text className="font-mono text-foreground">₹{sgstAmount.toFixed(2)}</Text></View>
          <View className="flex-row justify-between pt-3 mt-2 border-t border-primary/30">
            <Text className="font-bold text-primary text-lg">Final (Incl. GST):</Text>
            <Text className="font-mono font-bold text-primary text-lg">₹{finalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {history.length > 0 && (
        <View className="bg-card p-4 rounded-xl border border-border mb-6">
          <View className="flex-row items-center gap-x-2 mb-3">
            <History size={16} color="#64748b" />
            <Text className="text-sm text-muted-foreground font-semibold">Previous Service History ({order.vehicleNumber})</Text>
          </View>
          <View className="gap-y-2">
            {history.map(h => (
              <Link key={h.id} href={`/orders/${h.id}`} asChild>
                <Pressable className="flex-row justify-between items-center bg-background p-3 rounded-lg border border-border/50">
                  <View>
                    <Text className="font-mono font-semibold text-foreground">{h.roNumber}</Text>
                    <Text className="text-xs text-muted-foreground">{new Date(h.dateIn).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <StatusBadge status={h.status} />
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
