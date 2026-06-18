import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types/inventory';

export async function getInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('part_name', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    partName: row.part_name,
    hsnCode: row.hsn_code || '',
    currentStock: row.current_stock,
    minimumStock: row.minimum_stock,
    rate: Number(row.rate),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
  const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return {
    id: data.id,
    partName: data.part_name,
    hsnCode: data.hsn_code || '',
    currentStock: data.current_stock,
    minimumStock: data.minimum_stock,
    rate: Number(data.rate),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const { error } = await supabase.from('inventory_items').insert({
    part_name: item.partName,
    hsn_code: item.hsnCode,
    current_stock: item.currentStock,
    minimum_stock: item.minimumStock,
    rate: item.rate,
  });
  if (error) throw error;
}

export async function updateInventoryItem(item: InventoryItem): Promise<void> {
  const { error } = await supabase.from('inventory_items').update({
    part_name: item.partName,
    hsn_code: item.hsnCode,
    current_stock: item.currentStock,
    minimum_stock: item.minimumStock,
    rate: item.rate,
    updated_at: new Date().toISOString(),
  }).eq('id', item.id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}

export async function deductInventoryStock(partName: string, quantity: number): Promise<void> {
  // Simple deduction based on name (assuming names match)
  const { data } = await supabase
    .from('inventory_items')
    .select('id, current_stock')
    .eq('part_name', partName)
    .single();

  if (data) {
    await supabase.from('inventory_items').update({
      current_stock: Math.max(0, data.current_stock - quantity)
    }).eq('id', data.id);
  }
}
