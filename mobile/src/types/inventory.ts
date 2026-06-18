export interface InventoryItem {
  id: string;
  partName: string;
  hsnCode: string;
  currentStock: number;
  minimumStock: number;
  rate: number;
  createdAt: string;
  updatedAt: string;
}
