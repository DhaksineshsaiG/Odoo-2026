import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
  type VehicleListOptions,
} from '../services/vehicle.service.js';
import { validateVehicleInput } from '../validation/vehicle.validation.js';
import type { VehicleInput } from '../validation/vehicle.validation.js';

export async function getVehicles(request: Request, response: Response, next: NextFunction) {
  try {
    const result = await listVehicles(request.query as VehicleListOptions);
    response.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getVehicleById(request: Request, response: Response, next: NextFunction) {
  try {
    const vehicle = await getVehicle(readRouteParam(request.params.id));
    response.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
}

export async function postVehicle(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    const input = validateVehicleInput(request.body) as VehicleInput;
    const vehicle = await createVehicle(input, request.user!.id);
    response.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
}

export async function patchVehicle(request: Request, response: Response, next: NextFunction) {
  try {
    const input = validateVehicleInput(request.body, true);
    const vehicle = await updateVehicle(readRouteParam(request.params.id), input);
    response.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
}

export async function removeVehicle(request: Request, response: Response, next: NextFunction) {
  try {
    const id = readRouteParam(request.params.id);
    await deleteVehicle(id);
    response.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
}

function readRouteParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
