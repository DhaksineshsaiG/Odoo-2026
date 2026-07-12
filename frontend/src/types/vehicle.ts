export const vehicleTypes = ['Van', 'Truck', 'Mini Truck', 'Bus', 'Car', 'Other'] as const;
export const vehicleStatuses = ['Available', 'On Trip', 'In Shop', 'Retired'] as const;

export type VehicleType = (typeof vehicleTypes)[number];
export type VehicleStatus = (typeof vehicleStatuses)[number];

export type Vehicle = {
  id: string;
  registrationNumber: string;
  name: string;
  model?: string;
  type: VehicleType;
  maximumLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type VehicleInput = Omit<Vehicle, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;

export type VehicleListFilters = {
  search: string;
  status: string;
  type: string;
  region: string;
  sort: 'newest' | 'oldest' | 'registration' | 'odometer' | 'acquisitionCost';
};

export type VehicleListResponse = {
  success: true;
  data: Vehicle[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type VehicleResponse = { success: true; data: Vehicle };
