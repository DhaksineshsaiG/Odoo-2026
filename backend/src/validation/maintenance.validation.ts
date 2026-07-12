import { isValidObjectId } from 'mongoose';
import { HttpError } from '../utils/http-error.js';
import { maintenancePriorities, maintenanceTypes, type MaintenancePriority, type MaintenanceType } from '../models/maintenance.model.js';

export type MaintenanceInput = { vehicle: string; type: MaintenanceType; description: string; priority: MaintenancePriority; scheduledDate?: Date; serviceProvider?: string; technicianName?: string; cost: number; notes?: string };
const editable = ['vehicle', 'type', 'description', 'priority', 'scheduledDate', 'serviceProvider', 'technicianName', 'cost', 'notes'] as const;

export function validateMaintenanceInput(body: unknown, partial = false): Partial<MaintenanceInput> {
  if (!record(body)) throw new HttpError(400, 'Maintenance data must be a JSON object.');
  const unknown = Object.keys(body).find((key) => !editable.includes(key as (typeof editable)[number]));
  if (unknown) throw new HttpError(400, `Field ${unknown} cannot be updated.`);
  if (partial && Object.keys(body).length === 0) throw new HttpError(400, 'Provide at least one maintenance field to update.');
  const value: Partial<MaintenanceInput> = {
    vehicle: objectId(body, 'vehicle', partial), type: enumValue(body, 'type', maintenanceTypes, partial), description: stringValue(body, 'description', partial),
    priority: enumValue(body, 'priority', maintenancePriorities, true) ?? (partial ? undefined : 'Medium'), scheduledDate: dateValue(body, 'scheduledDate'),
    serviceProvider: optionalString(body, 'serviceProvider'), technicianName: optionalString(body, 'technicianName'), cost: numberValue(body, 'cost', partial) ?? (partial ? undefined : 0), notes: optionalString(body, 'notes'),
  };
  return partial ? Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<MaintenanceInput> : value as MaintenanceInput;
}
export function validateCompletion(body: unknown) { if (!record(body)) throw new HttpError(400, 'Completion data must be a JSON object.'); return { cost: numberValue(body, 'cost', true), odometerAtService: numberValue(body, 'odometerAtService', true), technicianName: optionalString(body, 'technicianName'), serviceProvider: optionalString(body, 'serviceProvider'), notes: optionalString(body, 'notes') }; }
export function validateCancel(body: unknown) { if (body === undefined || body === null) return { reason: undefined }; if (!record(body)) throw new HttpError(400, 'Cancellation data must be a JSON object.'); return { reason: optionalString(body, 'reason') }; }
function stringValue(body: Record<string, unknown>, field: string, partial: boolean) { if (!(field in body)) { if (partial) return undefined; throw new HttpError(400, `${field} is required.`); } if (typeof body[field] !== 'string' || body[field].trim().length === 0) throw new HttpError(400, `${field} must be a non-empty string.`); return body[field].trim(); }
function optionalString(body: Record<string, unknown>, field: string) { if (!(field in body)) return undefined; if (typeof body[field] !== 'string') throw new HttpError(400, `${field} must be a string.`); return body[field].trim() || undefined; }
function objectId(body: Record<string, unknown>, field: string, partial: boolean) { const value = stringValue(body, field, partial); if (value === undefined) return undefined; if (!isValidObjectId(value)) throw new HttpError(400, `${field} is invalid.`); return value; }
function enumValue<T extends readonly string[]>(body: Record<string, unknown>, field: string, values: T, partial: boolean) { if (!(field in body)) { if (partial) return undefined; throw new HttpError(400, `${field} is required.`); } if (typeof body[field] !== 'string' || !values.includes(body[field] as T[number])) throw new HttpError(400, `${field} is invalid.`); return body[field] as T[number]; }
function numberValue(body: Record<string, unknown>, field: string, partial: boolean) { if (!(field in body)) { if (partial) return undefined; return 0; } const value = typeof body[field] === 'number' ? body[field] : Number(body[field]); if (!Number.isFinite(value) || value < 0) throw new HttpError(400, `${field} must be zero or greater.`); return value; }
function dateValue(body: Record<string, unknown>, field: string) { if (!(field in body)) return undefined; if (typeof body[field] !== 'string') throw new HttpError(400, `${field} must be a valid date.`); const date = new Date(body[field]); if (Number.isNaN(date.getTime())) throw new HttpError(400, `${field} must be a valid date.`); return date; }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
