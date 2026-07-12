import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

export const vehicleTypes = ['Van', 'Truck', 'Mini Truck', 'Bus', 'Car', 'Other'] as const;
export const vehicleStatuses = ['Available', 'On Trip', 'In Shop', 'Retired'] as const;

export type VehicleType = (typeof vehicleTypes)[number];
export type VehicleStatus = (typeof vehicleStatuses)[number];

export type Vehicle = {
  registrationNumber: string;
  name: string;
  model?: string;
  type: VehicleType;
  maximumLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type VehicleDocument = HydratedDocument<Vehicle>;

const vehicleSchema = new Schema<Vehicle>(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    model: { type: String, trim: true, maxlength: 120 },
    type: { type: String, required: true, enum: vehicleTypes },
    maximumLoadCapacity: { type: Number, required: true, min: 0.000001 },
    odometer: { type: Number, required: true, default: 0, min: 0 },
    acquisitionCost: { type: Number, required: true, default: 0, min: 0 },
    region: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, required: true, enum: vehicleStatuses, default: 'Available' },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true },
);

export const VehicleModel = model<Vehicle>('Vehicle', vehicleSchema);
