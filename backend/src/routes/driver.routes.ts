import { Router } from 'express';
import { getDriverById, getDrivers, patchDriver, postDriver, removeDriver } from '../controllers/driver.controller.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.middleware.js';

export const driverRouter = Router();
const readRoles = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] as const;
const managementRoles = ['fleet_manager', 'safety_officer'] as const;

driverRouter.use(requireAuth);
driverRouter.get('/', authorizeRoles(...readRoles), getDrivers);
driverRouter.get('/:id', authorizeRoles(...readRoles), getDriverById);
driverRouter.post('/', authorizeRoles(...managementRoles), postDriver);
driverRouter.patch('/:id', authorizeRoles(...managementRoles), patchDriver);
driverRouter.delete('/:id', authorizeRoles('fleet_manager'), removeDriver);
