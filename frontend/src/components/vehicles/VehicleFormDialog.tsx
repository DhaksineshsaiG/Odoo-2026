import { LoaderCircle, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { vehicleStatuses, vehicleTypes, type Vehicle, type VehicleInput } from '../../types/vehicle';
import { vehicleToInput } from '../../services/vehicle-service';

type VehicleFormDialogProps = {
  vehicle?: Vehicle;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
  onRetire?: () => Promise<void>;
};

const emptyVehicle: VehicleInput = {
  registrationNumber: '',
  name: '',
  model: '',
  type: 'Van',
  maximumLoadCapacity: 0,
  odometer: 0,
  acquisitionCost: 0,
  region: '',
  status: 'Available',
};

export function VehicleFormDialog({ vehicle, isSubmitting, error, onClose, onSubmit, onRetire }: VehicleFormDialogProps) {
  const [form, setForm] = useState<VehicleInput>(vehicle ? vehicleToInput(vehicle) : emptyVehicle);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setForm(vehicle ? vehicleToInput(vehicle) : emptyVehicle);
    setValidationError(null);
  }, [vehicle]);

  function updateField<K extends keyof VehicleInput>(field: K, value: VehicleInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateForm(form);
    setValidationError(message);
    if (message) return;
    await onSubmit({ ...form, registrationNumber: form.registrationNumber.toUpperCase() });
  }

  const title = vehicle ? 'Edit Vehicle' : 'Add Vehicle';
  const displayedError = validationError ?? error;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="vehicle-form-title">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-md bg-white shadow-2xl sm:max-w-3xl sm:rounded-md">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="vehicle-form-title" className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Vehicle capacity and availability are used in future dispatch workflows.</p>
          </div>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="Close vehicle form" onClick={onClose} disabled={isSubmitting}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration Number" required>
              <input value={form.registrationNumber} onChange={(event) => updateField('registrationNumber', event.target.value)} className={inputClassName} placeholder="TN39AB1001" disabled={isSubmitting} required />
            </Field>
            <Field label="Vehicle Name" required>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className={inputClassName} placeholder="Tata Ace" disabled={isSubmitting} required />
            </Field>
            <Field label="Model">
              <input value={form.model} onChange={(event) => updateField('model', event.target.value)} className={inputClassName} placeholder="Gold" disabled={isSubmitting} />
            </Field>
            <Field label="Vehicle Type" required>
              <select value={form.type} onChange={(event) => updateField('type', event.target.value as VehicleInput['type'])} className={inputClassName} disabled={isSubmitting}>
                {vehicleTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Maximum Load Capacity (kg)" required>
              <input type="number" min="0.000001" step="any" value={form.maximumLoadCapacity || ''} onChange={(event) => updateField('maximumLoadCapacity', Number(event.target.value))} className={inputClassName} disabled={isSubmitting} required />
            </Field>
            <Field label="Odometer (km)">
              <input type="number" min="0" step="1" value={form.odometer} onChange={(event) => updateField('odometer', Number(event.target.value))} className={inputClassName} disabled={isSubmitting} />
            </Field>
            <Field label="Acquisition Cost (INR)">
              <input type="number" min="0" step="1" value={form.acquisitionCost} onChange={(event) => updateField('acquisitionCost', Number(event.target.value))} className={inputClassName} disabled={isSubmitting} />
            </Field>
            <Field label="Region" required>
              <input value={form.region} onChange={(event) => updateField('region', event.target.value)} className={inputClassName} placeholder="Coimbatore" disabled={isSubmitting} required />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => updateField('status', event.target.value as VehicleInput['status'])} className={inputClassName} disabled={isSubmitting}>
                {vehicleStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </Field>
          </div>

          {displayedError ? <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{displayedError}</p> : null}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {vehicle && vehicle.status !== 'Retired' && onRetire ? <button type="button" onClick={() => void onRetire()} disabled={isSubmitting} className="text-sm font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-60">Retire vehicle</button> : null}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : null}
                {isSubmitting ? 'Saving...' : vehicle ? 'Save Changes' : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{required ? <span className="ml-1 text-rose-600">*</span> : null}<span className="mt-1.5 block">{children}</span></label>;
}

function validateForm(form: VehicleInput) {
  if (!form.registrationNumber.trim() || !form.name.trim() || !form.region.trim()) return 'Registration number, vehicle name, and region are required.';
  if (!Number.isFinite(form.maximumLoadCapacity) || form.maximumLoadCapacity <= 0) return 'Maximum load capacity must be greater than zero.';
  if (!Number.isFinite(form.odometer) || form.odometer < 0) return 'Odometer cannot be negative.';
  if (!Number.isFinite(form.acquisitionCost) || form.acquisitionCost < 0) return 'Acquisition cost cannot be negative.';
  return null;
}

const inputClassName = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100';
