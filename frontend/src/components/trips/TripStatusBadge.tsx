import type { TripStatus } from '../../types/trip';
const classes: Record<TripStatus, string> = { Draft: 'border-slate-200 bg-slate-100 text-slate-600', Dispatched: 'border-blue-200 bg-blue-50 text-blue-700', Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700', Cancelled: 'border-rose-200 bg-rose-50 text-rose-700' };
export function TripStatusBadge({ status }: { status: TripStatus }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{status}</span>; }
