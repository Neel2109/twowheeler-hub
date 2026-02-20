export type VehicleType = 'Bike' | 'Scooter';
export type FuelLevel = 'Empty' | '1/4' | '1/2' | 'Full';
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
  expectedDeliveryDate: string;
  customerName: string;
  mobileNumber: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  odometerReading: number;
  fuelLevel: FuelLevel;
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
  'Honda', 'TVS', 'Bajaj', 'Hero', 'Royal Enfield', 'Yamaha',
  'Suzuki', 'KTM', 'Kawasaki', 'Aprilia', 'Vespa', 'Ola', 'Ather', 'Other'
];

export const STATUS_OPTIONS: ROStatus[] = [
  'Open', 'In Progress', 'Waiting for Parts', 'Ready for Delivery', 'Delivered'
];
