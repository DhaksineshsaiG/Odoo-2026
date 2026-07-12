import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-sm font-medium text-slate-300">
      Restoring your session...
    </main>
  );
}
