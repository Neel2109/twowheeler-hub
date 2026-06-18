import { supabase } from '@/integrations/supabase/client';
import { RepairOrder, SparePart, LaborCharge, GSTInfo } from '@/types/repair-order';

// Convert DB row to RepairOrder type
function dbToRepairOrder(row: any, parts: any[], labor: any[]): RepairOrder {
  return {
    id: row.id,
    roNumber: row.ro_number,
    dateIn: row.date_in,
    customerName: row.customer_name,
    mobileNumber: row.mobile_number,
    vehicleNumber: row.vehicle_number,
    vehicleType: row.vehicle_type,
    brand: row.brand,
    model: row.model,
    customerComplaints: row.customer_complaints || '',
    serviceDetails: row.service_details || '',
    remarks: row.remarks || '',
    status: row.status,
    spareParts: parts.map(p => ({
      id: p.id,
      partName: p.part_name,
      hsnCode: p.hsn_code || '',
      quantity: p.quantity,
      rate: Number(p.rate),
      total: Number(p.total),
    })),
    laborCharges: labor.map(l => ({
      id: l.id,
      description: l.description,
      amount: Number(l.amount),
    })),
    discount: Number(row.discount),
    gstInfo: {
      garageGSTIN: row.garage_gstin || '',
      customerGSTIN: row.customer_gstin || '',
      cgstRate: Number(row.cgst_rate),
      sgstRate: Number(row.sgst_rate),
    },
    mechanicId: row.mechanic_id,
    isEstimate: row.is_estimate || false,
    customerSignatureUrl: row.customer_signature_url,
    media: [], // We'll populate this separately if needed
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRepairOrders(): Promise<RepairOrder[]> {
  const { data: orders, error } = await supabase
    .from('repair_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);

  const [{ data: parts }, { data: labor }] = await Promise.all([
    supabase.from('spare_parts').select('*').in('repair_order_id', orderIds),
    supabase.from('labor_charges').select('*').in('repair_order_id', orderIds),
  ]);

  return orders.map(o => dbToRepairOrder(
    o,
    (parts || []).filter(p => p.repair_order_id === o.id),
    (labor || []).filter(l => l.repair_order_id === o.id),
  ));
}

export async function generateRONumber(): Promise<string> {
  const today = new Date();
  const prefix = `RO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

  const { count } = await supabase
    .from('repair_orders')
    .select('*', { count: 'exact', head: true })
    .like('ro_number', `${prefix}%`);

  const next = (count || 0) + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export async function addRepairOrder(order: RepairOrder, userId: string): Promise<RepairOrder> {
  const { data, error } = await supabase.from('repair_orders').insert({
    id: order.id,
    user_id: userId,
    ro_number: order.roNumber,
    date_in: order.dateIn,
    customer_name: order.customerName,
    mobile_number: order.mobileNumber,
    vehicle_number: order.vehicleNumber,
    vehicle_type: order.vehicleType,
    brand: order.brand,
    model: order.model,
    customer_complaints: order.customerComplaints,
    service_details: order.serviceDetails,
    remarks: order.remarks,
    status: order.status,
    discount: order.discount,
    garage_gstin: order.gstInfo.garageGSTIN,
    customer_gstin: order.gstInfo.customerGSTIN,
    cgst_rate: order.gstInfo.cgstRate,
    sgst_rate: order.gstInfo.sgstRate,
    mechanic_id: order.mechanicId,
    is_estimate: order.isEstimate,
    customer_signature_url: order.customerSignatureUrl,
  }).select().single();

  if (error) throw error;

  if (order.spareParts.length > 0) {
    await supabase.from('spare_parts').insert(
      order.spareParts.map(p => ({
        repair_order_id: order.id,
        part_name: p.partName,
        hsn_code: p.hsnCode,
        quantity: p.quantity,
        rate: p.rate,
        total: p.total,
      }))
    );
  }

  if (order.laborCharges.length > 0) {
    await supabase.from('labor_charges').insert(
      order.laborCharges.map(l => ({
        repair_order_id: order.id,
        description: l.description,
        amount: l.amount,
      }))
    );
  }

  return order;
}

export async function updateRepairOrder(updated: RepairOrder): Promise<RepairOrder> {
  const { error } = await supabase.from('repair_orders').update({
    date_in: updated.dateIn,
    customer_name: updated.customerName,
    mobile_number: updated.mobileNumber,
    vehicle_number: updated.vehicleNumber,
    vehicle_type: updated.vehicleType,
    brand: updated.brand,
    model: updated.model,
    customer_complaints: updated.customerComplaints,
    service_details: updated.serviceDetails,
    remarks: updated.remarks,
    status: updated.status,
    discount: updated.discount,
    garage_gstin: updated.gstInfo.garageGSTIN,
    customer_gstin: updated.gstInfo.customerGSTIN,
    cgst_rate: updated.gstInfo.cgstRate,
    sgst_rate: updated.gstInfo.sgstRate,
    mechanic_id: updated.mechanicId,
    is_estimate: updated.isEstimate,
    customer_signature_url: updated.customerSignatureUrl,
  }).eq('id', updated.id);

  if (error) throw error;

  // Replace spare parts & labor
  await supabase.from('spare_parts').delete().eq('repair_order_id', updated.id);
  await supabase.from('labor_charges').delete().eq('repair_order_id', updated.id);

  if (updated.spareParts.length > 0) {
    await supabase.from('spare_parts').insert(
      updated.spareParts.map(p => ({
        repair_order_id: updated.id,
        part_name: p.partName,
        hsn_code: p.hsnCode,
        quantity: p.quantity,
        rate: p.rate,
        total: p.total,
      }))
    );
  }

  if (updated.laborCharges.length > 0) {
    await supabase.from('labor_charges').insert(
      updated.laborCharges.map(l => ({
        repair_order_id: updated.id,
        description: l.description,
        amount: l.amount,
      }))
    );
  }

  return updated;
}

export async function getRepairOrderById(id: string): Promise<RepairOrder | undefined> {
  const { data: order, error } = await supabase
    .from('repair_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) return undefined;

  const [{ data: parts }, { data: labor }] = await Promise.all([
    supabase.from('spare_parts').select('*').eq('repair_order_id', id),
    supabase.from('labor_charges').select('*').eq('repair_order_id', id),
  ]);

  return dbToRepairOrder(order, parts || [], labor || []);
}

export async function deleteRepairOrder(id: string) {
  await supabase.from('repair_orders').delete().eq('id', id);
}

export function calculateTotals(parts: SparePart[], labor: LaborCharge[], discount: number, gstInfo?: GSTInfo) {
  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const laborTotal = labor.reduce((sum, l) => sum + l.amount, 0);
  const subtotal = partsTotal + laborTotal;
  const taxableAmount = subtotal - discount;
  const cgstRate = gstInfo?.cgstRate ?? 9;
  const sgstRate = gstInfo?.sgstRate ?? 9;
  const cgstAmount = (taxableAmount * cgstRate) / 100;
  const sgstAmount = (taxableAmount * sgstRate) / 100;
  const totalGST = cgstAmount + sgstAmount;
  const finalAmount = taxableAmount + totalGST;
  return { partsTotal, laborTotal, subtotal, taxableAmount, cgstAmount, sgstAmount, totalGST, finalAmount };
}

export async function getServiceHistory(vehicleNumber: string): Promise<RepairOrder[]> {
  const { data: orders } = await supabase
    .from('repair_orders')
    .select('*')
    .ilike('vehicle_number', vehicleNumber)
    .order('date_in', { ascending: false });

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  const [{ data: parts }, { data: labor }] = await Promise.all([
    supabase.from('spare_parts').select('*').in('repair_order_id', orderIds),
    supabase.from('labor_charges').select('*').in('repair_order_id', orderIds),
  ]);

  return orders.map(o => dbToRepairOrder(
    o,
    (parts || []).filter(p => p.repair_order_id === o.id),
    (labor || []).filter(l => l.repair_order_id === o.id),
  ));
}

export async function getOrdersByDateRange(from: string, to: string): Promise<RepairOrder[]> {
  const { data: orders } = await supabase
    .from('repair_orders')
    .select('*')
    .gte('date_in', from)
    .lte('date_in', to)
    .order('date_in', { ascending: false });

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  const [{ data: parts }, { data: labor }] = await Promise.all([
    supabase.from('spare_parts').select('*').in('repair_order_id', orderIds),
    supabase.from('labor_charges').select('*').in('repair_order_id', orderIds),
  ]);

  return orders.map(o => dbToRepairOrder(
    o,
    (parts || []).filter(p => p.repair_order_id === o.id),
    (labor || []).filter(l => l.repair_order_id === o.id),
  ));
}
