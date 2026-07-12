import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { vehicleRouter } from './vehicle.routes.js';
import { driverRouter } from './driver.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/drivers', driverRouter);
