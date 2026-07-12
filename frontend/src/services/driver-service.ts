import { apiClient } from './api-client';
import type { Driver, DriverInput, DriverListFilters, DriverListResponse, DriverResponse } from '../types/driver';

export function getDrivers(token: string, filters: DriverListFilters) {
  const query = new URLSearchParams();
  if (filters.search.trim()) query.set('search', filters.search.trim());
  if (filters.status) query.set('status', filters.status);
  if (filters.licenseCategory) query.set('licenseCategory', filters.licenseCategory);
  if (filters.licenseState) query.set('licenseState', filters.licenseState);
  query.set('sort', filters.sort);
  return apiClient<DriverListResponse>(`/drivers?${query.toString()}`, { method: 'GET' }, token);
}

export async function createDriver(token: string, input: DriverInput) {
  const response = await apiClient<DriverResponse>('/drivers', { method: 'POST', body: input }, token);
  return response.data;
}

export async function updateDriver(token: string, id: string, input: Partial<DriverInput>) {
  const response = await apiClient<DriverResponse>(`/drivers/${id}`, { method: 'PATCH', body: input }, token);
  return response.data;
}

export function deleteDriver(token: string, id: string) {
  return apiClient<{ success: true; data: { id: string } }>(`/drivers/${id}`, { method: 'DELETE' }, token);
}

export function driverToInput(driver: Driver): DriverInput {
  return {
    employeeId: driver.employeeId,
    name: driver.name,
    licenseNumber: driver.licenseNumber,
    licenseCategory: driver.licenseCategory,
    licenseExpiryDate: driver.licenseExpiryDate.slice(0, 10),
    contactNumber: driver.contactNumber,
    email: driver.email ?? '',
    address: driver.address ?? '',
    safetyScore: driver.safetyScore,
    status: driver.status,
  };
}
