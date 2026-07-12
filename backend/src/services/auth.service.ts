import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { UserModel, type UserDocument } from '../models/user.model.js';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserDocument['role'];
  status: UserDocument['status'];
  createdAt: Date;
  updatedAt: Date;
};

export async function loginUser(email: string, password: string) {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user || user.status !== 'active' || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  return { token: createToken(user), user: toSafeUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await UserModel.findById(userId);

  if (!user || user.status !== 'active') {
    throw new HttpError(401, 'Your session is no longer active. Please sign in again.');
  }

  return toSafeUser(user);
}

export function toSafeUser(user: UserDocument): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createToken(user: UserDocument) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] },
  );
}
