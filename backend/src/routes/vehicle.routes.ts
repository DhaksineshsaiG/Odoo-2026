import { Router } from 'express';
import {
  getVehicleById,
  getVehicles,
  patchVehicle,
  postVehicle,
  removeVehicle,
} from '../controllers/vehicle.controller.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.middleware.js';

export const vehicleRouter = Router();
const readRoles = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] as const;

vehicleRouter.use(requireAuth);
vehicleRouter.get('/', authorizeRoles(...readRoles), getVehicles);
vehicleRouter.get('/:id', authorizeRoles(...readRoles), getVehicleById);
vehicleRouter.post('/', authorizeRoles('fleet_manager'), postVehicle);
vehicleRouter.patch('/:id', authorizeRoles('fleet_manager'), patchVehicle);
vehicleRouter.delete('/:id', authorizeRoles('fleet_manager'), removeVehicle);
