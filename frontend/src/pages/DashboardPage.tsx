import { Activity, Bus, Route, Users } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

const stats = [
  { label: 'Active Vehicles', value: '--', icon: Bus },
  { label: 'Drivers On Duty', value: '--', icon: Users },
  { label: 'Trips Today', value: '--', icon: Route },
  { label: 'Alerts', value: '--', icon: Activity },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        description="A command-center view for fleet activity, service health, and operational KPIs."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <stat.icon className="text-brand-600" size={20} aria-hidden="true" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-base font-semibold text-slate-950">Fleet Activity</h2>
          <div className="mt-5 h-72 rounded-md border border-dashed border-slate-300 bg-slate-50" />
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-base font-semibold text-slate-950">Operational Alerts</h2>
          <div className="mt-5 space-y-3">
            {['Route adherence', 'Maintenance queue', 'Fuel variance'].map((item) => (
              <div key={item} className="rounded-md border border-slate-200 px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{item}</p>
                <p className="mt-1 text-xs text-slate-500">Placeholder module</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
