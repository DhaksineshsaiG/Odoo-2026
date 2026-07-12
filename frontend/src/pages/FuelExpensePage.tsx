import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ExpenseDeleteDialog } from '../components/fuel-expense/ExpenseDeleteDialog';
import { ExpenseFormDialog } from '../components/fuel-expense/ExpenseFormDialog';
import { FuelDeleteDialog } from '../components/fuel-expense/FuelDeleteDialog';
import { FuelFormDialog } from '../components/fuel-expense/FuelFormDialog';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api-client';
import {
  createExpense,
  createFuelLog,
  deleteExpense,
  deleteFuelLog,
  getExpenses,
  getFuelExpenseVehicles,
  getFuelLogs,
  updateExpense,
  updateFuelLog,
} from '../services/fuel-expense-service';
import {
  commonFuelTypes,
  expenseCategories,
  type Expense,
  type ExpenseFilters,
  type ExpenseInput,
  type FuelFilters,
  type FuelInput,
  type FuelLog,
} from '../types/fuel-expense';
import type { Vehicle } from '../types/vehicle';

const initialFuelFilters: FuelFilters = { search: '', vehicle: '', fuelType: '', from: '', to: '', sort: 'newest' };
const initialExpenseFilters: ExpenseFilters = { search: '', vehicle: '', category: '', from: '', to: '', sort: 'newest' };

