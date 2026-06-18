import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { getOrdersByDateRange, calculateTotals } from '@/lib/repair-orders';
import { getMechanics } from '@/lib/mechanics';
import { generateRepairOrderPDF } from '@/lib/pdf-generator';
import { RepairOrder } from '@/types/repair-order';
import { Mechanic } from '@/types/mechanic';
import { StatusBadge } from '@/components/StatusBadge';
import { FileDown, CalendarDays } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [orders, setOrders] = useState<RepairOrder[] | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMechanics().then(setMechanics).catch(console.error);
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    const data = await getOrdersByDateRange(dateFrom, dateTo);
    setOrders(data);
    setLoading(false);
  };

  const getMechanicName = (id?: string) => mechanics.find(m => m.id === id)?.name || 'Unassigned';

  const totalRevenue = orders?.filter(o => !o.isEstimate).reduce((sum, o) => sum + calculateTotals(o.spareParts, o.laborCharges, o.discount, o.gstInfo).finalAmount, 0) || 0;
  const totalEstimates = orders?.filter(o => o.isEstimate).reduce((sum, o) => sum + calculateTotals(o.spareParts, o.laborCharges, o.discount, o.gstInfo).finalAmount, 0) || 0;
  const estimatesCount = orders?.filter(o => o.isEstimate).length || 0;
  const actualOrdersCount = orders?.filter(o => !o.isEstimate).length || 0;

  // Mechanic Stats
  const mechanicStats = orders?.filter(o => !o.isEstimate).reduce((acc, order) => {
    const mechId = order.mechanicId || 'unassigned';
    if (!acc[mechId]) acc[mechId] = { count: 0, revenue: 0, labor: 0 };
    const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount, order.gstInfo);
    acc[mechId].count += 1;
    acc[mechId].revenue += totals.finalAmount;
    acc[mechId].labor += totals.laborTotal;
    return acc;
  }, {} as Record<string, { count: number, revenue: number, labor: number }>);

  const downloadDailyPDF = async () => {
    if (!orders || orders.length === 0) {
      Alert.alert('Error', 'No orders to generate PDF');
      return;
    }

    const fromDate = new Date(dateFrom).toLocaleDateString('en-IN', { dateStyle: 'long' });
    const toDate = new Date(dateTo).toLocaleDateString('en-IN', { dateStyle: 'long' });
    const title = dateFrom === dateTo ? `Repair Orders — ${fromDate}` : `Repair Orders — ${fromDate} to ${toDate}`;

    const rowsHtml = orders.map((o, i) => {
      const t = calculateTotals(o.spareParts, o.laborCharges, o.discount, o.gstInfo);
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">${i + 1}</td>
          <td style="padding: 8px;">${o.roNumber}</td>
          <td style="padding: 8px;">${new Date(o.dateIn).toLocaleDateString('en-IN')}</td>
          <td style="padding: 8px;">${o.customerName}</td>
          <td style="padding: 8px;">${o.vehicleNumber}</td>
          <td style="padding: 8px;">${o.brand} ${o.model}</td>
          <td style="padding: 8px;">${o.status}</td>
          <td style="padding: 8px; text-align: right;">₹${t.finalAmount.toFixed(0)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 20px; }
            .header { text-align: center; background-color: #1e2332; color: #ffa500; padding: 15px; border-radius: 4px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { color: #ccc; margin: 5px 0 0 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #1e2332; color: #ffa500; padding: 10px 8px; text-align: left; }
            td { padding: 8px; }
            .total-row td { background-color: #f0f0f0; font-weight: bold; color: #1e2332; }
            .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PATIDAR AUTO CARE</h1>
            <p>${title}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>RO Number</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Vehicle No.</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="7" style="text-align: right; padding: 10px 8px;">Total</td>
                <td style="text-align: right; padding: 10px 8px;">₹${totalRevenue.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">
            Generated: ${new Date().toLocaleString('en-IN')} | Total Orders: ${orders.length}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const downloadIndividualPDF = async (order: RepairOrder) => {
    try {
      await generateRepairOrderPDF(order);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 bg-card border-b border-border">
        <Text className="text-2xl font-bold text-foreground mb-4">Reports & PDFs</Text>
        
        <View className="bg-background border border-border rounded-xl p-4">
          <View className="flex-row items-center mb-3 gap-x-2">
            <CalendarDays size={18} color="hsl(221.2 83.2% 53.3%)" />
            <Text className="font-semibold text-foreground">Date Range Filter</Text>
          </View>
          
          <View className="flex-row gap-x-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">From Date</Text>
              <TextInput
                className="border border-input rounded-md px-3 h-10 text-foreground"
                value={dateFrom}
                onChangeText={setDateFrom}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">To Date</Text>
              <TextInput
                className="border border-input rounded-md px-3 h-10 text-foreground"
                value={dateTo}
                onChangeText={setDateTo}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
          
          <View className="flex-row gap-x-2">
            <Pressable 
              onPress={handleFetch} 
              disabled={loading}
              className={`flex-1 h-10 rounded-md flex-row items-center justify-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}
            >
              {loading ? <ActivityIndicator size="small" color="white" /> : null}
              <Text className="text-white font-medium ml-1">View Orders</Text>
            </Pressable>
            
            {orders && orders.length > 0 && (
              <Pressable 
                onPress={downloadDailyPDF} 
                className="flex-1 h-10 rounded-md flex-row items-center justify-center border border-primary bg-primary/5"
              >
                <FileDown size={16} color="hsl(221.2 83.2% 53.3%)" className="mr-1" />
                <Text className="text-primary font-medium text-xs">Summary PDF</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {orders !== null && (
          <>
            <View className="flex-row justify-between mb-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
              <View>
                <Text className="text-sm text-muted-foreground mb-1">Confirmed Orders ({actualOrdersCount})</Text>
                <Text className="text-xl font-bold text-foreground">₹{totalRevenue.toFixed(0)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted-foreground mb-1">Estimates ({estimatesCount})</Text>
                <Text className="text-xl font-bold text-primary font-mono">₹{totalEstimates.toFixed(0)}</Text>
              </View>
            </View>

            {mechanicStats && Object.keys(mechanicStats).length > 0 && (
              <View className="mb-4 bg-card p-4 rounded-xl border border-border">
                <Text className="text-sm font-semibold text-foreground mb-2">Mechanic Performance (Confirmed)</Text>
                {Object.entries(mechanicStats).map(([id, stats]) => (
                  <View key={id} className="flex-row justify-between items-center py-1 border-b border-border/50 last:border-b-0">
                    <Text className="text-sm text-foreground flex-1">{getMechanicName(id)}</Text>
                    <Text className="text-xs text-muted-foreground w-16 text-center">{stats.count} jobs</Text>
                    <Text className="text-sm font-mono text-foreground w-20 text-right">₹{stats.revenue.toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            )}

            {orders.length === 0 ? (
              <View className="py-10 items-center bg-card rounded-xl border border-border">
                <Text className="text-muted-foreground text-center">No orders found for selected dates</Text>
              </View>
            ) : (
              <View className="gap-y-2">
                {orders.map(order => {
                  const totals = calculateTotals(order.spareParts, order.laborCharges, order.discount, order.gstInfo);
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`} asChild>
                      <Pressable className="bg-card p-4 rounded-xl border border-border flex-row items-center justify-between">
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-x-2 mb-1">
                            <Text className="font-mono text-sm font-semibold text-foreground">{order.roNumber}</Text>
                            {order.isEstimate && <View className="bg-orange-100 px-1.5 py-0.5 rounded"><Text className="text-[10px] text-orange-800 font-medium">ESTIMATE</Text></View>}
                          </View>
                          <Text className="text-xs text-muted-foreground truncate" numberOfLines={1}>
                            {order.customerName} • {order.vehicleNumber} • {order.brand} {order.model}
                          </Text>
                        </View>
                        <View className="items-end gap-y-1 shrink-0 flex-row">
                          <View className="items-end mr-3">
                            <Text className="font-mono text-sm font-medium text-foreground mb-1">₹{totals.finalAmount.toFixed(0)}</Text>
                            <StatusBadge status={order.status} />
                          </View>
                          <Pressable 
                            onPress={(e) => {
                              // We don't want the navigation to trigger
                              // but Pressable nested in Link can be tricky, 
                              // we will let Link handle the main card and this nested pressable handles its own.
                              downloadIndividualPDF(order);
                            }}
                            className="bg-secondary p-2 rounded-md"
                          >
                            <FileDown size={18} color="hsl(222.2 84% 4.9%)" />
                          </Pressable>
                        </View>
                      </Pressable>
                    </Link>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
