export const tripStatuses = ['Draft', 'Dispatched', 'Completed', 'Cancelled'] as const;
export type TripStatus = (typeof tripStatuses)[number];

export type VehicleOption = { id: string; registrationNumber: string; name: string; model?: string; type: string; maximumLoadCapacity: number; odometer: number; region: string; status: string };
export type DriverOption = { id: string; employeeId: string; name: string; licenseNumber: string; licenseCategory: string; licenseExpiryDate: string; safetyScore: number; status: string };
export type Trip = { id: string; tripNumber: string; source: string; destination: string; vehicle: VehicleOption; driver: DriverOption; cargoWeight: number; plannedDistance: number; actualDistance?: number; initialOdometer?: number; finalOdometer?: number; fuelConsumed?: number; revenue: number; status: TripStatus; dispatchedAt?: string; completedAt?: string; cancelledAt?: string; cancellationReason?: string; createdAt: string; updatedAt: string };
export type TripInput = { source: string; destination: string; vehicle: string; driver: string; cargoWeight: number; plannedDistance: number; revenue: number };
export type TripFilters = { search: string; status: string; sort: 'newest' | 'oldest' | 'tripNumber' | 'plannedDistance' | 'actualDistance' };
export type TripListResponse = { success: true; data: Trip[]; meta: { total: number; page: number; limit: number; totalPages: number } };
export type TripResponse = { success: true; data: Trip };
