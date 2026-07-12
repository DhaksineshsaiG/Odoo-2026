import { Pencil, Plus, RefreshCw, Search, Trash2, UserRoundCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DriverDeleteDialog } from '../components/drivers/DriverDeleteDialog';
import { DriverFormDialog } from '../components/drivers/DriverFormDialog';
import { DriverStatusBadge } from '../components/drivers/DriverStatusBadge';
import { LicenseExpiryIndicator } from '../components/drivers/LicenseExpiryIndicator';
import { SafetyScoreIndicator } from '../components/drivers/SafetyScoreIndicator';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api-client';
import { createDriver, deleteDriver, getDrivers, updateDriver } from '../services/driver-service';
import { driverStatuses, licenseCategories, type Driver, type DriverInput, type DriverListFilters } from '../types/driver';

const initialFilters: DriverListFilters = { search: '', status: '', licenseCategory: '', licenseState: '', sort: 'newest' };

export function DriversPage() {
  const { token, user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<DriverListFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formDriver, setFormDriver] = useState<Driver | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'fleet_manager' || user?.role === 'safety_officer';
  const canDelete = user?.role === 'fleet_manager';

  const loadDrivers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDrivers(token, filters);
      setDrivers(response.data);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(getMessage(requestError, 'Unable to load drivers. Please try again.'));
    } finally { setIsLoading(false); }
  }, [filters, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDrivers(), filters.search ? 250 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [filters, loadDrivers]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  function updateFilter<K extends keyof DriverListFilters>(field: K, value: DriverListFilters[K]) { setFilters((current) => ({ ...current, [field]: value })); }

  async function handleFormSubmit(input: DriverInput) {
    if (!token) return;
    setDialogError(null); setIsSubmitting(true);
    try {
      if (formDriver) { await updateDriver(token, formDriver.id, input); setSuccessMessage(`${input.employeeId.toUpperCase()} was updated.`); }
      else { await createDriver(token, input); setSuccessMessage(`${input.employeeId.toUpperCase()} was added to driver management.`); }
      setFormDriver(undefined); await loadDrivers();
    } catch (requestError) { setDialogError(getMessage(requestError, 'Unable to save this driver.')); }
    finally { setIsSubmitting(false); }
  }

  async function updateDriverStatus(status: DriverInput['status']) {
    if (!token || !formDriver) return;
    setDialogError(null); setIsSubmitting(true);
    try {
      await updateDriver(token, formDriver.id, { status });
      setFormDriver(undefined); setSuccessMessage(`${formDriver.employeeId} is now ${status}.`); await loadDrivers();
    } catch (requestError) { setDialogError(getMessage(requestError, `Unable to set driver status to ${status}.`)); }
    finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!token || !deleteTarget) return;
    setDialogError(null); setIsSubmitting(true);
    try {
      const deletedDriver = deleteTarget;
      await deleteDriver(token, deletedDriver.id);
      setDeleteTarget(null); setSuccessMessage(`${deletedDriver.employeeId} was deleted.`); await loadDrivers();
    } catch (requestError) { setDialogError(getMessage(requestError, 'Unable to delete this driver.')); }
    finally { setIsSubmitting(false); }
  }

  return <>
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-medium uppercase tracking-wide text-brand-600">TransitOps</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Driver Management</h1><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{total} total</span></div><p className="mt-2 text-sm leading-6 text-slate-600">Manage driver profiles, licenses, safety and availability.</p></div>{canManage ? <button type="button" onClick={() => { setDialogError(null); setFormDriver(null); }} className="flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"><Plus size={17} aria-hidden="true" />Add Driver</button> : null}</header>
    {successMessage ? <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{successMessage}</p> : null}
    <section className="border border-slate-200 bg-white shadow-soft"><div className="border-b border-slate-200 p-4 sm:p-5"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1.6fr)_repeat(3,minmax(0,1fr))_auto]"><label className="relative block"><span className="sr-only">Search drivers</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Search ID, name, license or contact" /></label><select aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className={filterClassName}><option value="">All statuses</option>{driverStatuses.map((status) => <option key={status}>{status}</option>)}</select><select aria-label="Filter by license category" value={filters.licenseCategory} onChange={(event) => updateFilter('licenseCategory', event.target.value)} className={filterClassName}><option value="">All categories</option>{licenseCategories.map((category) => <option key={category}>{category}</option>)}</select><select aria-label="Filter by license state" value={filters.licenseState} onChange={(event) => updateFilter('licenseState', event.target.value)} className={filterClassName}><option value="">All license states</option><option value="valid">Valid</option><option value="expiringSoon">Expiring Soon</option><option value="expired">Expired</option></select><select aria-label="Sort drivers" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value as DriverListFilters['sort'])} className={filterClassName}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name</option><option value="safetyScore">Highest safety score</option><option value="licenseExpiryDate">License expiry</option></select><button type="button" onClick={() => setFilters(initialFilters)} className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} aria-hidden="true" />Clear</button></div></div>
      {error ? <div className="m-4 flex items-center justify-between gap-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => void loadDrivers()} className="font-semibold underline">Retry</button></div> : null}
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] border-collapse text-left"><thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Employee ID</th><th className="px-5 py-3">Driver Name</th><th className="px-5 py-3">License Number</th><th className="px-5 py-3">License Category</th><th className="px-5 py-3">License Expiry</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Safety Score</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <LoadingRows /> : null}{!isLoading && !error && drivers.length === 0 ? <EmptyRows canManage={canManage} onAdd={() => { setDialogError(null); setFormDriver(null); }} /> : null}{!isLoading && drivers.map((driver) => <DriverRow key={driver.id} driver={driver} canManage={canManage} canDelete={canDelete} onEdit={() => { setDialogError(null); setFormDriver(driver); }} onDelete={() => { setDialogError(null); setDeleteTarget(driver); }} />)}</tbody></table></div>
    </section>
    {formDriver !== undefined ? <DriverFormDialog driver={formDriver ?? undefined} isSubmitting={isSubmitting} error={dialogError} onClose={() => { if (!isSubmitting) setFormDriver(undefined); }} onSubmit={handleFormSubmit} onSuspend={formDriver ? () => updateDriverStatus('Suspended') : undefined} onReactivate={formDriver?.status === 'Suspended' ? () => updateDriverStatus('Available') : undefined} /> : null}
    {deleteTarget ? <DriverDeleteDialog driver={deleteTarget} isDeleting={isSubmitting} error={dialogError} onCancel={() => { if (!isSubmitting) setDeleteTarget(null); }} onConfirm={handleDelete} /> : null}
  </>;
}

