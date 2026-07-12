import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

export type FuelLog = { fuelNumber: string; vehicle: Types.ObjectId; date: Date; odometer: number; fuelQuantity: number; fuelCost: number; fuelStation?: string; fuelType?: string; notes?: string; createdBy: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type FuelDocument = HydratedDocument<FuelLog>;
const fuelSchema = new Schema<FuelLog>({
  fuelNumber: { type: String, required: true, unique: true, trim: true }, vehicle: { type: Schema.Types.ObjectId, required: true, ref: 'Vehicle' }, date: { type: Date, required: true }, odometer: { type: Number, required: true, min: 0 }, fuelQuantity: { type: Number, required: true, min: 0.000001 }, fuelCost: { type: Number, required: true, min: 0 }, fuelStation: { type: String, trim: true, maxlength: 160 }, fuelType: { type: String, trim: true, maxlength: 80 }, notes: { type: String, trim: true, maxlength: 1000 }, createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });
const counterSchema = new Schema({ _id: { type: String, required: true }, sequence: { type: Number, required: true, default: 0 } }, { versionKey: false });
export const FuelModel = model<FuelLog>('FuelLog', fuelSchema); export const FuelCounterModel = model('FuelCounter', counterSchema);
