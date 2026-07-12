import { HttpError } from '../utils/http-error.js';
import {
  vehicleStatuses,
  vehicleTypes,
  type VehicleStatus,
  type VehicleType,
} from '../models/vehicle.model.js';

export type VehicleInput = {
  registrationNumber: string;
  name: string;
  model?: string;
  type: VehicleType;
  maximumLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
};

const editableFields = [
  'registrationNumber',
  'name',
  'model',
  'type',
  'maximumLoadCapacity',
  'odometer',
  'acquisitionCost',
  'region',
  'status',
] as const;

export function validateVehicleInput(body: unknown, isPartial = false): Partial<VehicleInput> {
  if (!isRecord(body)) {
    throw new HttpError(400, 'Vehicle data must be a JSON object.');
  }

  const unknownField = Object.keys(body).find(
    (key) => !editableFields.includes(key as (typeof editableFields)[number]),
  );

  if (unknownField) {
    throw new HttpError(400, `Field ${unknownField} cannot be updated.`);
  }

  if (isPartial && Object.keys(body).length === 0) {
    throw new HttpError(400, 'Provide at least one vehicle field to update.');
  }

  const input: Partial<VehicleInput> = {};
  input.registrationNumber = readRequiredString(body, 'registrationNumber', isPartial)?.toUpperCase();
  input.name = readRequiredString(body, 'name', isPartial);
  input.region = readRequiredString(body, 'region', isPartial);
  input.model = readOptionalString(body, 'model');
  input.type = readEnum(body, 'type', vehicleTypes, isPartial);
  input.status = readEnum(body, 'status', vehicleStatuses, true) ?? (isPartial ? undefined : 'Available');
  input.maximumLoadCapacity = readNumber(body, 'maximumLoadCapacity', true, 0, false);
  input.odometer = readNumber(body, 'odometer', isPartial, 0, true);
  input.acquisitionCost = readNumber(body, 'acquisitionCost', isPartial, 0, true);

  if (!isPartial && input.maximumLoadCapacity === undefined) {
    throw new HttpError(400, 'maximumLoadCapacity is required.');
  }

  if (!isPartial) {
    return input as VehicleInput;
  }

  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<VehicleInput>;
}

function readRequiredString(body: Record<string, unknown>, field: string, isPartial: boolean) {
  if (!(field in body)) {
    if (isPartial) return undefined;
    throw new HttpError(400, `${field} is required.`);
  }

  if (typeof body[field] !== 'string' || body[field].trim().length === 0) {
    throw new HttpError(400, `${field} must be a non-empty string.`);
  }

  return body[field].trim();
}

function readOptionalString(body: Record<string, unknown>, field: string) {
  if (!(field in body)) return undefined;

  if (typeof body[field] !== 'string') {
    throw new HttpError(400, `${field} must be a string.`);
  }

  return body[field].trim() || undefined;
}

function readEnum<T extends readonly string[]>(
  body: Record<string, unknown>,
  field: string,
  allowedValues: T,
  isPartial: boolean,
) {
  if (!(field in body)) {
    if (isPartial) return undefined;
    throw new HttpError(400, `${field} is required.`);
  }

  if (typeof body[field] !== 'string' || !allowedValues.includes(body[field] as T[number])) {
    throw new HttpError(400, `${field} is invalid.`);
  }

  return body[field] as T[number];
}

function readNumber(
  body: Record<string, unknown>,
  field: string,
  isPartial: boolean,
  minimum: number,
  inclusive: boolean,
) {
  if (!(field in body)) {
    if (isPartial) return undefined;
    return minimum;
  }

  const value = typeof body[field] === 'number' ? body[field] : Number(body[field]);
  const isValid = Number.isFinite(value) && (inclusive ? value >= minimum : value > minimum);

  if (!isValid) {
    throw new HttpError(400, `${field} must be ${inclusive ? 'zero or greater' : 'greater than zero'}.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
