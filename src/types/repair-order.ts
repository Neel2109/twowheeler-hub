export type VehicleType = 'Bike' | 'Scooter';
export type ROStatus = 'Open' | 'In Progress' | 'Waiting for Parts' | 'Ready for Delivery' | 'Delivered';

export interface SparePart {
  id: string;
  partName: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface LaborCharge {
  id: string;
  description: string;
  amount: number;
}

export interface RepairOrder {
  id: string;
  roNumber: string;
  dateIn: string;
  customerName: string;
  mobileNumber: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  customerComplaints: string;
  serviceDetails: string;
  remarks: string;
  status: ROStatus;
  spareParts: SparePart[];
  laborCharges: LaborCharge[];
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export const BRANDS = [
  'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Hero MotoCorp', 'Bajaj',
  'TVS', 'Royal Enfield', 'Harley-Davidson', 'Indian Motorcycle',
  'Triumph', 'BMW Motorrad', 'KTM', 'Ducati', 'Aprilia',
  'CFMoto', 'Zontes', 'Lifan', 'QJMotor', 'Other'
];

export const STATUS_OPTIONS: ROStatus[] = [
  'Open', 'In Progress', 'Waiting for Parts', 'Ready for Delivery', 'Delivered'
];
