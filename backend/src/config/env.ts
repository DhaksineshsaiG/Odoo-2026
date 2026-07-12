import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['JWT_SECRET', 'MONGODB_URI'] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`[env] ${key} is not set. Add it to backend/.env for local development.`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/transitops',
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
};
