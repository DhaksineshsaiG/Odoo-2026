import type { DriverStatus } from '../../types/driver';

const statusClasses: Record<DriverStatus, string> = {
  Available: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'On Trip': 'border-blue-200 bg-blue-50 text-blue-700',
  'Off Duty': 'border-slate-200 bg-slate-100 text-slate-600',
  Suspended: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>{status}</span>;
}
