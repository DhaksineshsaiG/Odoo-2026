import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createDriver,
  deleteDriver,
  getDriver,
  listDrivers,
  updateDriver,
  type DriverListOptions,
} from '../services/driver.service.js';
import { validateDriverInput, type DriverInput } from '../validation/driver.validation.js';

export async function getDrivers(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ success: true, ...(await listDrivers(request.query as DriverListOptions)) });
  } catch (error) { next(error); }
}

export async function getDriverById(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ success: true, data: await getDriver(readRouteParam(request.params.id)) });
  } catch (error) { next(error); }
}

export async function postDriver(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const input = validateDriverInput(request.body) as DriverInput;
    response.status(201).json({ success: true, data: await createDriver(input, request.user!.id) });
  } catch (error) { next(error); }
}

export async function patchDriver(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ success: true, data: await updateDriver(readRouteParam(request.params.id), validateDriverInput(request.body, true)) });
  } catch (error) { next(error); }
}

export async function removeDriver(request: Request, response: Response, next: NextFunction) {
  try {
    const id = readRouteParam(request.params.id);
    await deleteDriver(id);
    response.status(200).json({ success: true, data: { id } });
  } catch (error) { next(error); }
}

function readRouteParam(value: string | string[]) { return Array.isArray(value) ? value[0] : value; }
