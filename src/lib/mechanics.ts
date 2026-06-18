import { supabase } from '@/integrations/supabase/client';
import { Mechanic } from '@/types/mechanic';

export async function getMechanics(): Promise<Mechanic[]> {
  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    baseSalary: Number(row.base_salary),
    commissionRate: Number(row.commission_rate),
    createdAt: row.created_at,
  }));
}

export async function getMechanicById(id: string): Promise<Mechanic | undefined> {
  const { data, error } = await supabase.from('mechanics').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return {
    id: data.id,
    name: data.name,
    phone: data.phone || '',
    baseSalary: Number(data.base_salary),
    commissionRate: Number(data.commission_rate),
    createdAt: data.created_at,
  };
}

export async function addMechanic(mechanic: Omit<Mechanic, 'id' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('mechanics').insert({
    name: mechanic.name,
    phone: mechanic.phone,
    base_salary: mechanic.baseSalary,
    commission_rate: mechanic.commissionRate,
  });
  if (error) throw error;
}

export async function updateMechanic(mechanic: Mechanic): Promise<void> {
  const { error } = await supabase.from('mechanics').update({
    name: mechanic.name,
    phone: mechanic.phone,
    base_salary: mechanic.baseSalary,
    commission_rate: mechanic.commissionRate,
  }).eq('id', mechanic.id);
  if (error) throw error;
}

export async function deleteMechanic(id: string): Promise<void> {
  const { error } = await supabase.from('mechanics').delete().eq('id', id);
  if (error) throw error;
}
