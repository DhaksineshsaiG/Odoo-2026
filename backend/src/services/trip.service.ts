import mongoose, { isValidObjectId, type ClientSession, type FilterQuery } from 'mongoose';
import { DriverModel } from '../models/driver.model.js';
import { TripCounterModel, TripModel, tripStatuses, type Trip, type TripDocument } from '../models/trip.model.js';
import { VehicleModel } from '../models/vehicle.model.js';
import { findDispatchEligibleDrivers } from './driver.service.js';
import { HttpError } from '../utils/http-error.js';
import type { TripInput } from '../validation/trip.validation.js';

export type TripListOptions = { search?: string; status?: string; vehicle?: string; driver?: string; from?: string; to?: string; sort?: string; page?: string; limit?: string };
type CompletionInput = { finalOdometer: number; fuelConsumed: number };

export async function listTrips(options: TripListOptions) {
  const filters = await buildFilters(options);
  const { page, limit } = pagination(options);
  const total = await TripModel.countDocuments(filters);
  const trips = await TripModel.find(filters).sort(sortFor(options.sort)).skip((page - 1) * limit).limit(limit).populate('vehicle').populate('driver');
  return { data: trips.map(toTripResponse), meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getTrip(id: string) {
  return toTripResponse(await findPopulatedTrip(id));
}

export async function createTrip(input: TripInput, userId: string) {
  await validateDraftResources(input.vehicle, input.driver, input.cargoWeight);
  const tripNumber = await nextTripNumber();
  const trip = await TripModel.create({ ...input, tripNumber, createdBy: userId, status: 'Draft' });
  return toTripResponse(await populateTrip(trip));
}

export async function updateTrip(id: string, input: Partial<TripInput>) {
  ensureId(id);
  const trip = await TripModel.findById(id);
  if (!trip) throw new HttpError(404, 'Trip not found.');
  if (trip.status !== 'Draft') throw new HttpError(400, 'Only Draft trips can be edited.');
  const candidate = { vehicle: input.vehicle ?? trip.vehicle.toString(), driver: input.driver ?? trip.driver.toString(), cargoWeight: input.cargoWeight ?? trip.cargoWeight };
  await validateDraftResources(candidate.vehicle, candidate.driver, candidate.cargoWeight);
  Object.assign(trip, input);
  await trip.save();
  return toTripResponse(await populateTrip(trip));
}

export async function dispatchTrip(id: string) {
  return executeAtomic(
    async (session) => {
      const trip = await TripModel.findById(id).session(session);
      if (!trip) throw new HttpError(404, 'Trip not found.');
      if (trip.status !== 'Draft') throw new HttpError(400, 'Only Draft trips can be dispatched.');
      const { vehicle, driver } = await validateDispatchResources(trip, session);
      await assertNoOtherDispatchedTrip(trip, session);
      const claimedVehicle = await VehicleModel.findOneAndUpdate({ _id: vehicle.id, status: 'Available' }, { status: 'On Trip' }, { new: true, session });
      if (!claimedVehicle) throw new HttpError(409, 'Vehicle is no longer available for dispatch.');
      const claimedDriver = await DriverModel.findOneAndUpdate({ _id: driver.id, status: 'Available', licenseExpiryDate: { $gt: new Date() } }, { status: 'On Trip' }, { new: true, session });
      if (!claimedDriver) throw new HttpError(409, 'Driver is no longer available for dispatch.');
      trip.status = 'Dispatched'; trip.initialOdometer = vehicle.odometer; trip.dispatchedAt = new Date();
      await trip.save({ session });
      return trip.id;
    },
    () => dispatchWithCompensation(id),
  ).then(getTrip);
}

export async function completeTrip(id: string, input: CompletionInput) {
  return executeAtomic(
    async (session) => completeInSession(id, input, session),
    () => completeWithCompensation(id, input),
  ).then(getTrip);
}

export async function cancelTrip(id: string, reason?: string) {
  return executeAtomic(
    async (session) => cancelInSession(id, reason, session),
    () => cancelWithCompensation(id, reason),
  ).then(getTrip);
}

export async function getEligibleVehicles() {
  const vehicles = await VehicleModel.find({ status: 'Available' }).select('registrationNumber name model type maximumLoadCapacity odometer region status');
  return vehicles.map((vehicle) => ({ id: vehicle.id, registrationNumber: vehicle.registrationNumber, name: vehicle.name, model: vehicle.model, type: vehicle.type, maximumLoadCapacity: vehicle.maximumLoadCapacity, odometer: vehicle.odometer, region: vehicle.region, status: vehicle.status }));
}

export async function getEligibleDrivers() {
  const drivers = await findDispatchEligibleDrivers().select('employeeId name licenseNumber licenseCategory licenseExpiryDate safetyScore status');
  return drivers.map((driver) => ({ id: driver.id, employeeId: driver.employeeId, name: driver.name, licenseNumber: driver.licenseNumber, licenseCategory: driver.licenseCategory, licenseExpiryDate: driver.licenseExpiryDate, safetyScore: driver.safetyScore, status: driver.status }));
}

async function completeInSession(id: string, input: CompletionInput, session: ClientSession) {
  const trip = await TripModel.findById(id).session(session);
  if (!trip) throw new HttpError(404, 'Trip not found.');
  if (trip.status !== 'Dispatched') throw new HttpError(400, 'Only Dispatched trips can be completed.');
  if (trip.initialOdometer === undefined || input.finalOdometer < trip.initialOdometer) throw new HttpError(400, 'finalOdometer cannot be lower than initialOdometer.');
  const vehicle = await VehicleModel.findById(trip.vehicle).session(session);
  const driver = await DriverModel.findById(trip.driver).session(session);
  if (!vehicle || !driver) throw new HttpError(400, 'Trip vehicle and driver must still exist.');
  const vehicleUpdated = await VehicleModel.findOneAndUpdate({ _id: vehicle.id, status: 'On Trip' }, { status: 'Available', odometer: input.finalOdometer }, { new: true, session });
  if (!vehicleUpdated) throw new HttpError(409, 'Vehicle is not currently assigned to this dispatched trip.');
  const driverUpdated = await DriverModel.findOneAndUpdate({ _id: driver.id, status: 'On Trip' }, { status: 'Available' }, { new: true, session });
  if (!driverUpdated) throw new HttpError(409, 'Driver is not currently assigned to this dispatched trip.');
  trip.actualDistance = input.finalOdometer - trip.initialOdometer; trip.finalOdometer = input.finalOdometer; trip.fuelConsumed = input.fuelConsumed; trip.status = 'Completed'; trip.completedAt = new Date();
  await trip.save({ session });
  return trip.id;
}

async function cancelInSession(id: string, reason: string | undefined, session: ClientSession) {
  const trip = await TripModel.findById(id).session(session);
  if (!trip) throw new HttpError(404, 'Trip not found.');
  if (trip.status !== 'Draft' && trip.status !== 'Dispatched') throw new HttpError(400, 'Only Draft or Dispatched trips can be cancelled.');
  if (trip.status === 'Dispatched') {
    const vehicle = await VehicleModel.findOneAndUpdate({ _id: trip.vehicle, status: 'On Trip' }, { status: 'Available' }, { new: true, session });
    const driver = await DriverModel.findOneAndUpdate({ _id: trip.driver, status: 'On Trip' }, { status: 'Available' }, { new: true, session });
    if (!vehicle || !driver) throw new HttpError(409, 'Trip resources are not in the expected dispatched state.');
  }
  trip.status = 'Cancelled'; trip.cancelledAt = new Date(); trip.cancellationReason = reason;
  await trip.save({ session });
  return trip.id;
}

async function dispatchWithCompensation(id: string) {
  const trip = await TripModel.findById(id);
  if (!trip) throw new HttpError(404, 'Trip not found.');
  if (trip.status !== 'Draft') throw new HttpError(400, 'Only Draft trips can be dispatched.');
  const { vehicle, driver } = await validateDispatchResources(trip);
  await assertNoOtherDispatchedTrip(trip);
  let vehicleClaimed = false; let driverClaimed = false;
  try {
    if (!await VehicleModel.findOneAndUpdate({ _id: vehicle.id, status: 'Available' }, { status: 'On Trip' })) throw new HttpError(409, 'Vehicle is no longer available for dispatch.');
    vehicleClaimed = true;
    if (!await DriverModel.findOneAndUpdate({ _id: driver.id, status: 'Available', licenseExpiryDate: { $gt: new Date() } }, { status: 'On Trip' })) throw new HttpError(409, 'Driver is no longer available for dispatch.');
    driverClaimed = true;
    const updated = await TripModel.findOneAndUpdate({ _id: id, status: 'Draft' }, { status: 'Dispatched', initialOdometer: vehicle.odometer, dispatchedAt: new Date() });
    if (!updated) throw new HttpError(409, 'Trip state changed before it could be dispatched.');
    return id;
  } catch (error) {
    if (driverClaimed) await DriverModel.updateOne({ _id: driver.id, status: 'On Trip' }, { status: 'Available' });
    if (vehicleClaimed) await VehicleModel.updateOne({ _id: vehicle.id, status: 'On Trip' }, { status: 'Available' });
    throw error;
  }
}

async function completeWithCompensation(id: string, input: CompletionInput) {
  const trip = await TripModel.findById(id);
  if (!trip) throw new HttpError(404, 'Trip not found.');
  if (trip.status !== 'Dispatched' || trip.initialOdometer === undefined) throw new HttpError(400, 'Only Dispatched trips can be completed.');
  if (input.finalOdometer < trip.initialOdometer) throw new HttpError(400, 'finalOdometer cannot be lower than initialOdometer.');
  const vehicle = await VehicleModel.findById(trip.vehicle); const driver = await DriverModel.findById(trip.driver);
  if (!vehicle || !driver) throw new HttpError(400, 'Trip vehicle and driver must still exist.');
  let vehicleUpdated = false; let driverUpdated = false;
  try {
    if (!await VehicleModel.findOneAndUpdate({ _id: vehicle.id, status: 'On Trip' }, { status: 'Available', odometer: input.finalOdometer })) throw new HttpError(409, 'Vehicle is not currently assigned to this dispatched trip.');
    vehicleUpdated = true;
    if (!await DriverModel.findOneAndUpdate({ _id: driver.id, status: 'On Trip' }, { status: 'Available' })) throw new HttpError(409, 'Driver is not currently assigned to this dispatched trip.');
    driverUpdated = true;
    if (!await TripModel.findOneAndUpdate({ _id: id, status: 'Dispatched' }, { status: 'Completed', actualDistance: input.finalOdometer - trip.initialOdometer, finalOdometer: input.finalOdometer, fuelConsumed: input.fuelConsumed, completedAt: new Date() })) throw new HttpError(409, 'Trip state changed before it could be completed.');
    return id;
  } catch (error) {
    if (driverUpdated) await DriverModel.updateOne({ _id: driver.id, status: 'Available' }, { status: 'On Trip' });
    if (vehicleUpdated) await VehicleModel.updateOne({ _id: vehicle.id, status: 'Available', odometer: input.finalOdometer }, { status: 'On Trip', odometer: vehicle.odometer });
    throw error;
  }
}

async function cancelWithCompensation(id: string, reason?: string) {
  const trip = await TripModel.findById(id);
  if (!trip) throw new HttpError(404, 'Trip not found.');
  if (trip.status === 'Draft') {
    if (!await TripModel.findOneAndUpdate({ _id: id, status: 'Draft' }, { status: 'Cancelled', cancelledAt: new Date(), cancellationReason: reason })) throw new HttpError(409, 'Trip state changed before it could be cancelled.');
    return id;
  }
  if (trip.status !== 'Dispatched') throw new HttpError(400, 'Only Draft or Dispatched trips can be cancelled.');
  let vehicleReleased = false; let driverReleased = false;
  try {
    if (!await VehicleModel.findOneAndUpdate({ _id: trip.vehicle, status: 'On Trip' }, { status: 'Available' })) throw new HttpError(409, 'Trip vehicle is not in the expected dispatched state.');
    vehicleReleased = true;
    if (!await DriverModel.findOneAndUpdate({ _id: trip.driver, status: 'On Trip' }, { status: 'Available' })) throw new HttpError(409, 'Trip driver is not in the expected dispatched state.');
    driverReleased = true;
    if (!await TripModel.findOneAndUpdate({ _id: id, status: 'Dispatched' }, { status: 'Cancelled', cancelledAt: new Date(), cancellationReason: reason })) throw new HttpError(409, 'Trip state changed before it could be cancelled.');
    return id;
  } catch (error) {
    if (driverReleased) await DriverModel.updateOne({ _id: trip.driver, status: 'Available' }, { status: 'On Trip' });
    if (vehicleReleased) await VehicleModel.updateOne({ _id: trip.vehicle, status: 'Available' }, { status: 'On Trip' });
    throw error;
  }
}

async function validateDraftResources(vehicleId: string, driverId: string, cargoWeight: number) {
  const [vehicle, driver] = await Promise.all([VehicleModel.findById(vehicleId), DriverModel.findById(driverId)]);
  if (!vehicle) throw new HttpError(400, 'Selected vehicle does not exist.');
  if (!driver) throw new HttpError(400, 'Selected driver does not exist.');
  if (vehicle.status !== 'Available') throw new HttpError(400, 'Selected vehicle is not available for a Draft trip.');
  if (driver.status !== 'Available' || driver.licenseExpiryDate <= new Date()) throw new HttpError(400, 'Selected driver is not eligible for a Draft trip.');
  if (cargoWeight > vehicle.maximumLoadCapacity) throw new HttpError(400, 'Cargo weight exceeds vehicle maximum load capacity.');
  return { vehicle, driver };
}

async function validateDispatchResources(trip: TripDocument, session?: ClientSession) {
  const vehicleQuery = VehicleModel.findById(trip.vehicle); const driverQuery = DriverModel.findById(trip.driver);
  if (session) { vehicleQuery.session(session); driverQuery.session(session); }
  const [vehicle, driver] = await Promise.all([vehicleQuery, driverQuery]);
  if (!vehicle || !driver) throw new HttpError(400, 'Trip vehicle and driver must still exist.');
  if (vehicle.status !== 'Available') throw new HttpError(400, 'Vehicle is not available for dispatch.');
  if (driver.status !== 'Available' || driver.licenseExpiryDate <= new Date()) throw new HttpError(400, 'Driver is not eligible for dispatch.');
  if (trip.cargoWeight > vehicle.maximumLoadCapacity) throw new HttpError(400, 'Cargo weight exceeds vehicle maximum load capacity.');
  return { vehicle, driver };
}

async function assertNoOtherDispatchedTrip(trip: TripDocument, session?: ClientSession) {
  const query = TripModel.exists({ _id: { $ne: trip.id }, status: 'Dispatched', $or: [{ vehicle: trip.vehicle }, { driver: trip.driver }] });
  if (session) query.session(session);
  if (await query) throw new HttpError(409, 'Vehicle or driver is already attached to another dispatched trip.');
}

async function executeAtomic<T>(operation: (session: ClientSession) => Promise<T>, fallback: () => Promise<T>) {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => { result = await operation(session); });
    return result as T;
  } catch (error) {
    if (isTransactionUnsupported(error)) return fallback();
    throw error;
  } finally { await session.endSession(); }
}

