import { BusFront } from 'lucide-react';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-md bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white">
            <BusFront size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">TransitOps</h1>
            <p className="text-sm text-slate-500">Operations Control Login</p>
          </div>
        </div>

        <form className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="ops@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="Enter password"
            />
          </div>
          <button
            type="button"
            className="h-11 w-full rounded-md bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
