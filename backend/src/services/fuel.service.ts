import { isValidObjectId, type FilterQuery } from 'mongoose';
import { FuelCounterModel, FuelModel, type FuelDocument, type FuelLog } from '../models/fuel.model.js';
import { VehicleModel } from '../models/vehicle.model.js';
import { HttpError } from '../utils/http-error.js';
import type { FuelInput } from '../validation/fuel.validation.js';

export type List = {
  search?: string;
  vehicle?: string;
  fuelType?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export async function listFuel(options: List) {
  const query = await filters(options);
  const pagination = page(options);
  const total = await FuelModel.countDocuments(query);
  const data = await FuelModel.find(query)
    .sort(sort(options.sort))
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .populate('vehicle');

  return {
    data: data.map(out),
    meta: { total, ...pagination, totalPages: Math.max(1, Math.ceil(total / pagination.limit)) },
  };
}

export async function getFuel(id: string) {
  return out(await populated(id));
}

export async function createFuel(input: FuelInput, userId: string) {
  await validate(input.vehicle, input.odometer);
  const fuelNumber = await number();
  return out(await (await FuelModel.create({ ...input, fuelNumber, createdBy: userId })).populate('vehicle'));
}

export async function updateFuel(id: string, input: Partial<FuelInput>) {
  const record = await FuelModel.findById(id);
  if (!record) throw new HttpError(404, 'Fuel log not found.');

  const vehicle = input.vehicle ?? record.vehicle.toString();
  const odometer = input.odometer ?? record.odometer;
  await validate(vehicle, odometer, id);
  Object.assign(record, input);
  await record.save();
  return out(await record.populate('vehicle'));
}

export async function deleteFuel(id: string) {
  const record = await FuelModel.findByIdAndDelete(id);
  if (!record) throw new HttpError(404, 'Fuel log not found.');
}

async function validate(vehicle: string, odometer: number, exclude?: string) {
  if (!(await VehicleModel.exists({ _id: vehicle }))) {
    throw new HttpError(400, 'Selected vehicle does not exist.');
  }

  const previous = await FuelModel.findOne({ vehicle, _id: { $ne: exclude }, odometer: { $gt: odometer } });
  if (previous) throw new HttpError(400, 'Odometer cannot decrease below a previous fuel log.');
}

async function filters(options: List): Promise<FilterQuery<FuelLog>> {
  const query: FilterQuery<FuelLog> = {};

  if (options.vehicle) {
    if (!isValidObjectId(options.vehicle)) throw new HttpError(400, 'vehicle is invalid.');
    query.vehicle = options.vehicle;
  }

  if (options.fuelType?.trim()) {
    query.fuelType = new RegExp(`^${esc(options.fuelType.trim())}$`, 'i');
  }

  const date = dateRange(options.from, options.to);
  if (date) query.date = date;

  if (options.search?.trim()) {
    const expression = new RegExp(esc(options.search.trim()), 'i');
    const vehicles = await VehicleModel.find({ $or: [{ registrationNumber: expression }, { name: expression }] }).select('_id');
    query.$or = [
      { fuelNumber: expression },
      { fuelStation: expression },
      { fuelType: expression },
      { vehicle: { $in: vehicles.map((vehicle) => vehicle.id) } },
    ];
  }

  return query;
}

function out(record: FuelDocument) {
  const vehicle = record.vehicle as unknown as Record<string, unknown>;
  return {
    id: record.id,
    fuelNumber: record.fuelNumber,
    vehicle: vehicle && '_id' in vehicle
      ? { id: String(vehicle._id), registrationNumber: vehicle.registrationNumber, name: vehicle.name }
      : { id: String(record.vehicle) },
    date: record.date,
    odometer: record.odometer,
    fuelQuantity: record.fuelQuantity,
    fuelCost: record.fuelCost,
    fuelStation: record.fuelStation,
    fuelType: record.fuelType,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function populated(id: string) {
  if (!isValidObjectId(id)) throw new HttpError(400, 'Fuel ID is invalid.');
  const record = await FuelModel.findById(id).populate('vehicle');
  if (!record) throw new HttpError(404, 'Fuel log not found.');
  return record;
}

async function number() {
  const year = new Date().getFullYear();
  const counter = await FuelCounterModel.findOneAndUpdate(
    { _id: `fuel-${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return `FUEL-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

function sort(value?: string) {
  const options: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    date: { date: -1 },
    cost: { fuelCost: -1 },
    odometer: { odometer: -1 },
    quantity: { fuelQuantity: -1 },
  };
  const selected = value ?? 'newest';
  if (!options[selected]) throw new HttpError(400, 'sort is invalid.');
  return options[selected];
}

function page(options: List) {
  const parse = (value: string | undefined, fallback: number) => value === undefined ? fallback : Number(value);
  const selectedPage = parse(options.page, 1);
  const limit = parse(options.limit, 20);
  if (!Number.isInteger(selectedPage) || !Number.isInteger(limit) || selectedPage < 1 || limit < 1 || limit > 100) {
    throw new HttpError(400, 'Pagination is invalid.');
  }
  return { page: selectedPage, limit };
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const start = from ? new Date(from) : undefined;
  const end = to ? new Date(to) : undefined;
  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
    throw new HttpError(400, 'Date range is invalid.');
  }
  if (end) end.setUTCHours(23, 59, 59, 999);
  if (start && end && start > end) throw new HttpError(400, 'From date cannot be later than to date.');
  return { ...(start ? { $gte: start } : {}), ...(end ? { $lte: end } : {}) };
}

function esc(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