function DriverRow({ driver, canManage, canDelete, onEdit, onDelete }: { driver: Driver; canManage: boolean; canDelete: boolean; onEdit: () => void; onDelete: () => void }) { return <tr className="bg-white text-sm text-slate-700 hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-950">{driver.employeeId}</td><td className="px-5 py-4"><p className="font-medium text-slate-900">{driver.name}</p>{driver.email ? <p className="mt-0.5 text-xs text-slate-500">{driver.email}</p> : null}</td><td className="whitespace-nowrap px-5 py-4">{driver.licenseNumber}</td><td className="whitespace-nowrap px-5 py-4">{driver.licenseCategory}</td><td className="whitespace-nowrap px-5 py-4"><LicenseExpiryIndicator expiryDate={driver.licenseExpiryDate} state={driver.licenseState} /></td><td className="whitespace-nowrap px-5 py-4">{driver.contactNumber}</td><td className="px-5 py-4"><SafetyScoreIndicator score={driver.safetyScore} /></td><td className="whitespace-nowrap px-5 py-4"><DriverStatusBadge status={driver.status} /></td><td className="whitespace-nowrap px-5 py-4 text-right">{canManage ? <span className="inline-flex items-center gap-1"><button type="button" onClick={onEdit} title="Edit driver" aria-label={`Edit ${driver.employeeId}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-brand-50 hover:text-brand-700"><Pencil size={16} aria-hidden="true" /></button>{canDelete ? <button type="button" onClick={onDelete} title="Delete driver" aria-label={`Delete ${driver.employeeId}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16} aria-hidden="true" /></button> : null}</span> : <span className="text-xs text-slate-400">View only</span>}</td></tr>; }
function LoadingRows() { return <tr><td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><RefreshCw className="animate-spin" size={17} aria-hidden="true" />Loading drivers...</span></td></tr>; }
function EmptyRows({ canManage, onAdd }: { canManage: boolean; onAdd: () => void }) { return <tr><td colSpan={9} className="px-5 py-16 text-center"><UserRoundCog className="mx-auto text-slate-300" size={32} aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-slate-700">No drivers found</p><p className="mt-1 text-sm text-slate-500">Try changing your filters or add a driver to begin.</p>{canManage ? <button type="button" onClick={onAdd} className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800">Add the first driver</button> : null}</td></tr>; }
function getMessage(error: unknown, fallback: string) { return error instanceof ApiError ? error.message : fallback; }
const filterClassName = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
