import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

export const licenseCategories = ['Light', 'Medium', 'Heavy', 'Commercial', 'Other'] as const;
export const driverStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'] as const;

export type LicenseCategory = (typeof licenseCategories)[number];
export type DriverStatus = (typeof driverStatuses)[number];

export type Driver = {
  employeeId: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: Date;
  contactNumber: string;
  email?: string;
  address?: string;
  safetyScore: number;
  status: DriverStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type DriverDocument = HydratedDocument<Driver>;

const driverSchema = new Schema<Driver>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    licenseNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    licenseCategory: { type: String, required: true, enum: licenseCategories },
    licenseExpiryDate: { type: Date, required: true },
    contactNumber: { type: String, required: true, trim: true, match: /^\+?[0-9][0-9 -]{7,18}$/ },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    address: { type: String, trim: true, maxlength: 300 },
    safetyScore: { type: Number, required: true, default: 100, min: 0, max: 100 },
    status: { type: String, required: true, enum: driverStatuses, default: 'Available' },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true },
);

export const DriverModel = model<Driver>('Driver', driverSchema);
