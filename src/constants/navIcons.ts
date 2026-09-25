import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Baby,
  Stethoscope,
  TrendingUp,
  Package,
  Building2,
  LucideIcon
} from 'lucide-react';
import { AppView } from '../types';

export interface NavMenuConfig {
  id: AppView;
  label: string;
  subtitle: string;
  imageUrl: string;
  fallbackIcon: LucideIcon;
}

/**
 * Real visual icon pictures representing each core farm management section:
 * - Dashboard: Modern farm telemetry & analytics overview
 * - Herd & Farm Records: Healthy ear-tagged livestock goats in green pasture
 * - Feeds & Supply: Grain nutrition, feed sacks & forage reserves
 * - Breeding Estimator: Doe mother with newborn goat kid
 * - Tasks: Daily farm routine, chores & schedule clipboard
 * - Veterinary & Health: Clinical stethoscope, veterinary meds & vaccinations
 * - Reports & Forecasts: Official financial audit, ledger & growth charts
 * - Farm Profile: Homestead ranch, farm barn & brand identity
 */
export const NAV_MENU_ITEMS: NavMenuConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    subtitle: 'Executive farm telemetry & live counters',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: LayoutDashboard,
  },
  {
    id: 'tasks',
    label: 'Tasks & Schedules',
    subtitle: 'Daily chores, feed alarms & routines',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: CheckSquare,
  },
  {
    id: 'feed_supply',
    label: 'Feeds & Supply',
    subtitle: 'Nutrition stock, silage & supplements',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: Package,
  },
  {
    id: 'breeding_estimator',
    label: 'Breeding Estimator',
    subtitle: 'Gestation tracks & kidding forecasts',
    imageUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: Baby,
  },
  {
    id: 'records',
    label: 'Herd & Farm Records',
    subtitle: 'Ear tags, weights, lineage & status',
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: ClipboardList,
  },
  {
    id: 'health_vet',
    label: 'Veterinary & Health',
    subtitle: 'Clinical diagnoses, meds & vaccines',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: Stethoscope,
  },
  {
    id: 'reports',
    label: 'Reports & Forecasts',
    subtitle: 'A4 printables, sales audit & cash flow',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: TrendingUp,
  },
  {
    id: 'profile',
    label: 'Farm Profile',
    subtitle: 'Ranch branding, location & owner info',
    imageUrl: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=120&h=120&q=80',
    fallbackIcon: Building2,
  },
];

export const getNavConfig = (view: AppView): NavMenuConfig => {
  return NAV_MENU_ITEMS.find(item => item.id === view) || NAV_MENU_ITEMS[0];
};
