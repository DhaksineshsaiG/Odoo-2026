import { NavLink } from 'react-router-dom';
import { BusFront, LogOut, RadioTower, X } from 'lucide-react';
import { navigationItems } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { roleLabels } from '../../types/auth';
import { useNavigate } from 'react-router-dom';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition',
    isActive
      ? 'bg-brand-600 text-white shadow-soft'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ');

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    onClose?.();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <NavLink to="/dashboard" className="flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white">
          <BusFront size={22} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-lg font-semibold leading-5 text-slate-950">TransitOps</span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Operations Platform
          </span>
        </span>
      </NavLink>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={navLinkClass} onClick={onClose}>
            <item.icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <RadioTower size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">System Online</p>
            <p className="text-xs text-slate-500">Secure session active</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-100 text-xs font-semibold text-brand-700">
          {user?.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user ? roleLabels[user.role] : ''}</p>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          aria-label="Log out"
          title="Log out"
          onClick={handleLogout}
        >
          <LogOut size={17} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      <div
        className={isOpen ? 'fixed inset-0 z-40 lg:hidden' : 'hidden'}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute inset-0 h-full w-full bg-slate-950/40"
          aria-label="Close navigation"
          onClick={onClose}
        />
        <aside className="relative flex h-full w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-soft">
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
          <SidebarContent onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
