import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
export const expenseCategories = ['Insurance', 'Parking', 'Toll', 'Cleaning', 'Tyres', 'Repair', 'Registration', 'Miscellaneous'] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];
export type Expense = { expenseNumber: string; vehicle: Types.ObjectId; date: Date; category: ExpenseCategory; amount: number; description: string; createdBy: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type ExpenseDocument = HydratedDocument<Expense>;
const expenseSchema = new Schema<Expense>({ expenseNumber: { type: String, required: true, unique: true, trim: true }, vehicle: { type: Schema.Types.ObjectId, required: true, ref: 'Vehicle' }, date: { type: Date, required: true }, category: { type: String, required: true, enum: expenseCategories }, amount: { type: Number, required: true, min: 0.000001 }, description: { type: String, required: true, trim: true, maxlength: 1000 }, createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' } }, { timestamps: true });
const counterSchema = new Schema({ _id: { type: String, required: true }, sequence: { type: Number, required: true, default: 0 } }, { versionKey: false });
export const ExpenseModel = model<Expense>('Expense', expenseSchema); export const ExpenseCounterModel = model('ExpenseCounter', counterSchema);