function isTransactionUnsupported(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return /Transaction numbers are only allowed|does not support transactions|replica set/i.test(message);
}

async function nextTripNumber() {
  const year = new Date().getFullYear();
  const counter = await TripCounterModel.findOneAndUpdate({ _id: `trip-${year}` }, { $inc: { sequence: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return `TRIP-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

async function buildFilters(options: TripListOptions): Promise<FilterQuery<Trip>> {
  const filters: FilterQuery<Trip> = {};
  const status = text(options.status); const vehicle = text(options.vehicle); const driver = text(options.driver); const search = text(options.search);
  if (status) { if (!tripStatuses.includes(status as (typeof tripStatuses)[number])) throw new HttpError(400, 'status is invalid.'); filters.status = status; }
  if (vehicle) { ensureId(vehicle); filters.vehicle = vehicle; }
  if (driver) { ensureId(driver); filters.driver = driver; }
  if (options.from || options.to) filters.createdAt = dateRange(options.from, options.to);
  if (search) {
    const expression = new RegExp(escapeRegExp(search), 'i');
    const [vehicles, drivers] = await Promise.all([VehicleModel.find({ registrationNumber: expression }).select('_id'), DriverModel.find({ name: expression }).select('_id')]);
    filters.$or = [{ tripNumber: expression }, { source: expression }, { destination: expression }, { vehicle: { $in: vehicles.map((item) => item.id) } }, { driver: { $in: drivers.map((item) => item.id) } }];
  }
  return filters;
}

function sortFor(value: string | undefined) { const options: Record<string, Record<string, 1 | -1>> = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, tripNumber: { tripNumber: 1 }, plannedDistance: { plannedDistance: -1 }, actualDistance: { actualDistance: -1 } }; const sort = text(value) ?? 'newest'; if (!options[sort]) throw new HttpError(400, 'sort is invalid.'); return options[sort]; }
function pagination(options: TripListOptions) { return { page: positiveInteger(options.page, 1, 'page'), limit: positiveInteger(options.limit, 20, 'limit', 100) }; }
function positiveInteger(value: string | undefined, fallback: number, name: string, maximum?: number) { if (value === undefined) return fallback; const parsed = Number(value); if (!Number.isInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) throw new HttpError(400, `${name} must be a positive integer.`); return parsed; }
function dateRange(from?: string, to?: string) { const range: Record<string, Date> = {}; if (from) { const date = new Date(from); if (Number.isNaN(date.getTime())) throw new HttpError(400, 'from is invalid.'); range.$gte = date; } if (to) { const date = new Date(to); if (Number.isNaN(date.getTime())) throw new HttpError(400, 'to is invalid.'); date.setHours(23, 59, 59, 999); range.$lte = date; } return range; }
async function findPopulatedTrip(id: string) { ensureId(id); const trip = await TripModel.findById(id).populate('vehicle').populate('driver'); if (!trip) throw new HttpError(404, 'Trip not found.'); return trip; }
async function populateTrip(trip: TripDocument) { return (await trip.populate('vehicle')).populate('driver'); }
function ensureId(value: string) { if (!isValidObjectId(value)) throw new HttpError(400, 'Trip ID is invalid.'); }
function text(value: string | undefined) { return value?.trim(); }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function toTripResponse(trip: TripDocument) { const vehicle = summary(trip.vehicle as unknown, ['registrationNumber', 'name', 'model', 'type', 'maximumLoadCapacity', 'odometer', 'region', 'status']); const driver = summary(trip.driver as unknown, ['employeeId', 'name', 'licenseNumber', 'licenseCategory', 'licenseExpiryDate', 'safetyScore', 'status']); return { id: trip.id, tripNumber: trip.tripNumber, source: trip.source, destination: trip.destination, vehicle, driver, cargoWeight: trip.cargoWeight, plannedDistance: trip.plannedDistance, actualDistance: trip.actualDistance, initialOdometer: trip.initialOdometer, finalOdometer: trip.finalOdometer, fuelConsumed: trip.fuelConsumed, revenue: trip.revenue, status: trip.status, dispatchedAt: trip.dispatchedAt, completedAt: trip.completedAt, cancelledAt: trip.cancelledAt, cancellationReason: trip.cancellationReason, createdBy: trip.createdBy.toString(), createdAt: trip.createdAt, updatedAt: trip.updatedAt }; }
function summary(value: unknown, fields: string[]) { if (isRecord(value) && '_id' in value) { const item: Record<string, unknown> = { id: String(value._id) }; for (const field of fields) item[field] = value[field]; return item; } return { id: String(value) }; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