export function FuelExpensePage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<'fuel' | 'expenses'>('fuel');
  const [fuel, setFuel] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuelTotal, setFuelTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [fuelFilters, setFuelFilters] = useState<FuelFilters>(initialFuelFilters);
  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>(initialExpenseFilters);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fuelForm, setFuelForm] = useState<FuelLog | null | undefined>(undefined);
  const [expenseForm, setExpenseForm] = useState<Expense | null | undefined>(undefined);
  const [fuelDelete, setFuelDelete] = useState<FuelLog | null>(null);
  const [expenseDelete, setExpenseDelete] = useState<Expense | null>(null);

  const canEdit = user?.role === 'fleet_manager' || user?.role === 'financial_analyst';
  const canDelete = user?.role === 'fleet_manager';

  const loadVehicles = useCallback(async () => {
    if (!token) return;
    setLoadingVehicles(true);
    setVehicleError(null);
    try {
      setVehicles(await getFuelExpenseVehicles(token));
    } catch (requestError) {
      setVehicleError(message(requestError, 'Unable to load vehicle options.'));
    } finally {
      setLoadingVehicles(false);
    }
  }, [token]);

  const loadRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (tab === 'fuel') {
        const response = await getFuelLogs(token, fuelFilters);
        setFuel(response.data);
        setFuelTotal(response.meta.total);
      } else {
        const response = await getExpenses(token, expenseFilters);
        setExpenses(response.data);
        setExpenseTotal(response.meta.total);
      }
    } catch (requestError) {
      setError(message(requestError, `Unable to load ${tab === 'fuel' ? 'fuel logs' : 'expenses'}.`));
    } finally {
      setLoading(false);
    }
  }, [expenseFilters, fuelFilters, tab, token]);

  useEffect(() => { void loadVehicles(); }, [loadVehicles]);
  useEffect(() => {
    const search = tab === 'fuel' ? fuelFilters.search : expenseFilters.search;
    const timer = window.setTimeout(() => void loadRecords(), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [expenseFilters.search, fuelFilters.search, loadRecords, tab]);
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  function openFuelForm(item: FuelLog | null) {
    setDialogError(vehicleError);
    setFuelForm(item);
    if (vehicleError) void loadVehicles();
  }

  function openExpenseForm(item: Expense | null) {
    setDialogError(vehicleError);
    setExpenseForm(item);
    if (vehicleError) void loadVehicles();
  }

  async function saveFuel(input: FuelInput) {
    if (!token) return;
    setSubmitting(true);
    setDialogError(null);
    try {
      if (fuelForm) {
        await updateFuelLog(token, fuelForm.id, input);
        setSuccess(`${fuelForm.fuelNumber} was updated.`);
      } else {
        const created = await createFuelLog(token, input);
        setSuccess(`${created.fuelNumber} was added.`);
      }
      setFuelForm(undefined);
      await loadRecords();
    } catch (requestError) {
      setDialogError(message(requestError, 'Unable to save this fuel log.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveExpense(input: ExpenseInput) {
    if (!token) return;
    setSubmitting(true);
    setDialogError(null);
    try {
      if (expenseForm) {
        await updateExpense(token, expenseForm.id, input);
        setSuccess(`${expenseForm.expenseNumber} was updated.`);
      } else {
        const created = await createExpense(token, input);
        setSuccess(`${created.expenseNumber} was added.`);
      }
      setExpenseForm(undefined);
      await loadRecords();
    } catch (requestError) {
      setDialogError(message(requestError, 'Unable to save this expense.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeFuel() {
    if (!token || !fuelDelete) return;
    setSubmitting(true);
    setDialogError(null);
    try {
      await deleteFuelLog(token, fuelDelete.id);
      setSuccess(`${fuelDelete.fuelNumber} was deleted.`);
      setFuelDelete(null);
      await loadRecords();
    } catch (requestError) {
      setDialogError(message(requestError, 'Unable to delete this fuel log.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeExpense() {
    if (!token || !expenseDelete) return;
    setSubmitting(true);
    setDialogError(null);
    try {
      await deleteExpense(token, expenseDelete.id);
      setSuccess(`${expenseDelete.expenseNumber} was deleted.`);
      setExpenseDelete(null);
      await loadRecords();
    } catch (requestError) {
      setDialogError(message(requestError, 'Unable to delete this expense.'));
    } finally {
      setSubmitting(false);
    }
  }

  const total = tab === 'fuel' ? fuelTotal : expenseTotal;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">TransitOps</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Fuel &amp; Expense</h1>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{total} total</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Track vehicle fuel purchases and operating expenses.</p>
        </div>
        {canEdit ? <button type="button" onClick={() => tab === 'fuel' ? openFuelForm(null) : openExpenseForm(null)} className="flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Plus size={17} aria-hidden="true" />{tab === 'fuel' ? 'Add Fuel Log' : 'Add Expense'}</button> : null}
      </header>

      {success ? <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{success}</p> : null}

      <div className="mb-5 flex border-b border-slate-200" role="tablist" aria-label="Fuel and expense records">
        <TabButton selected={tab === 'fuel'} onClick={() => setTab('fuel')}>Fuel Logs</TabButton>
        <TabButton selected={tab === 'expenses'} onClick={() => setTab('expenses')}>Expenses</TabButton>
      </div>

      <section className="border border-slate-200 bg-white shadow-soft">
        {tab === 'fuel'
          ? <FuelControls filters={fuelFilters} vehicles={vehicles} onChange={setFuelFilters} />
          : <ExpenseControls filters={expenseFilters} vehicles={vehicles} onChange={setExpenseFilters} />}

        {error ? <div className="m-4 flex items-center justify-between gap-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => void loadRecords()} className="shrink-0 font-semibold underline">Retry</button></div> : null}

        {tab === 'fuel'
          ? <FuelTable items={fuel} loading={loading} error={error} canEdit={canEdit} canDelete={canDelete} onAdd={() => openFuelForm(null)} onEdit={openFuelForm} onDelete={(item) => { setDialogError(null); setFuelDelete(item); }} />
          : <ExpenseTable items={expenses} loading={loading} error={error} canEdit={canEdit} canDelete={canDelete} onAdd={() => openExpenseForm(null)} onEdit={openExpenseForm} onDelete={(item) => { setDialogError(null); setExpenseDelete(item); }} />}
      </section>

      {fuelForm !== undefined ? <FuelFormDialog fuel={fuelForm ?? undefined} vehicles={vehicles} loadingVehicles={loadingVehicles} isSubmitting={submitting} error={dialogError ?? vehicleError} onClose={() => !submitting && setFuelForm(undefined)} onSubmit={saveFuel} /> : null}
      {expenseForm !== undefined ? <ExpenseFormDialog expense={expenseForm ?? undefined} vehicles={vehicles} loadingVehicles={loadingVehicles} isSubmitting={submitting} error={dialogError ?? vehicleError} onClose={() => !submitting && setExpenseForm(undefined)} onSubmit={saveExpense} /> : null}
      {fuelDelete ? <FuelDeleteDialog fuel={fuelDelete} isDeleting={submitting} error={dialogError} onCancel={() => !submitting && setFuelDelete(null)} onConfirm={removeFuel} /> : null}
      {expenseDelete ? <ExpenseDeleteDialog expense={expenseDelete} isDeleting={submitting} error={dialogError} onCancel={() => !submitting && setExpenseDelete(null)} onConfirm={removeExpense} /> : null}
    </>
  );
}

function FuelControls({ filters, vehicles, onChange }: { filters: FuelFilters; vehicles: Vehicle[]; onChange: (filters: FuelFilters) => void }) {
  return <div className="border-b border-slate-200 p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(0,1fr))_auto]">
    <SearchInput value={filters.search} onChange={(search) => onChange({ ...filters, search })} placeholder="Search number, vehicle or station" />
    <VehicleFilter value={filters.vehicle} vehicles={vehicles} onChange={(vehicle) => onChange({ ...filters, vehicle })} />
    <select aria-label="Filter by fuel type" value={filters.fuelType} onChange={(event) => onChange({ ...filters, fuelType: event.target.value })} className={filterClass}><option value="">All fuel types</option>{commonFuelTypes.map((type) => <option key={type}>{type}</option>)}</select>
    <DateFilter label="Fuel from date" value={filters.from} onChange={(from) => onChange({ ...filters, from })} />
    <DateFilter label="Fuel to date" value={filters.to} onChange={(to) => onChange({ ...filters, to })} />
    <select aria-label="Sort fuel logs" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as FuelFilters['sort'] })} className={filterClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="odometer">Highest odometer</option><option value="quantity">Highest quantity</option><option value="cost">Highest cost</option></select>
    <ClearButton onClick={() => onChange(initialFuelFilters)} />
  </div></div>;
}

function ExpenseControls({ filters, vehicles, onChange }: { filters: ExpenseFilters; vehicles: Vehicle[]; onChange: (filters: ExpenseFilters) => void }) {
  return <div className="border-b border-slate-200 p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(0,1fr))_auto]">
    <SearchInput value={filters.search} onChange={(search) => onChange({ ...filters, search })} placeholder="Search number, vehicle or description" />
    <VehicleFilter value={filters.vehicle} vehicles={vehicles} onChange={(vehicle) => onChange({ ...filters, vehicle })} />
    <select aria-label="Filter by expense category" value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })} className={filterClass}><option value="">All categories</option>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select>
    <DateFilter label="Expense from date" value={filters.from} onChange={(from) => onChange({ ...filters, from })} />
    <DateFilter label="Expense to date" value={filters.to} onChange={(to) => onChange({ ...filters, to })} />
    <select aria-label="Sort expenses" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as ExpenseFilters['sort'] })} className={filterClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount">Highest amount</option><option value="category">Category A-Z</option></select>
    <ClearButton onClick={() => onChange(initialExpenseFilters)} />
  </div></div>;
}

function FuelTable({ items, loading, error, canEdit, canDelete, onAdd, onEdit, onDelete }: { items: FuelLog[]; loading: boolean; error: string | null; canEdit: boolean; canDelete: boolean; onAdd: () => void; onEdit: (item: FuelLog) => void; onDelete: (item: FuelLog) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[1100px] border-collapse text-left"><thead className={tableHead}><tr><th className={th}>Fuel Number</th><th className={th}>Vehicle</th><th className={th}>Date</th><th className={th}>Litres</th><th className={th}>Cost</th><th className={th}>Odometer</th><th className={th}>Fuel Station</th><th className={th}>Fuel Type</th><th className={`${th} text-right`}>Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <LoadingRow columns={9} /> : null}{!loading && !error && items.length === 0 ? <EmptyRow columns={9} canAdd={canEdit} noun="fuel logs" onAdd={onAdd} /> : null}{!loading && items.map((item) => <tr key={item.id} className={rowClass}><td className={`${td} font-semibold text-slate-950`}>{item.fuelNumber}</td><VehicleCell vehicle={item.vehicle} /><td className={td}>{date(item.date)}</td><td className={td}>{number(item.fuelQuantity)} L</td><td className={td}>{currency(item.fuelCost)}</td><td className={td}>{number(item.odometer)} km</td><td className={td}>{item.fuelStation || '-'}</td><td className={td}>{item.fuelType || '-'}</td><ActionCell canEdit={canEdit} canDelete={canDelete} label={item.fuelNumber} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></tr>)}</tbody></table></div>;
}

function ExpenseTable({ items, loading, error, canEdit, canDelete, onAdd, onEdit, onDelete }: { items: Expense[]; loading: boolean; error: string | null; canEdit: boolean; canDelete: boolean; onAdd: () => void; onEdit: (item: Expense) => void; onDelete: (item: Expense) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead className={tableHead}><tr><th className={th}>Expense Number</th><th className={th}>Vehicle</th><th className={th}>Category</th><th className={th}>Amount</th><th className={th}>Date</th><th className={th}>Description</th><th className={`${th} text-right`}>Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <LoadingRow columns={7} /> : null}{!loading && !error && items.length === 0 ? <EmptyRow columns={7} canAdd={canEdit} noun="expenses" onAdd={onAdd} /> : null}{!loading && items.map((item) => <tr key={item.id} className={rowClass}><td className={`${td} font-semibold text-slate-950`}>{item.expenseNumber}</td><VehicleCell vehicle={item.vehicle} /><td className={td}>{item.category}</td><td className={td}>{currency(item.amount)}</td><td className={td}>{date(item.date)}</td><td className={`${td} max-w-xs`}><p className="truncate" title={item.description}>{item.description}</p></td><ActionCell canEdit={canEdit} canDelete={canDelete} label={item.expenseNumber} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} /></tr>)}</tbody></table></div>;
}

function TabButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return <button type="button" role="tab" aria-selected={selected} onClick={onClick} className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${selected ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{children}</button>;
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block"><span className="sr-only">Search records</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" /><input value={value} onChange={(event) => onChange(event.target.value)} className={`${filterClass} pl-10`} placeholder={placeholder} /></label>;
}

function VehicleFilter({ value, vehicles, onChange }: { value: string; vehicles: Vehicle[]; onChange: (value: string) => void }) {
  return <select aria-label="Filter by vehicle" value={value} onChange={(event) => onChange(event.target.value)} className={filterClass}><option value="">All vehicles</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} - {vehicle.name}</option>)}</select>;
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="sr-only">{label}</span><input type="date" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={filterClass} /></label>;
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} aria-hidden="true" />Clear</button>;
}

