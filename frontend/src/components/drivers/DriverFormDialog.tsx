import { LoaderCircle, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { driverToInput } from '../../services/driver-service';
import { driverStatuses, licenseCategories, type Driver, type DriverInput } from '../../types/driver';

type DriverFormDialogProps = {
  driver?: Driver;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: DriverInput) => Promise<void>;
  onSuspend?: () => Promise<void>;
  onReactivate?: () => Promise<void>;
};

const emptyDriver: DriverInput = {
  employeeId: '', name: '', licenseNumber: '', licenseCategory: 'Light', licenseExpiryDate: '', contactNumber: '', email: '', address: '', safetyScore: 100, status: 'Available',
};

export function DriverFormDialog({ driver, isSubmitting, error, onClose, onSubmit, onSuspend, onReactivate }: DriverFormDialogProps) {
  const [form, setForm] = useState<DriverInput>(driver ? driverToInput(driver) : emptyDriver);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => { setForm(driver ? driverToInput(driver) : emptyDriver); setValidationError(null); }, [driver]);

  function updateField<K extends keyof DriverInput>(field: K, value: DriverInput[K]) { setForm((current) => ({ ...current, [field]: value })); }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateForm(form);
    setValidationError(message);
    if (message) return;
    await onSubmit({ ...form, employeeId: form.employeeId.toUpperCase(), licenseNumber: form.licenseNumber.toUpperCase() });
  }

  const displayedError = validationError ?? error;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="driver-form-title">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-md bg-white shadow-2xl sm:max-w-3xl sm:rounded-md">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div><h2 id="driver-form-title" className="text-lg font-semibold text-slate-950">{driver ? 'Edit Driver' : 'Add Driver'}</h2><p className="mt-1 text-sm text-slate-500">License and availability details are validated again during future trip dispatch.</p></div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"><X size={19} aria-hidden="true" /><span className="sr-only">Close driver form</span></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employee ID" required><input value={form.employeeId} onChange={(event) => updateField('employeeId', event.target.value)} className={inputClassName} placeholder="EMP001" disabled={isSubmitting} required /></Field>
            <Field label="Driver Name" required><input value={form.name} onChange={(event) => updateField('name', event.target.value)} className={inputClassName} placeholder="Alex Johnson" disabled={isSubmitting} required /></Field>
            <Field label="License Number" required><input value={form.licenseNumber} onChange={(event) => updateField('licenseNumber', event.target.value)} className={inputClassName} placeholder="TNDL123456789" disabled={isSubmitting} required /></Field>
            <Field label="License Category" required><select value={form.licenseCategory} onChange={(event) => updateField('licenseCategory', event.target.value as DriverInput['licenseCategory'])} className={inputClassName} disabled={isSubmitting}>{licenseCategories.map((category) => <option key={category}>{category}</option>)}</select></Field>
            <Field label="License Expiry Date" required><input type="date" value={form.licenseExpiryDate} onChange={(event) => updateField('licenseExpiryDate', event.target.value)} className={inputClassName} disabled={isSubmitting} required /></Field>
            <Field label="Contact Number" required><input type="tel" value={form.contactNumber} onChange={(event) => updateField('contactNumber', event.target.value)} className={inputClassName} placeholder="9876543210" disabled={isSubmitting} required /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className={inputClassName} placeholder="driver@transitops.com" disabled={isSubmitting} /></Field>
            <Field label="Safety Score"><input type="number" min="0" max="100" step="1" value={form.safetyScore} onChange={(event) => updateField('safetyScore', Number(event.target.value))} className={inputClassName} disabled={isSubmitting} /></Field>
            <Field label="Status"><select value={form.status} onChange={(event) => updateField('status', event.target.value as DriverInput['status'])} className={inputClassName} disabled={isSubmitting}>{driverStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
            <Field label="Address"><textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} className={`${inputClassName} h-20 py-2`} placeholder="Coimbatore" disabled={isSubmitting} /></Field>
          </div>
          {displayedError ? <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{displayedError}</p> : null}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>{driver?.status === 'Suspended' && onReactivate ? <button type="button" onClick={() => void onReactivate()} disabled={isSubmitting} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60">Reactivate driver</button> : driver && onSuspend ? <button type="button" onClick={() => void onSuspend()} disabled={isSubmitting} className="text-sm font-semibold text-rose-700 hover:text-rose-800 disabled:opacity-60">Suspend driver</button> : null}</div>
            <div className="flex gap-3"><button type="button" onClick={onClose} disabled={isSubmitting} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button><button type="submit" disabled={isSubmitting} className="flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : null}{isSubmitting ? 'Saving...' : driver ? 'Save Changes' : 'Add Driver'}</button></div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700">{label}{required ? <span className="ml-1 text-rose-600">*</span> : null}<span className="mt-1.5 block">{children}</span></label>; }

function validateForm(form: DriverInput) {
  if (!form.employeeId.trim() || !form.name.trim() || !form.licenseNumber.trim() || !form.licenseExpiryDate || !form.contactNumber.trim()) return 'Employee ID, name, license details, expiry date, and contact number are required.';
  if (!/^\+?[0-9][0-9 -]{7,18}$/.test(form.contactNumber.trim())) return 'Enter a valid contact number.';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
  if (!Number.isFinite(form.safetyScore) || form.safetyScore < 0 || form.safetyScore > 100) return 'Safety score must be between 0 and 100.';
  return null;
}

const inputClassName = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100';
