import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { VehiclesPage } from '../pages/VehiclesPage';

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
            element: (
              <PlaceholderPage
                title="Driver Management"
                description="Manage operator records, assignments, licenses, and duty readiness."
              />
            ),
          },
          {
            path: 'trips',
            element: (
              <PlaceholderPage
                title="Trip Management"
                description="Plan, supervise, and audit scheduled trips and service routes."
              />
            ),
          },
          {
            path: 'maintenance',
            element: (
              <PlaceholderPage
                title="Maintenance"
                description="Track preventive maintenance, inspections, and workshop queues."
              />
            ),
          },
          {
            path: 'fuel-expense',
            element: (
              <PlaceholderPage
                title="Fuel & Expense"
                description="Monitor fuel usage, expense claims, and operating cost patterns."
              />
            ),
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
          {
            path: 'settings',
            element: (
              <PlaceholderPage
                title="Settings"
                description="Configure organization preferences, access rules, and platform defaults."
              />
            ),
          },
        ],
      },
    ],
  },
]);
