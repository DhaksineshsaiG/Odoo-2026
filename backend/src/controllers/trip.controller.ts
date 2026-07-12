import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  cancelTrip,
  completeTrip,
  createTrip,
  dispatchTrip,
  getEligibleDrivers,
  getEligibleVehicles,
  getTrip,
  listTrips,
  updateTrip,
  type TripListOptions,
} from '../services/trip.service.js';
import { validateCancellationInput, validateCompletionInput, validateTripInput, type TripInput } from '../validation/trip.validation.js';

export async function getTrips(request: Request, response: Response, next: NextFunction) { try { response.status(200).json({ success: true, ...(await listTrips(request.query as TripListOptions)) }); } catch (error) { next(error); } }
export async function getTripById(request: Request, response: Response, next: NextFunction) { try { response.status(200).json({ success: true, data: await getTrip(param(request.params.id)) }); } catch (error) { next(error); } }
export async function postTrip(request: AuthenticatedRequest, response: Response, next: NextFunction) { try { response.status(201).json({ success: true, data: await createTrip(validateTripInput(request.body) as TripInput, request.user!.id) }); } catch (error) { next(error); } }
export async function patchTrip(request: Request, response: Response, next: NextFunction) { try { response.status(200).json({ success: true, data: await updateTrip(param(request.params.id), validateTripInput(request.body, true)) }); } catch (error) { next(error); } }
export async function dispatch(request: Request, response: Response, next: NextFunction) { try { response.status(200).json({ success: true, message: 'Trip dispatched successfully', data: await dispatchTrip(param(request.params.id)) }); } catch (error) { next(error); } }
export async function complete(request: Request, response: Response, next: NextFunction) { try { response.status(200).json({ success: true, message: 'Trip completed successfully', data: await completeTrip(param(request.params.id), validateCompletionInput(request.body)) }); } catch (error) { next(error); } }
export async function cancel(request: Request, response: Response, next: NextFunction) { try { const { reason } = validateCancellationInput(request.body); response.status(200).json({ success: true, message: 'Trip cancelled successfully', data: await cancelTrip(param(request.params.id), reason) }); } catch (error) { next(error); } }
export async function eligibleVehicles(_request: Request, response: Response, next: NextFunction) { try { response.status(200).json({ success: true, data: await getEligibleVehicles() }); } catch (error) { next(error); } }
export async function eligibleDrivers(_request: Request, response: Response, next: NextFunction) { try { response.status(200).json({ success: true, data: await getEligibleDrivers() }); } catch (error) { next(error); } }
function param(value: string | string[]) { return Array.isArray(value) ? value[0] : value; }
