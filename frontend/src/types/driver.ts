export const licenseCategories = ['Light', 'Medium', 'Heavy', 'Commercial', 'Other'] as const;
export const driverStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'] as const;

export type LicenseCategory = (typeof licenseCategories)[number];
export type DriverStatus = (typeof driverStatuses)[number];
export type LicenseState = 'valid' | 'expiringSoon' | 'expired';

export type Driver = {
  id: string;
  employeeId: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: string;
  contactNumber: string;
  email?: string;
  address?: string;
  safetyScore: number;
  status: DriverStatus;
  licenseState: LicenseState;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type DriverInput = Omit<Driver, 'id' | 'licenseState' | 'createdBy' | 'createdAt' | 'updatedAt'>;

export type DriverListFilters = {
  search: string;
  status: string;
  licenseCategory: string;
  licenseState: string;
  sort: 'newest' | 'oldest' | 'name' | 'safetyScore' | 'licenseExpiryDate';
};

export type DriverListResponse = {
  success: true;
  data: Driver[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type DriverResponse = { success: true; data: Driver };
