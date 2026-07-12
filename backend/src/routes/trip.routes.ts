import { Router } from 'express';
import { authorizeRoles, requireAuth } from '../middleware/auth.middleware.js';
import { cancel, complete, dispatch, eligibleDrivers, eligibleVehicles, getTripById, getTrips, patchTrip, postTrip } from '../controllers/trip.controller.js';

export const tripRouter = Router();
const readRoles = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] as const;
const managementRoles = ['fleet_manager', 'dispatcher'] as const;

tripRouter.use(requireAuth);
tripRouter.get('/', authorizeRoles(...readRoles), getTrips);
tripRouter.get('/options/eligible-vehicles', authorizeRoles(...managementRoles), eligibleVehicles);
tripRouter.get('/options/eligible-drivers', authorizeRoles(...managementRoles), eligibleDrivers);
tripRouter.post('/', authorizeRoles(...managementRoles), postTrip);
tripRouter.patch('/:id', authorizeRoles(...managementRoles), patchTrip);
tripRouter.post('/:id/dispatch', authorizeRoles(...managementRoles), dispatch);
tripRouter.post('/:id/complete', authorizeRoles(...managementRoles), complete);
tripRouter.post('/:id/cancel', authorizeRoles(...managementRoles), cancel);
tripRouter.get('/:id', authorizeRoles(...readRoles), getTripById);
