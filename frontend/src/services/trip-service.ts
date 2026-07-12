import { apiClient } from './api-client';
import type { DriverOption, Trip, TripFilters, TripInput, TripListResponse, TripResponse, VehicleOption } from '../types/trip';

export function getTrips(token: string, filters: TripFilters) { const query = new URLSearchParams(); if (filters.search.trim()) query.set('search', filters.search.trim()); if (filters.status) query.set('status', filters.status); query.set('sort', filters.sort); return apiClient<TripListResponse>(`/trips?${query.toString()}`, { method: 'GET' }, token); }
export async function getTripOptions(token: string) { const [vehicles, drivers] = await Promise.all([apiClient<{ success: true; data: VehicleOption[] }>('/trips/options/eligible-vehicles', { method: 'GET' }, token), apiClient<{ success: true; data: DriverOption[] }>('/trips/options/eligible-drivers', { method: 'GET' }, token)]); return { vehicles: vehicles.data, drivers: drivers.data }; }
export async function createTrip(token: string, input: TripInput) { return (await apiClient<TripResponse>('/trips', { method: 'POST', body: input }, token)).data; }
export async function updateTrip(token: string, id: string, input: TripInput) { return (await apiClient<TripResponse>(`/trips/${id}`, { method: 'PATCH', body: input }, token)).data; }
export async function dispatchTrip(token: string, id: string) { return (await apiClient<TripResponse>(`/trips/${id}/dispatch`, { method: 'POST' }, token)).data; }
export async function completeTrip(token: string, id: string, input: { finalOdometer: number; fuelConsumed: number }) { return (await apiClient<TripResponse>(`/trips/${id}/complete`, { method: 'POST', body: input }, token)).data; }
export async function cancelTrip(token: string, id: string, reason?: string) { return (await apiClient<TripResponse>(`/trips/${id}/cancel`, { method: 'POST', body: { reason } }, token)).data; }
export function tripToInput(trip: Trip): TripInput { return { source: trip.source, destination: trip.destination, vehicle: trip.vehicle.id, driver: trip.driver.id, cargoWeight: trip.cargoWeight, plannedDistance: trip.plannedDistance, revenue: trip.revenue }; }
