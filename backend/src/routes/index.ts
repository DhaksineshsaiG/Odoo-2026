import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { vehicleRouter } from './vehicle.routes.js';
import { driverRouter } from './driver.routes.js';
import { tripRouter } from './trip.routes.js';
import { maintenanceRouter } from './maintenance.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/drivers', driverRouter);
apiRouter.use('/trips', tripRouter);
apiRouter.use('/maintenance', maintenanceRouter);
