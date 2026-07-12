import { isValidObjectId } from 'mongoose';
import { HttpError } from '../utils/http-error.js';

export type TripInput = {
  source: string;
  destination: string;
  vehicle: string;
  driver: string;
  cargoWeight: number;
  plannedDistance: number;
  revenue: number;
};

const editableFields = ['source', 'destination', 'vehicle', 'driver', 'cargoWeight', 'plannedDistance', 'revenue'] as const;

export function validateTripInput(body: unknown, isPartial = false): Partial<TripInput> {
  if (!isRecord(body)) throw new HttpError(400, 'Trip data must be a JSON object.');
  const unknownField = Object.keys(body).find((key) => !editableFields.includes(key as (typeof editableFields)[number]));
  if (unknownField) throw new HttpError(400, `Field ${unknownField} cannot be updated.`);
  if (isPartial && Object.keys(body).length === 0) throw new HttpError(400, 'Provide at least one trip field to update.');

  const input: Partial<TripInput> = {
    source: readString(body, 'source', isPartial),
    destination: readString(body, 'destination', isPartial),
    vehicle: readObjectId(body, 'vehicle', isPartial),
    driver: readObjectId(body, 'driver', isPartial),
    cargoWeight: readNumber(body, 'cargoWeight', isPartial, false),
    plannedDistance: readNumber(body, 'plannedDistance', isPartial, false),
    revenue: readNumber(body, 'revenue', isPartial, true) ?? (isPartial ? undefined : 0),
  };
  return isPartial ? Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<TripInput> : input as TripInput;
}

export function validateCompletionInput(body: unknown) {
  if (!isRecord(body)) throw new HttpError(400, 'Completion data must be a JSON object.');
  return {
    finalOdometer: readNumber(body, 'finalOdometer', false, true)!,
    fuelConsumed: readNumber(body, 'fuelConsumed', false, true)!,
  };
}

export function validateCancellationInput(body: unknown) {
  if (body === undefined || body === null) return { reason: undefined };
  if (!isRecord(body)) throw new HttpError(400, 'Cancellation data must be a JSON object.');
  if (!('reason' in body)) return { reason: undefined };
  if (typeof body.reason !== 'string') throw new HttpError(400, 'reason must be a string.');
  const reason = body.reason.trim();
  if (reason.length > 500) throw new HttpError(400, 'reason must be 500 characters or fewer.');
  return { reason: reason || undefined };
}

function readString(body: Record<string, unknown>, field: string, isPartial: boolean) {
  if (!(field in body)) { if (isPartial) return undefined; throw new HttpError(400, `${field} is required.`); }
  if (typeof body[field] !== 'string' || body[field].trim().length === 0) throw new HttpError(400, `${field} must be a non-empty string.`);
  return body[field].trim();
}

function readObjectId(body: Record<string, unknown>, field: string, isPartial: boolean) {
  const value = readString(body, field, isPartial);
  if (value === undefined) return undefined;
  if (!isValidObjectId(value)) throw new HttpError(400, `${field} is invalid.`);
  return value;
}

function readNumber(body: Record<string, unknown>, field: string, isPartial: boolean, allowZero: boolean) {
  if (!(field in body)) { if (isPartial) return undefined; if (field === 'revenue') return 0; throw new HttpError(400, `${field} is required.`); }
  const value = typeof body[field] === 'number' ? body[field] : Number(body[field]);
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) throw new HttpError(400, `${field} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
