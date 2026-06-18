import { Stack } from 'expo-router';
import { MechanicForm } from '@/components/MechanicForm';

export default function AddMechanicScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Add Mechanic' }} />
      <MechanicForm />
    </>
  );
}
