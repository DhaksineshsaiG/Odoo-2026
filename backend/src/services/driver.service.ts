import { isValidObjectId, type FilterQuery } from 'mongoose';
import {
  DriverModel,
  driverStatuses,
  licenseCategories,
  type Driver,
  type DriverDocument,
} from '../models/driver.model.js';
import { HttpError } from '../utils/http-error.js';
import type { DriverInput } from '../validation/driver.validation.js';

export type DriverListOptions = {
  search?: string;
  status?: string;
  licenseCategory?: string;
  licenseState?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export type LicenseState = 'valid' | 'expiringSoon' | 'expired';
export type DriverResponse = Omit<Driver, 'createdBy'> & { id: string; createdBy: string; licenseState: LicenseState };

export async function listDrivers(options: DriverListOptions) {
  const filters = buildFilters(options);
  const { page, limit } = parsePagination(options);
  const total = await DriverModel.countDocuments(filters);
  const drivers = await DriverModel.find(filters)
    .sort(sortFor(options.sort))
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data: drivers.map(toDriverResponse),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getDriver(id: string) {
  return toDriverResponse(await findDriver(id));
}

export async function createDriver(input: DriverInput, userId: string) {
  try {
    return toDriverResponse(await DriverModel.create({ ...input, createdBy: userId }));
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function updateDriver(id: string, input: Partial<DriverInput>) {
  ensureValidId(id);
  try {
    const driver = await DriverModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    if (!driver) throw new HttpError(404, 'Driver not found.');
    return toDriverResponse(driver);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function deleteDriver(id: string) {
  const driver = await findDriver(id);
  if (driver.status === 'On Trip') {
    throw new HttpError(409, 'Drivers who are On Trip cannot be deleted.');
  }
  await driver.deleteOne();
}

// Phase 4 can reuse this server-side query before dispatching any trip.
export function findDispatchEligibleDrivers() {
  return DriverModel.find({ status: 'Available', licenseExpiryDate: { $gt: new Date() } });
}

function buildFilters(options: DriverListOptions): FilterQuery<Driver> {
  const filters: FilterQuery<Driver> = {};
  const search = readQueryValue(options.search);
  const status = readQueryValue(options.status);
  const licenseCategory = readQueryValue(options.licenseCategory);
  const licenseState = readQueryValue(options.licenseState);

  if (search) {
    const expression = new RegExp(escapeRegExp(search), 'i');
    filters.$or = [
      { employeeId: expression },
      { name: expression },
      { licenseNumber: expression },
      { email: expression },
      { contactNumber: expression },
    ];
  }
  if (status) {
    if (!driverStatuses.includes(status as (typeof driverStatuses)[number])) throw new HttpError(400, 'status is invalid.');
    filters.status = status;
  }
  if (licenseCategory) {
    if (!licenseCategories.includes(licenseCategory as (typeof licenseCategories)[number])) throw new HttpError(400, 'licenseCategory is invalid.');
    filters.licenseCategory = licenseCategory;
  }
  if (licenseState) {
    Object.assign(filters, filtersForLicenseState(licenseState));
  }
  return filters;
}

function filtersForLicenseState(state: string): FilterQuery<Driver> {
  const { today, expiringSoon } = licenseDates();
  if (state === 'valid') return { licenseExpiryDate: { $gt: expiringSoon } };
  if (state === 'expiringSoon') return { licenseExpiryDate: { $gte: today, $lte: expiringSoon } };
  if (state === 'expired') return { licenseExpiryDate: { $lt: today } };
  throw new HttpError(400, 'licenseState is invalid.');
}

function parsePagination(options: DriverListOptions) {
  return {
    page: readPositiveInteger(options.page, 1, 'page'),
    limit: readPositiveInteger(options.limit, 20, 'limit', 100),
  };
}

function sortFor(sort: string | undefined) {
  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 }, oldest: { createdAt: 1 }, name: { name: 1 }, safetyScore: { safetyScore: -1 }, licenseExpiryDate: { licenseExpiryDate: 1 },
  };
  const selectedSort = readQueryValue(sort) ?? 'newest';
  if (!sortOptions[selectedSort]) throw new HttpError(400, 'sort is invalid.');
  return sortOptions[selectedSort];
}

async function findDriver(id: string) {
  ensureValidId(id);
  const driver = await DriverModel.findById(id);
  if (!driver) throw new HttpError(404, 'Driver not found.');
  return driver;
}

function ensureValidId(id: string) {
  if (!isValidObjectId(id)) throw new HttpError(400, 'Driver ID is invalid.');
}

function toDriverResponse(driver: DriverDocument): DriverResponse {
  return {
    id: driver.id,
    employeeId: driver.employeeId,
    name: driver.name,
    licenseNumber: driver.licenseNumber,
    licenseCategory: driver.licenseCategory,
    licenseExpiryDate: driver.licenseExpiryDate,
    contactNumber: driver.contactNumber,
    email: driver.email,
    address: driver.address,
    safetyScore: driver.safetyScore,
    status: driver.status,
    createdBy: driver.createdBy.toString(),
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
    licenseState: getLicenseState(driver.licenseExpiryDate),
  };
}

function getLicenseState(expiryDate: Date): LicenseState {
  const { today, expiringSoon } = licenseDates();
  if (expiryDate < today) return 'expired';
  if (expiryDate <= expiringSoon) return 'expiringSoon';
  return 'valid';
}

function licenseDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiringSoon = new Date(today);
  expiringSoon.setDate(expiringSoon.getDate() + 30);
  return { today, expiringSoon };
}

function readQueryValue(value: string | undefined) { return value?.trim(); }

function readPositiveInteger(value: string | undefined, defaultValue: number, name: string, maximum?: number) {
  if (value === undefined) return defaultValue;
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 1 || (maximum && parsedValue > maximum)) {
    throw new HttpError(400, `${name} must be a positive integer${maximum ? ` up to ${maximum}` : ''}.`);
  }
  return parsedValue;
}

function mapPersistenceError(error: unknown) {
  if (error instanceof HttpError) return error;
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    const key = 'keyPattern' in error && typeof error.keyPattern === 'object' && error.keyPattern !== null ? Object.keys(error.keyPattern)[0] : undefined;
    const messages: Record<string, string> = {
      employeeId: 'Driver employee ID already exists.', licenseNumber: 'Driver license number already exists.', email: 'Driver email already exists.',
    };
    return new HttpError(409, messages[key ?? ''] ?? 'A driver with this unique value already exists.');
  }
  return error;
}

function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
