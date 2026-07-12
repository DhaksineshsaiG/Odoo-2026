import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { assertRequiredEnvironment } from '../config/env.js';
import { UserModel, type UserRole } from '../models/user.model.js';
import { VehicleModel, type VehicleStatus, type VehicleType } from '../models/vehicle.model.js';
import { DriverModel, type DriverStatus, type LicenseCategory } from '../models/driver.model.js';

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

const demoVehicles: Array<{
  registrationNumber: string;
  name: string;
  model: string;
  type: VehicleType;
  maximumLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
}> = [
  {
    registrationNumber: 'TN39AB1001',
    name: 'Tata Ace',
    model: 'Gold',
    type: 'Mini Truck',
    maximumLoadCapacity: 750,
    odometer: 12400,
    acquisitionCost: 850000,
    region: 'Coimbatore',
    status: 'Available',
  },
  {
    registrationNumber: 'TN38CD2002',
    name: 'Ashok Leyland Dost',
    model: 'Plus',
    type: 'Van',
    maximumLoadCapacity: 1500,
    odometer: 28150,
    acquisitionCost: 1100000,
    region: 'Tiruppur',
    status: 'Available',
  },
  {
    registrationNumber: 'TN37EF3003',
    name: 'BharatBenz',
    model: '1923C',
    type: 'Truck',
    maximumLoadCapacity: 12000,
    odometer: 80200,
    acquisitionCost: 3200000,
    region: 'Erode',
    status: 'In Shop',
  },
];

const expiringLicenseDate = new Date();
expiringLicenseDate.setDate(expiringLicenseDate.getDate() + 14);

const demoDrivers: Array<{
  employeeId: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: Date;
  contactNumber: string;
  email: string;
  address: string;
  safetyScore: number;
  status: DriverStatus;
}> = [
  {
    employeeId: 'EMP001', name: 'Alex Johnson', licenseNumber: 'TNDL123456789', licenseCategory: 'Heavy',
    licenseExpiryDate: new Date('2028-12-31T00:00:00.000Z'), contactNumber: '9876543210', email: 'alex@transitops.com',
    address: 'Coimbatore', safetyScore: 95, status: 'Available',
  },
  {
    employeeId: 'EMP002', name: 'Sarah Williams', licenseNumber: 'TNDL987654321', licenseCategory: 'Light',
    licenseExpiryDate: expiringLicenseDate, contactNumber: '9123456780', email: 'sarah@transitops.com',
    address: 'Tiruppur', safetyScore: 89, status: 'Available',
  },
  {
    employeeId: 'EMP003', name: 'Michael Davis', licenseNumber: 'TNDL567891234', licenseCategory: 'Heavy',
    licenseExpiryDate: new Date('2025-12-31T00:00:00.000Z'), contactNumber: '9988776655', email: 'michael@transitops.com',
    address: 'Erode', safetyScore: 70, status: 'Suspended',
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

  const fleetManager = await UserModel.findOne({ email: 'manager@transitops.com' });
  if (!fleetManager) {
    throw new Error('Fleet manager demo user was not found after seeding.');
  }

  for (const demoVehicle of demoVehicles) {
    const existingVehicle = await VehicleModel.findOne({ registrationNumber: demoVehicle.registrationNumber });

    if (existingVehicle) {
      console.info(`[seed] ${demoVehicle.registrationNumber} already exists; skipped.`);
      continue;
    }

    await VehicleModel.create({ ...demoVehicle, createdBy: fleetManager.id });
    console.info(`[seed] Created vehicle ${demoVehicle.registrationNumber}.`);
  }

  for (const demoDriver of demoDrivers) {
    const existingDriver = await DriverModel.findOne({ employeeId: demoDriver.employeeId });
    if (existingDriver) {
      console.info(`[seed] ${demoDriver.employeeId} already exists; skipped.`);
      continue;
    }

    await DriverModel.create({ ...demoDriver, createdBy: fleetManager.id });
    console.info(`[seed] Created driver ${demoDriver.employeeId}.`);
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
