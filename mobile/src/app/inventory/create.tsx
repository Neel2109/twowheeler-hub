import { Stack } from 'expo-router';
import { InventoryForm } from '@/components/InventoryForm';

export default function AddInventoryScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Add Part' }} />
      <InventoryForm />
    </>
  );
}