function VehicleCell({ vehicle }: { vehicle: FuelLog['vehicle'] }) {
  return <td className={td}><span className="font-medium text-slate-900">{vehicle.registrationNumber}</span><p className="mt-0.5 text-xs text-slate-500">{vehicle.name}</p></td>;
}

function ActionCell({ canEdit, canDelete, label, onEdit, onDelete }: { canEdit: boolean; canDelete: boolean; label: string; onEdit: () => void; onDelete: () => void }) {
  return <td className={`${td} text-right`}>{canEdit || canDelete ? <span className="inline-flex gap-1">{canEdit ? <button type="button" onClick={onEdit} className={iconButton} aria-label={`Edit ${label}`} title="Edit"><Pencil size={16} aria-hidden="true" /></button> : null}{canDelete ? <button type="button" onClick={onDelete} className={`${iconButton} hover:text-rose-700`} aria-label={`Delete ${label}`} title="Delete"><Trash2 size={16} aria-hidden="true" /></button> : null}</span> : <span className="text-slate-400">-</span>}</td>;
}

function LoadingRow({ columns }: { columns: number }) {
  return <tr><td colSpan={columns} className="px-5 py-16 text-center text-sm text-slate-500">Loading records...</td></tr>;
}

function EmptyRow({ columns, canAdd, noun, onAdd }: { columns: number; canAdd: boolean; noun: string; onAdd: () => void }) {
  return <tr><td colSpan={columns} className="px-5 py-16 text-center"><p className="font-medium text-slate-800">No {noun} found</p><p className="mt-1 text-sm text-slate-500">Adjust the filters or add the first record.</p>{canAdd ? <button type="button" onClick={onAdd} className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800">Add record</button> : null}</td></tr>;
}

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function date(value: string) {
  return new Date(value).toLocaleDateString('en-IN');
}

function number(value: number) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
}

const filterClass = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const tableHead = 'border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500';
const th = 'whitespace-nowrap px-5 py-3';
const td = 'whitespace-nowrap px-5 py-4';
const rowClass = 'bg-white text-sm text-slate-700 hover:bg-slate-50/70';
const iconButton = 'flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950';
