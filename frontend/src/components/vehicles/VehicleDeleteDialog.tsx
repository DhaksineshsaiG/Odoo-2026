import { AlertTriangle, LoaderCircle } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';

type VehicleDeleteDialogProps = {
  vehicle: Vehicle;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function VehicleDeleteDialog({ vehicle, isDeleting, error, onCancel, onConfirm }: VehicleDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="delete-vehicle-title">
      <section className="w-full rounded-t-md bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-md sm:p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-rose-50 text-rose-700"><AlertTriangle size={20} aria-hidden="true" /></div>
        <h2 id="delete-vehicle-title" className="mt-4 text-lg font-semibold text-slate-950">Delete vehicle?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This will permanently remove <span className="font-semibold text-slate-900">{vehicle.name} ({vehicle.registrationNumber})</span>. Vehicles that are On Trip or In Shop cannot be deleted.</p>
        {error ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
          <button type="button" onClick={() => void onConfirm()} disabled={isDeleting} className="flex h-10 items-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70">
            {isDeleting ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : null}Delete Vehicle
          </button>
        </div>
      </section>
    </div>
  );
}
