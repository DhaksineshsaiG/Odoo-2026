import { CarFront, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VehicleDeleteDialog } from '../components/vehicles/VehicleDeleteDialog';
import { VehicleFormDialog } from '../components/vehicles/VehicleFormDialog';
import { VehicleStatusBadge } from '../components/vehicles/VehicleStatusBadge';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api-client';
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from '../services/vehicle-service';
import { vehicleStatuses, vehicleTypes, type Vehicle, type VehicleInput, type VehicleListFilters } from '../types/vehicle';

const initialFilters: VehicleListFilters = {
  search: '',
  status: '',
  type: '',
  region: '',
  sort: 'newest',
};

export function VehiclesPage() {
  const { token, user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<VehicleListFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formVehicle, setFormVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFleetManager = user?.role === 'fleet_manager';

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getVehicles(token, filters);
      setVehicles(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(getMessage(requestError, 'Unable to load vehicles. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadVehicles(), filters.search ? 250 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [filters, loadVehicles]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const regions = useMemo(() => Array.from(new Set(vehicles.map((vehicle) => vehicle.region))).sort(), [vehicles]);

  function updateFilter<K extends keyof VehicleListFilters>(field: K, value: VehicleListFilters[K]) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function handleFormSubmit(input: VehicleInput) {
    if (!token) return;
    setDialogError(null);
    setIsSubmitting(true);

    try {
      if (formVehicle) {
        await updateVehicle(token, formVehicle.id, input);
        setSuccessMessage(`${input.registrationNumber.toUpperCase()} was updated.`);
      } else {
        await createVehicle(token, input);
        setSuccessMessage(`${input.registrationNumber.toUpperCase()} was added to the registry.`);
      }
      setFormVehicle(undefined);
      await loadVehicles();
    } catch (requestError) {
      setDialogError(getMessage(requestError, 'Unable to save this vehicle.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRetire() {
    if (!token || !formVehicle) return;
    setDialogError(null);
    setIsSubmitting(true);

    try {
      await updateVehicle(token, formVehicle.id, { status: 'Retired' });
      setFormVehicle(undefined);
      setSuccessMessage(`${formVehicle.registrationNumber} was retired.`);
      await loadVehicles();
    } catch (requestError) {
      setDialogError(getMessage(requestError, 'Unable to retire this vehicle.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!token || !deleteTarget) return;
    setDialogError(null);
    setIsSubmitting(true);

    try {
      const deletedVehicle = deleteTarget;
      await deleteVehicle(token, deletedVehicle.id);
      setDeleteTarget(null);
      setSuccessMessage(`${deletedVehicle.registrationNumber} was deleted.`);
      await loadVehicles();
    } catch (requestError) {
      setDialogError(getMessage(requestError, 'Unable to delete this vehicle.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateDialog() {
    setDialogError(null);
    setFormVehicle(null);
  }

  function openEditDialog(vehicle: Vehicle) {
    setDialogError(null);
    setFormVehicle(vehicle);
  }

  function closeFormDialog() {
    if (!isSubmitting) setFormVehicle(undefined);
  }

  function closeDeleteDialog() {
    if (!isSubmitting) setDeleteTarget(null);
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">TransitOps</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Vehicle Registry</h1>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{total} total</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Manage fleet vehicles, capacity, status and availability.</p>
        </div>
        {isFleetManager ? <button type="button" onClick={openCreateDialog} className="flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"><Plus size={17} aria-hidden="true" />Add Vehicle</button> : null}
      </header>

      {successMessage ? <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{successMessage}</p> : null}

      <section className="border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(0,1fr))_auto]">
            <label className="relative block">
              <span className="sr-only">Search vehicles</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
              <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Search registration, name or model" />
            </label>
            <select aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className={filterClassName}>
              <option value="">All statuses</option>{vehicleStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select aria-label="Filter by type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className={filterClassName}>
              <option value="">All types</option>{vehicleTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <label className="relative block">
              <span className="sr-only">Filter by region</span>
              <input list="vehicle-regions" value={filters.region} onChange={(event) => updateFilter('region', event.target.value)} className={filterClassName} placeholder="Filter region" />
              <datalist id="vehicle-regions">{regions.map((region) => <option key={region} value={region} />)}</datalist>
            </label>
            <select aria-label="Sort vehicles" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value as VehicleListFilters['sort'])} className={filterClassName}>
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="registration">Registration number</option><option value="odometer">Highest odometer</option><option value="acquisitionCost">Highest cost</option>
            </select>
            <button type="button" onClick={() => setFilters(initialFilters)} className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} aria-hidden="true" />Clear</button>
          </div>
        </div>

        {error ? <div className="m-4 flex items-center justify-between gap-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => void loadVehicles()} className="font-semibold underline">Retry</button></div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Registration Number</th><th className="px-5 py-3">Vehicle Name and Model</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Maximum Capacity</th><th className="px-5 py-3">Odometer</th><th className="px-5 py-3">Region</th><th className="px-5 py-3">Acquisition Cost</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? <LoadingRows /> : null}
              {!isLoading && !error && vehicles.length === 0 ? <EmptyRows isFleetManager={isFleetManager} onAdd={openCreateDialog} /> : null}
              {!isLoading && vehicles.map((vehicle) => <VehicleRow key={vehicle.id} vehicle={vehicle} canManage={isFleetManager} onEdit={() => openEditDialog(vehicle)} onDelete={() => { setDialogError(null); setDeleteTarget(vehicle); }} />)}
            </tbody>
          </table>
        </div>
      </section>

      {formVehicle !== undefined ? <VehicleFormDialog vehicle={formVehicle ?? undefined} isSubmitting={isSubmitting} error={dialogError} onClose={closeFormDialog} onSubmit={handleFormSubmit} onRetire={formVehicle ? handleRetire : undefined} /> : null}
      {deleteTarget ? <VehicleDeleteDialog vehicle={deleteTarget} isDeleting={isSubmitting} error={dialogError} onCancel={closeDeleteDialog} onConfirm={handleDelete} /> : null}
    </>
  );
}

function VehicleRow({ vehicle, canManage, onEdit, onDelete }: { vehicle: Vehicle; canManage: boolean; onEdit: () => void; onDelete: () => void }) {
  return <tr className="bg-white text-sm text-slate-700 hover:bg-slate-50/70">
    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-950">{vehicle.registrationNumber}</td>
    <td className="px-5 py-4"><p className="font-medium text-slate-900">{vehicle.name}</p>{vehicle.model ? <p className="mt-0.5 text-xs text-slate-500">{vehicle.model}</p> : null}</td>
    <td className="whitespace-nowrap px-5 py-4">{vehicle.type}</td>
    <td className="whitespace-nowrap px-5 py-4">{formatNumber(vehicle.maximumLoadCapacity)} kg</td>
    <td className="whitespace-nowrap px-5 py-4">{formatNumber(vehicle.odometer)} km</td>
    <td className="whitespace-nowrap px-5 py-4">{vehicle.region}</td>
    <td className="whitespace-nowrap px-5 py-4">{formatCurrency(vehicle.acquisitionCost)}</td>
    <td className="whitespace-nowrap px-5 py-4"><VehicleStatusBadge status={vehicle.status} /></td>
    <td className="whitespace-nowrap px-5 py-4 text-right">{canManage ? <span className="inline-flex items-center gap-1"><button type="button" onClick={onEdit} title="Edit vehicle" aria-label={`Edit ${vehicle.registrationNumber}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-brand-50 hover:text-brand-700"><Pencil size={16} aria-hidden="true" /></button><button type="button" onClick={onDelete} title="Delete vehicle" aria-label={`Delete ${vehicle.registrationNumber}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16} aria-hidden="true" /></button></span> : <span className="text-xs text-slate-400">View only</span>}</td>
  </tr>;
}

function LoadingRows() {
  return <tr><td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><RefreshCw className="animate-spin" size={17} aria-hidden="true" />Loading vehicles...</span></td></tr>;
}

function EmptyRows({ isFleetManager, onAdd }: { isFleetManager: boolean; onAdd: () => void }) {
  return <tr><td colSpan={9} className="px-5 py-16 text-center"><CarFront className="mx-auto text-slate-300" size={32} aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-slate-700">No vehicles found</p><p className="mt-1 text-sm text-slate-500">Try changing your filters or add a vehicle to begin the registry.</p>{isFleetManager ? <button type="button" onClick={onAdd} className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800">Add the first vehicle</button> : null}</td></tr>;
}

function getMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatNumber(value: number) { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value); }
function formatCurrency(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }

const filterClassName = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
