import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';

type RoleGuardProps = PropsWithChildren<{ allowedRoles: UserRole[]; fallbackPath?: string }>;

export function RoleGuard({ allowedRoles, fallbackPath = '/dashboard', children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
