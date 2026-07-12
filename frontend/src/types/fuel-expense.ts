export const expenseCategories = [
  'Insurance',
  'Parking',
  'Toll',
  'Cleaning',
  'Tyres',
  'Repair',
  'Registration',
  'Miscellaneous',
] as const;

export const commonFuelTypes = ['Diesel', 'Petrol', 'CNG', 'Electric', 'Other'] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export type VehicleSummary = {
  id: string;
  registrationNumber: string;
  name: string;
  model?: string;
};

export type FuelLog = {
  id: string;
  fuelNumber: string;
  vehicle: VehicleSummary;
  date: string;
  odometer: number;
  fuelQuantity: number;
  fuelCost: number;
  fuelStation?: string;
  fuelType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type FuelInput = {
  vehicle: string;
  date: string;
  odometer: number;
  fuelQuantity: number;
  fuelCost: number;
  fuelStation?: string;
  fuelType?: string;
  notes?: string;
};

export type FuelFilters = {
  search: string;
  vehicle: string;
  fuelType: string;
  from: string;
  to: string;
  sort: 'newest' | 'oldest' | 'odometer' | 'quantity' | 'cost';
};

export type Expense = {
  id: string;
  expenseNumber: string;
  vehicle: VehicleSummary;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = {
  vehicle: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
};

export type ExpenseFilters = {
  search: string;
  vehicle: string;
  category: string;
  from: string;
  to: string;
  sort: 'newest' | 'oldest' | 'amount' | 'category';
};

export type ListResponse<T> = {
  success: true;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

