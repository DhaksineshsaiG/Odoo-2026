import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { assertRequiredEnvironment } from '../config/env.js';
import { UserModel, type UserRole } from '../models/user.model.js';

const demoUsers: Array<{ name: string; email: string; password: string; role: UserRole }> = [
  {
    name: 'Fleet Manager',
    email: 'manager@transitops.com',
    password: 'Manager@123',
    role: 'fleet_manager',
  },
  {
    name: 'Dispatcher',
    email: 'dispatcher@transitops.com',
    password: 'Dispatcher@123',
    role: 'dispatcher',
  },
  {
    name: 'Safety Officer',
    email: 'safety@transitops.com',
    password: 'Safety@123',
    role: 'safety_officer',
  },
  {
    name: 'Financial Analyst',
    email: 'finance@transitops.com',
    password: 'Finance@123',
    role: 'financial_analyst',
  },
];

async function seed() {
  assertRequiredEnvironment();
  await connectDatabase();

  for (const demoUser of demoUsers) {
    const existingUser = await UserModel.findOne({ email: demoUser.email });

    if (existingUser) {
      console.info(`[seed] ${demoUser.email} already exists; skipped.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(demoUser.password, 12);
    await UserModel.create({ ...demoUser, passwordHash, status: 'active' });
    console.info(`[seed] Created ${demoUser.email}.`);
  }
}

seed()
  .catch((error: unknown) => {
    console.error('[seed] Failed to create demo users.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
