import { View, Text } from 'react-native';
import { ROStatus } from '@/types/repair-order';

export function StatusBadge({ status }: { status: ROStatus }) {
  const colors = {
    'Open': 'bg-blue-100 border-blue-200 text-blue-800',
    'In Progress': 'bg-amber-100 border-amber-200 text-amber-800',
    'Waiting for Parts': 'bg-red-100 border-red-200 text-red-800',
    'Ready for Delivery': 'bg-green-100 border-green-200 text-green-800',
    'Delivered': 'bg-slate-100 border-slate-200 text-slate-800',
  };

  const colorClass = colors[status] || colors['Open'];

  return (
    <View className={`px-2 py-0.5 rounded-full border ${colorClass.split(' text-')[0]}`}>
      <Text className={`text-xs font-medium ${colorClass.match(/text-\S+/)?.[0] || 'text-slate-800'}`}>
        {status}
      </Text>
    </View>
  );
}
