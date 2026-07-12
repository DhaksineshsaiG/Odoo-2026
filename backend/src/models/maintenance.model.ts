import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

export const maintenanceTypes = ['Oil Change', 'Brake Service', 'Tyre Replacement', 'Engine Repair', 'Inspection', 'Electrical Repair', 'General Service', 'Other'] as const;
export const maintenancePriorities = ['Low', 'Medium', 'High', 'Critical'] as const;
export const maintenanceStatuses = ['Scheduled', 'Active', 'Completed', 'Cancelled'] as const;
export type MaintenanceType = (typeof maintenanceTypes)[number];
export type MaintenancePriority = (typeof maintenancePriorities)[number];
export type MaintenanceStatus = (typeof maintenanceStatuses)[number];

export type MaintenanceLog = {
  maintenanceNumber: string;
  vehicle: Types.ObjectId;
  type: MaintenanceType;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  serviceProvider?: string;
  technicianName?: string;
  cost: number;
  odometerAtService?: number;
  notes?: string;
  cancellationReason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type MaintenanceDocument = HydratedDocument<MaintenanceLog>;

const maintenanceSchema = new Schema<MaintenanceLog>({
  maintenanceNumber: { type: String, required: true, unique: true, trim: true },
  vehicle: { type: Schema.Types.ObjectId, required: true, ref: 'Vehicle' },
  type: { type: String, required: true, enum: maintenanceTypes },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  priority: { type: String, required: true, enum: maintenancePriorities, default: 'Medium' },
  status: { type: String, required: true, enum: maintenanceStatuses, default: 'Scheduled' },
  scheduledDate: { type: Date }, startedAt: { type: Date }, completedAt: { type: Date }, cancelledAt: { type: Date },
  serviceProvider: { type: String, trim: true, maxlength: 160 }, technicianName: { type: String, trim: true, maxlength: 160 },
  cost: { type: Number, required: true, default: 0, min: 0 }, odometerAtService: { type: Number, min: 0 },
  notes: { type: String, trim: true, maxlength: 2000 }, cancellationReason: { type: String, trim: true, maxlength: 500 },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

const counterSchema = new Schema({ _id: { type: String, required: true }, sequence: { type: Number, required: true, default: 0 } }, { versionKey: false });
export const MaintenanceLogModel = model<MaintenanceLog>('MaintenanceLog', maintenanceSchema);
export const MaintenanceCounterModel = model('MaintenanceCounter', counterSchema);
