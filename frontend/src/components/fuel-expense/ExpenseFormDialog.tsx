import { LoaderCircle, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { expenseToInput } from '../../services/fuel-expense-service';
import { expenseCategories, type Expense, type ExpenseInput } from '../../types/fuel-expense';
import type { Vehicle } from '../../types/vehicle';

type Props = {
  expense?: Expense;
  vehicles: Vehicle[];
  loadingVehicles: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => Promise<void>;
};

function emptyExpense(): ExpenseInput {
  return { vehicle: '', date: new Date().toLocaleDateString('en-CA'), category: 'Miscellaneous', amount: 0, description: '' };
}

export function ExpenseFormDialog({ expense, vehicles, loadingVehicles, isSubmitting, error, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ExpenseInput>(() => (expense ? expenseToInput(expense) : emptyExpense()));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setForm(expense ? expenseToInput(expense) : emptyExpense());
    setValidationError(null);
  }, [expense]);

  function update<K extends keyof ExpenseInput>(field: K, value: ExpenseInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validate(form);
    setValidationError(message);
    if (message) return;
    await onSubmit(form);
  }

  const displayedError = validationError ?? error;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="expense-form-title">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-md bg-white shadow-2xl sm:max-w-xl sm:rounded-md">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="expense-form-title" className="text-lg font-semibold text-slate-950">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
            <p className="mt-1 text-sm text-slate-500">Record a vehicle operating expense.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={closeButton} aria-label="Close expense form"><X size={19} aria-hidden="true" /></button>
        </header>

        <form onSubmit={submit} className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle" required>
              <select value={form.vehicle} onChange={(event) => update('vehicle', event.target.value)} className={inputClass} disabled={isSubmitting || loadingVehicles} required>
                <option value="">{loadingVehicles ? 'Loading vehicles...' : 'Select a vehicle'}</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} - {vehicle.name}{vehicle.model ? ` ${vehicle.model}` : ''}</option>)}
              </select>
            </Field>
            <Field label="Date" required><input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} className={inputClass} disabled={isSubmitting} required /></Field>
            <Field label="Category" required><select value={form.category} onChange={(event) => update('category', event.target.value as ExpenseInput['category'])} className={inputClass} disabled={isSubmitting}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></Field>
            <Field label="Amount (INR)" required><input type="number" min="0.01" step="any" value={form.amount || ''} onChange={(event) => update('amount', Number(event.target.value))} className={inputClass} disabled={isSubmitting} required /></Field>
            <div className="sm:col-span-2"><Field label="Description" required><textarea value={form.description} onChange={(event) => update('description', event.target.value)} className={`${inputClass} h-28 py-2`} placeholder="Describe this expense" disabled={isSubmitting} required /></Field></div>
          </div>

          {displayedError ? <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{displayedError}</p> : null}
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} disabled={isSubmitting} className={secondaryButton}>Cancel</button>
            <button type="submit" disabled={isSubmitting || loadingVehicles} className={primaryButton}>{isSubmitting ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : null}{isSubmitting ? 'Saving...' : expense ? 'Save Changes' : 'Add Expense'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{required ? <span className="ml-1 text-rose-600">*</span> : null}<span className="mt-1.5 block">{children}</span></label>;
}

function validate(form: ExpenseInput) {
  if (!form.vehicle || !form.date || !form.description.trim()) return 'Vehicle, date, and description are required.';
  if (!Number.isFinite(form.amount) || form.amount <= 0) return 'Expense amount must be greater than zero.';
  return null;
}

const inputClass = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100';
const closeButton = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-60';
const secondaryButton = 'h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60';
const primaryButton = 'flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70';

