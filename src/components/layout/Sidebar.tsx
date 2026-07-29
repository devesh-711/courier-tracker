import { Package, Truck, MapPin, BarChart3, Settings, LogOut } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { STORAGE_KEYS } from '@/lib/config';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/shipments', label: 'Shipments', icon: Package },
  { to: '/tracking', label: 'Live Tracking', icon: MapPin },
  { to: '/fleet', label: 'Fleet', icon: Truck },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    navigate('/login');
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-surface-200 bg-white/90 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-950/80">
      <Link to="/dashboard" className="flex items-center gap-3 px-6 py-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-bold text-white shadow-md shadow-primary-500/20"
        >
          S
        </motion.div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-surface-900 dark:text-surface-100">CourierOS</h1>
          <p className="text-2xs font-mono text-surface-400 dark:text-surface-500">SwiftShip Logistics</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-50/80 text-primary-700 font-semibold dark:bg-surface-800/80 dark:text-white dark:border dark:border-surface-700/60 shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/40 dark:hover:text-surface-100',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-200 p-3 dark:border-surface-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-error-50 hover:text-error-600 dark:text-surface-300 dark:hover:bg-error-950/40 dark:hover:text-error-400"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
