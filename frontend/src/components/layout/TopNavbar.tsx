import { Bell, Menu, Search } from 'lucide-react';

type TopNavbarProps = {
  onOpenMenu: () => void;
};

export function TopNavbar({ onOpenMenu }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 lg:hidden"
          aria-label="Open navigation"
          onClick={onOpenMenu}
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="hidden min-w-0 flex-1 items-center sm:flex">
          <div className="relative w-full max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              placeholder="Search operations"
              type="search"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="View notifications"
          >
            <Bell size={18} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-sm font-semibold text-brand-700">
              TO
            </span>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-4 text-slate-900">Ops Admin</p>
              <p className="text-xs text-slate-500">Control Center</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
