import {
  BarChart3,
  CarFront,
  Fuel,
  LayoutDashboard,
  LucideIcon,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Wrench,
} from 'lucide-react';

export type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Vehicle Registry', path: '/vehicles', icon: CarFront },
  { label: 'Driver Management', path: '/drivers', icon: UserRoundCog },
  { label: 'Trip Management', path: '/trips', icon: ShieldCheck },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench },
  { label: 'Fuel & Expense', path: '/fuel-expense', icon: Fuel },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];
