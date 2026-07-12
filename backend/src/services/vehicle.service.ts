import { isValidObjectId, type FilterQuery } from 'mongoose';
import {
  VehicleModel,
  vehicleStatuses,
  vehicleTypes,
  type Vehicle,
  type VehicleDocument,
} from '../models/vehicle.model.js';
import { HttpError } from '../utils/http-error.js';
import type { VehicleInput } from '../validation/vehicle.validation.js';

export type VehicleListOptions = {
  search?: string;
  status?: string;
  type?: string;
  region?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export type VehicleResponse = Omit<Vehicle, 'createdBy'> & { id: string; createdBy: string };

export async function listVehicles(options: VehicleListOptions) {
  const filters = buildFilters(options);
  const { page, limit } = parsePagination(options);
  const total = await VehicleModel.countDocuments(filters);
  const vehicles = await VehicleModel.find(filters)
    .sort(sortFor(options.sort))
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data: vehicles.map(toVehicleResponse),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getVehicle(id: string) {
  return toVehicleResponse(await findVehicle(id));
}

export async function createVehicle(input: VehicleInput, userId: string) {
  try {
    const vehicle = await VehicleModel.create({ ...input, createdBy: userId });
    return toVehicleResponse(vehicle);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>) {
  ensureValidId(id);

  try {
    const vehicle = await VehicleModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });

    if (!vehicle) {
      throw new HttpError(404, 'Vehicle not found.');
    }

    return toVehicleResponse(vehicle);
  } catch (error) {
    throw mapPersistenceError(error);
  }
}

export async function deleteVehicle(id: string) {
  const vehicle = await findVehicle(id);

  if (vehicle.status === 'On Trip' || vehicle.status === 'In Shop') {
    throw new HttpError(409, 'Vehicles that are On Trip or In Shop cannot be deleted.');
  }

  await vehicle.deleteOne();
}

function buildFilters(options: VehicleListOptions): FilterQuery<Vehicle> {
  const filters: FilterQuery<Vehicle> = {};
  const search = readQueryValue(options.search);
  const status = readQueryValue(options.status);
  const type = readQueryValue(options.type);
  const region = readQueryValue(options.region);

  if (search) {
    const expression = new RegExp(escapeRegExp(search), 'i');
    filters.$or = [{ registrationNumber: expression }, { name: expression }, { model: expression }];
  }

  if (status) {
    if (!vehicleStatuses.includes(status as (typeof vehicleStatuses)[number])) {
      throw new HttpError(400, 'status is invalid.');
    }
    filters.status = status;
  }

  if (type) {
    if (!vehicleTypes.includes(type as (typeof vehicleTypes)[number])) {
      throw new HttpError(400, 'type is invalid.');
    }
    filters.type = type;
  }

  if (region) {
    filters.region = new RegExp(`^${escapeRegExp(region)}$`, 'i');
  }

  return filters;
}

function parsePagination(options: VehicleListOptions) {
  const page = readPositiveInteger(options.page, 1, 'page');
  const limit = readPositiveInteger(options.limit, 20, 'limit', 100);
  return { page, limit };
}

function sortFor(sort: string | undefined) {
  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    registration: { registrationNumber: 1 },
    odometer: { odometer: -1 },
    acquisitionCost: { acquisitionCost: -1 },
  };
  const selectedSort = readQueryValue(sort) ?? 'newest';

  if (!sortOptions[selectedSort]) {
    throw new HttpError(400, 'sort is invalid.');
  }

  return sortOptions[selectedSort];
}

async function findVehicle(id: string) {
  ensureValidId(id);
  const vehicle = await VehicleModel.findById(id);

  if (!vehicle) {
    throw new HttpError(404, 'Vehicle not found.');
  }

  return vehicle;
}

function ensureValidId(id: string) {
  if (!isValidObjectId(id)) {
    throw new HttpError(400, 'Vehicle ID is invalid.');
  }
}

function readQueryValue(value: string | undefined) {
  return value?.trim();
}

function readPositiveInteger(value: string | undefined, defaultValue: number, name: string, maximum?: number) {
  if (value === undefined) return defaultValue;
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || (maximum && parsedValue > maximum)) {
    throw new HttpError(400, `${name} must be a positive integer${maximum ? ` up to ${maximum}` : ''}.`);
  }

  return parsedValue;
}

function toVehicleResponse(vehicle: VehicleDocument): VehicleResponse {
  return {
    id: vehicle.id,
    registrationNumber: vehicle.registrationNumber,
    name: vehicle.name,
    model: vehicle.model,
    type: vehicle.type,
    maximumLoadCapacity: vehicle.maximumLoadCapacity,
    odometer: vehicle.odometer,
    acquisitionCost: vehicle.acquisitionCost,
    region: vehicle.region,
    status: vehicle.status,
    createdBy: vehicle.createdBy.toString(),
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

function mapPersistenceError(error: unknown) {
  if (error instanceof HttpError) return error;

  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    return new HttpError(409, 'Vehicle registration number already exists.');
  }

  return error;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
