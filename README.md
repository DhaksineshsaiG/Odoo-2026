# TransitOps — Smart Transport Operations Platform

TransitOps is a role-aware fleet operations platform built for transport teams that need one reliable place to manage vehicles, drivers, trips, maintenance, fuel, and operating expenses. It replaces fragmented spreadsheets and manual status tracking with validated workflows and a consistent operational record.

## Main Features

- JWT authentication with session restoration and role-based access control
- Vehicle registry with availability, capacity, odometer, cost, and region tracking
- Driver management with licence expiry, safety score, and availability controls
- Draft, dispatch, completion, and cancellation workflows for trips
- Scheduled, active, completed, and cancelled maintenance workflows
- Fuel log and vehicle expense management with search, filters, and sorting
- Responsive protected application layout for desktop and mobile use

## Business Rules

TransitOps enforces critical operational rules on the backend:

1. Vehicle registration numbers are unique and normalized to uppercase.
2. Retired, In Shop, and On Trip vehicles cannot be selected for dispatch.
3. Suspended, Off Duty, On Trip, or expired-licence drivers cannot be dispatched.
4. A vehicle or driver already On Trip cannot be assigned to another dispatched trip.
5. Cargo weight cannot exceed the selected vehicle's maximum load capacity.
6. Dispatching atomically changes the trip, vehicle, and driver to their active states.
7. Completing a trip updates distance and odometer data and restores vehicle and driver availability.
8. Cancelling a dispatched trip restores vehicle and driver availability.
9. Starting maintenance changes the vehicle status to In Shop and removes it from dispatch eligibility.
10. Completing or cancelling active maintenance restores the vehicle to Available unless it is Retired.
11. Fuel quantity must be positive, fuel cost cannot be negative, and fuel-log odometers cannot decrease.
12. Vehicle expenses must be positive and use an allowed category.

## Tech Stack

### Frontend

- React 18, Vite, and TypeScript
- Tailwind CSS
- React Router
- Lucide React icons

### Backend

- Node.js, Express, and TypeScript
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing

## Project Structure

```text
TransitOps/
|-- frontend/
|   |-- src/components/    Reusable UI, layout, auth, and module dialogs
|   |-- src/contexts/      Authentication state
|   |-- src/pages/         Application pages
|   |-- src/services/      Typed API clients
|   `-- src/types/         Frontend domain contracts
|-- backend/
|   |-- src/config/        Environment and database configuration
|   |-- src/controllers/   HTTP request handlers
|   |-- src/middleware/    Authentication, RBAC, and error handling
|   |-- src/models/        Mongoose models
|   |-- src/routes/        Express routes
|   |-- src/services/      Business rules and workflow transactions
|   |-- src/validation/    Request validation
|   `-- src/scripts/       Idempotent demo seed
`-- package.json           Workspace scripts
```

## Setup

### Prerequisites

- Node.js 20 or later
- npm
- MongoDB deployment, either local MongoDB or MongoDB Atlas

### Installation

```bash
npm install
```

Create local environment files from the committed examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Update only the local `.env` files. Never commit real database credentials or JWT secrets.

### Environment Variables

Backend variables are documented in `backend/.env.example`:

- `NODE_ENV`
- `PORT`
- `CLIENT_ORIGIN`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

Frontend variables are documented in `frontend/.env.example`:

- `VITE_API_URL`

### Seed and Run

```bash
npm run seed
npm run dev
```

The default development URLs are:

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Commands

```bash
npm install
npm run seed
npm run dev
npm run lint
npm run build
```

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Fleet Manager | `manager@transitops.com` | `Manager@123` |
| Driver / Dispatcher | `dispatcher@transitops.com` | `Dispatcher@123` |
| Safety Officer | `safety@transitops.com` | `Safety@123` |
| Financial Analyst | `finance@transitops.com` | `Finance@123` |

These accounts are development demo users created by the idempotent seed script.

## API Modules

- `/api/auth` - login and current-user session
- `/api/vehicles` - vehicle registry and fleet availability
- `/api/drivers` - driver records and dispatch eligibility
- `/api/trips` - trip records, dispatch, completion, and cancellation
- `/api/maintenance` - maintenance scheduling and lifecycle transitions
- `/api/fuel` - fuel log management
- `/api/expenses` - vehicle operating expenses
- `/api/health` - service health check

All operational modules require a valid Bearer token. Write operations are protected by backend RBAC.

## Core Demo Workflow

1. Sign in as Fleet Manager.
2. Register an Available vehicle with a 500 kg maximum load.
3. Register an Available driver with a future licence expiry date.
4. Create a Draft trip with 450 kg cargo and dispatch it.
5. Confirm the selected vehicle and driver become On Trip.
6. Complete the trip with a final odometer and fuel consumed.
7. Confirm the vehicle and driver return to Available and the trip distance is calculated.
8. Schedule and start maintenance for the same vehicle.
9. Confirm the vehicle becomes In Shop and is excluded from trip dispatch options.
10. Complete maintenance and confirm the vehicle returns to Available.
11. Add a fuel log and a vehicle expense.

## Known Limitations

- Advanced dashboard charts and report generation are not completed.
- Email reminders are a bonus feature and are not implemented.
- PDF export is a bonus feature and is not implemented.
- Fuel efficiency and cost analytics are stored for future reporting but are not yet visualized.
