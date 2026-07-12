import type { LicenseState } from '../../types/driver';

const stateClasses: Record<LicenseState, string> = {
  valid: 'text-emerald-700',
  expiringSoon: 'text-amber-700',
  expired: 'text-rose-700',
};

export function LicenseExpiryIndicator({ expiryDate, state }: { expiryDate: string; state: LicenseState }) {
  const expiry = new Date(expiryDate);
  const days = Math.round((startOfDay(expiry).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
  const label = state === 'expired' ? `Expired ${Math.abs(days)} days ago` : state === 'expiringSoon' ? `Expires in ${Math.max(days, 0)} days` : 'Valid';

  return <div><p className="whitespace-nowrap text-sm text-slate-700">{formatDate(expiry)}</p><p className={`mt-0.5 text-xs font-semibold ${stateClasses[state]}`}>{label}</p></div>;
}

function startOfDay(value: Date) { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; }
function formatDate(value: Date) { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(value); }
