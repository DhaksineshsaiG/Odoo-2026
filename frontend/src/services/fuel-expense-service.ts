import { apiClient } from './api-client';
import type {
  Expense,
  ExpenseFilters,
  ExpenseInput,
  FuelFilters,
  FuelInput,
  FuelLog,
  ListResponse,
} from '../types/fuel-expense';
import type { VehicleListResponse } from '../types/vehicle';

export function getFuelLogs(token: string, filters: FuelFilters) {
  return apiClient<ListResponse<FuelLog>>(`/fuel?${buildQuery(filters)}`, { method: 'GET' }, token);
}

export async function createFuelLog(token: string, input: FuelInput) {
  const response = await apiClient<{ success: true; data: FuelLog }>('/fuel', { method: 'POST', body: input }, token);
  return response.data;
}

export async function updateFuelLog(token: string, id: string, input: FuelInput) {
  const response = await apiClient<{ success: true; data: FuelLog }>(`/fuel/${id}`, { method: 'PATCH', body: input }, token);
  return response.data;
}

export function deleteFuelLog(token: string, id: string) {
  return apiClient<{ success: true }>(`/fuel/${id}`, { method: 'DELETE' }, token);
}

export function getExpenses(token: string, filters: ExpenseFilters) {
  return apiClient<ListResponse<Expense>>(`/expenses?${buildQuery(filters)}`, { method: 'GET' }, token);
}

export async function createExpense(token: string, input: ExpenseInput) {
  const response = await apiClient<{ success: true; data: Expense }>('/expenses', { method: 'POST', body: input }, token);
  return response.data;
}

export async function updateExpense(token: string, id: string, input: ExpenseInput) {
  const response = await apiClient<{ success: true; data: Expense }>(`/expenses/${id}`, { method: 'PATCH', body: input }, token);
  return response.data;
}

export function deleteExpense(token: string, id: string) {
  return apiClient<{ success: true }>(`/expenses/${id}`, { method: 'DELETE' }, token);
}

export async function getFuelExpenseVehicles(token: string) {
  const response = await apiClient<VehicleListResponse>('/vehicles?sort=registration&limit=100', { method: 'GET' }, token);
  return response.data;
}

export function fuelToInput(fuel: FuelLog): FuelInput {
  return {
    vehicle: fuel.vehicle.id,
    date: toDateInput(fuel.date),
    odometer: fuel.odometer,
    fuelQuantity: fuel.fuelQuantity,
    fuelCost: fuel.fuelCost,
    fuelStation: fuel.fuelStation ?? '',
    fuelType: fuel.fuelType ?? '',
    notes: fuel.notes ?? '',
  };
}

export function expenseToInput(expense: Expense): ExpenseInput {
  return {
    vehicle: expense.vehicle.id,
    date: toDateInput(expense.date),
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
  };
}

function buildQuery(filters: Record<string, string>) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value.trim()) query.set(key, value.trim());
  });
  query.set('limit', '100');

  return query.toString();
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
