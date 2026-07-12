import { Schema, model, type HydratedDocument } from 'mongoose';

export const userRoles = [
  'fleet_manager',
  'dispatcher',
  'safety_officer',
  'financial_analyst',
] as const;

export const userStatuses = ['active', 'inactive'] as const;

export type UserRole = (typeof userRoles)[number];
export type UserStatus = (typeof userStatuses)[number];

export type User = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: userRoles },
    status: { type: String, required: true, enum: userStatuses, default: 'active' },
  },
  { timestamps: true },
);

export const UserModel = model<User>('User', userSchema);
