import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { DriversPage } from '../pages/DriversPage';
import { TripsPage } from '../pages/TripsPage';
import { MaintenancePage } from '../pages/MaintenancePage';
import { FuelExpensePage } from '../pages/FuelExpensePage';

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          {
            path: 'vehicles',
            element: <VehiclesPage />,
          },
          {
            path: 'drivers',
            element: <DriversPage />,
          },
          {
            path: 'trips',
            element: <TripsPage />,
          },
          {
            path: 'maintenance',
            element: <MaintenancePage />,
          },
          {
            path: 'fuel-expense',
            element: <FuelExpensePage />,
          },
          {
            path: 'reports',
            element: (
              <PlaceholderPage
                title="Reports"
                description="Prepare operational insights, performance summaries, and compliance exports."
              />
            ),
          },
        ],
      },
    ],
  },
]);
