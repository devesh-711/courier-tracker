import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your courier operations' },
  '/shipments': { title: 'Shipments', subtitle: 'Manage and track all shipments' },
  '/tracking': { title: 'Live Tracking', subtitle: 'Real-time shipment location on map' },
  '/fleet': { title: 'Fleet', subtitle: 'Manage drivers and vehicles' },
  '/settings': { title: 'Settings', subtitle: 'Configure your account and preferences' },
};

export function AppLayout() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? { title: 'CourierOS', subtitle: '' };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-6 bento-grid-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
