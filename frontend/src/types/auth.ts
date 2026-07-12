export const roles = [
  'fleet_manager',
  'dispatcher',
  'safety_officer',
  'financial_analyst',
] as const;

export type UserRole = (typeof roles)[number];

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export const roleLabels: Record<UserRole, string> = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
};
