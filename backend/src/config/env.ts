import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['JWT_SECRET', 'MONGODB_URI'] as const;
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.warn(`[env] Missing ${missingEnv.join(', ')}. Add the values to backend/.env before starting the API.`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
};

export function assertRequiredEnvironment() {
  if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  }
}
