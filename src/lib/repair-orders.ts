import { RepairOrder, SparePart, LaborCharge } from '@/types/repair-order';

const STORAGE_KEY = 'patidar_repair_orders';

export function getRepairOrders(): RepairOrder[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveRepairOrders(orders: RepairOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function generateRONumber(): string {
  const orders = getRepairOrders();
  const today = new Date();
  const prefix = `RO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const todayOrders = orders.filter(o => o.roNumber.startsWith(prefix));
  const next = todayOrders.length + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export function addRepairOrder(order: RepairOrder): RepairOrder {
  const orders = getRepairOrders();
  orders.unshift(order);
  saveRepairOrders(orders);
  return order;
}

export function updateRepairOrder(updated: RepairOrder): RepairOrder {
  const orders = getRepairOrders();
  const idx = orders.findIndex(o => o.id === updated.id);
  if (idx !== -1) {
    orders[idx] = { ...updated, updatedAt: new Date().toISOString() };
    saveRepairOrders(orders);
  }
  return updated;
}

export function getRepairOrderById(id: string): RepairOrder | undefined {
  return getRepairOrders().find(o => o.id === id);
}

export function deleteRepairOrder(id: string) {
  const orders = getRepairOrders().filter(o => o.id !== id);
  saveRepairOrders(orders);
}

export function calculateTotals(parts: SparePart[], labor: LaborCharge[], discount: number) {
  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const laborTotal = labor.reduce((sum, l) => sum + l.amount, 0);
  const subtotal = partsTotal + laborTotal;
  const finalAmount = subtotal - discount;
  return { partsTotal, laborTotal, subtotal, finalAmount };
}

export function getServiceHistory(vehicleNumber: string): RepairOrder[] {
  return getRepairOrders()
    .filter(o => o.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase())
    .sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime());
}
