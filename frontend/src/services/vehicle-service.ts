import { apiClient } from './api-client';
import type { Vehicle, VehicleInput, VehicleListFilters, VehicleListResponse, VehicleResponse } from '../types/vehicle';

export function getVehicles(token: string, filters: VehicleListFilters) {
  const query = new URLSearchParams();

  if (filters.search.trim()) query.set('search', filters.search.trim());
  if (filters.status) query.set('status', filters.status);
  if (filters.type) query.set('type', filters.type);
  if (filters.region.trim()) query.set('region', filters.region.trim());
  query.set('sort', filters.sort);

  return apiClient<VehicleListResponse>(`/vehicles?${query.toString()}`, { method: 'GET' }, token);
}

export async function createVehicle(token: string, input: VehicleInput) {
  const response = await apiClient<VehicleResponse>('/vehicles', { method: 'POST', body: input }, token);
  return response.data;
}

export async function updateVehicle(token: string, id: string, input: Partial<VehicleInput>) {
  const response = await apiClient<VehicleResponse>(`/vehicles/${id}`, { method: 'PATCH', body: input }, token);
  return response.data;
}

export function deleteVehicle(token: string, id: string) {
  return apiClient<{ success: true; data: { id: string } }>(`/vehicles/${id}`, { method: 'DELETE' }, token);
}

export function vehicleToInput(vehicle: Vehicle): VehicleInput {
  return {
    registrationNumber: vehicle.registrationNumber,
    name: vehicle.name,
    model: vehicle.model ?? '',
    type: vehicle.type,
    maximumLoadCapacity: vehicle.maximumLoadCapacity,
    odometer: vehicle.odometer,
    acquisitionCost: vehicle.acquisitionCost,
    region: vehicle.region,
    status: vehicle.status,
  };
}
