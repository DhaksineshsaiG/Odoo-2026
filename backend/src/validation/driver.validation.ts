import { HttpError } from '../utils/http-error.js';
import {
  driverStatuses,
  licenseCategories,
  type DriverStatus,
  type LicenseCategory,
} from '../models/driver.model.js';

export type DriverInput = {
  employeeId: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: Date;
  contactNumber: string;
  email?: string;
  address?: string;
  safetyScore: number;
  status: DriverStatus;
};

const editableFields = [
  'employeeId',
  'name',
  'licenseNumber',
  'licenseCategory',
  'licenseExpiryDate',
  'contactNumber',
  'email',
  'address',
  'safetyScore',
  'status',
] as const;

export function validateDriverInput(body: unknown, isPartial = false): Partial<DriverInput> {
  if (!isRecord(body)) {
    throw new HttpError(400, 'Driver data must be a JSON object.');
  }

  const unknownField = Object.keys(body).find(
    (key) => !editableFields.includes(key as (typeof editableFields)[number]),
  );
  if (unknownField) {
    throw new HttpError(400, `Field ${unknownField} cannot be updated.`);
  }
  if (isPartial && Object.keys(body).length === 0) {
    throw new HttpError(400, 'Provide at least one driver field to update.');
  }

  const input: Partial<DriverInput> = {};
  input.employeeId = readRequiredString(body, 'employeeId', isPartial)?.toUpperCase();
  input.name = readRequiredString(body, 'name', isPartial);
  input.licenseNumber = readRequiredString(body, 'licenseNumber', isPartial)?.toUpperCase();
  input.licenseCategory = readEnum(body, 'licenseCategory', licenseCategories, isPartial);
  input.licenseExpiryDate = readDate(body, 'licenseExpiryDate', isPartial);
  input.contactNumber = readContactNumber(body, isPartial);
  input.email = readEmail(body);
  input.address = readOptionalString(body, 'address');
  input.safetyScore = readSafetyScore(body) ?? (isPartial ? undefined : 100);
  input.status = readEnum(body, 'status', driverStatuses, true) ?? (isPartial ? undefined : 'Available');

  if (!isPartial) {
    return input as DriverInput;
  }

  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<DriverInput>;
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
  if (typeof body[field] !== 'string') throw new HttpError(400, `${field} must be a string.`);
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

function readDate(body: Record<string, unknown>, field: string, isPartial: boolean) {
  if (!(field in body)) {
    if (isPartial) return undefined;
    throw new HttpError(400, `${field} is required.`);
  }
  if (typeof body[field] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body[field])) {
    throw new HttpError(400, `${field} must be a valid date in YYYY-MM-DD format.`);
  }
  const value = new Date(`${body[field]}T00:00:00.000Z`);
  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== body[field]) {
    throw new HttpError(400, `${field} must be a valid date in YYYY-MM-DD format.`);
  }
  return value;
}

function readContactNumber(body: Record<string, unknown>, isPartial: boolean) {
  const value = readRequiredString(body, 'contactNumber', isPartial);
  if (value === undefined) return undefined;
  if (!/^\+?[0-9][0-9 -]{7,18}$/.test(value)) {
    throw new HttpError(400, 'contactNumber must be a valid phone number.');
  }
  return value;
}

function readEmail(body: Record<string, unknown>) {
  if (!('email' in body)) return undefined;
  if (typeof body.email !== 'string') throw new HttpError(400, 'email must be a valid email address.');
  const value = body.email.trim().toLowerCase();
  if (!value) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new HttpError(400, 'email must be a valid email address.');
  }
  return value;
}

function readSafetyScore(body: Record<string, unknown>) {
  if (!('safetyScore' in body)) return undefined;
  const value = typeof body.safetyScore === 'number' ? body.safetyScore : Number(body.safetyScore);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new HttpError(400, 'safetyScore must be between 0 and 100.');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
