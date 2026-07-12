import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

export const tripStatuses = ['Draft', 'Dispatched', 'Completed', 'Cancelled'] as const;
export type TripStatus = (typeof tripStatuses)[number];

export type Trip = {
  tripNumber: string;
  source: string;
  destination: string;
  vehicle: Types.ObjectId;
  driver: Types.ObjectId;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  initialOdometer?: number;
  finalOdometer?: number;
  fuelConsumed?: number;
  revenue: number;
  status: TripStatus;
  dispatchedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type TripDocument = HydratedDocument<Trip>;

const tripSchema = new Schema<Trip>(
  {
    tripNumber: { type: String, required: true, unique: true, trim: true },
    source: { type: String, required: true, trim: true, maxlength: 120 },
    destination: { type: String, required: true, trim: true, maxlength: 120 },
    vehicle: { type: Schema.Types.ObjectId, required: true, ref: 'Vehicle' },
    driver: { type: Schema.Types.ObjectId, required: true, ref: 'Driver' },
    cargoWeight: { type: Number, required: true, min: 0.000001 },
    plannedDistance: { type: Number, required: true, min: 0.000001 },
    actualDistance: { type: Number, min: 0 },
    initialOdometer: { type: Number, min: 0 },
    finalOdometer: { type: Number, min: 0 },
    fuelConsumed: { type: Number, min: 0 },
    revenue: { type: Number, required: true, default: 0, min: 0 },
    status: { type: String, required: true, enum: tripStatuses, default: 'Draft' },
    dispatchedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true },
);

const tripCounterSchema = new Schema(
  { _id: { type: String, required: true }, sequence: { type: Number, required: true, default: 0 } },
  { versionKey: false },
);

export const TripModel = model<Trip>('Trip', tripSchema);
export const TripCounterModel = model('TripCounter', tripCounterSchema);
