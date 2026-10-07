import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { CustomerDashboard } from '@/components/customer/CustomerDashboard';
import { DeliveryAgentDashboard } from '@/components/delivery/DeliveryAgentDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Shield } from 'lucide-react';
import type { Role } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();

  // Mode switcher for testing/demoing all 3 role dashboards easily
  const [overrideRole, setOverrideRole] = useState<Role | null>(null);

  const activeUser = user
    ? { ...user, role: overrideRole || user.role }
    : {
        id: 'usr_admin',
        name: 'Crimson Dawn Enterprises',
        email: 'admin@courieros.com',
        role: overrideRole || 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  const activeRole = activeUser.role;

  return (
    <div className="space-y-6">
      {/* Role Switcher Bar for Quick Evaluation */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary-600" />
          <span className="font-semibold text-surface-700 dark:text-surface-300">Active View Role:</span>
          <span className="font-bold text-primary-600 dark:text-primary-400">{activeRole}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-2xs text-surface-400">Switch View:</span>
          <button
            onClick={() => setOverrideRole('CUSTOMER')}
            className={`rounded px-2.5 py-1 text-2xs font-bold transition-all ${
              activeRole === 'CUSTOMER'
                ? 'bg-primary-600 text-white shadow'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300'
            }`}
          >
            Customer View
          </button>
          <button
            onClick={() => setOverrideRole('DRIVER')}
            className={`rounded px-2.5 py-1 text-2xs font-bold transition-all ${
              activeRole === 'DRIVER'
                ? 'bg-primary-600 text-white shadow'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300'
            }`}
          >
            Delivery Agent View
          </button>
          <button
            onClick={() => setOverrideRole('ADMIN')}
            className={`rounded px-2.5 py-1 text-2xs font-bold transition-all ${
              activeRole === 'ADMIN' || activeRole === 'DISPATCHER'
                ? 'bg-primary-600 text-white shadow'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300'
            }`}
          >
            Admin Dashboard
          </button>
        </div>
      </div>

      {/* Render Role Specific Dashboard */}
      {activeRole === 'CUSTOMER' && <CustomerDashboard currentUser={activeUser} />}
      {activeRole === 'DRIVER' && <DeliveryAgentDashboard currentUser={activeUser} />}
      {(activeRole === 'ADMIN' || activeRole === 'DISPATCHER') && <AdminDashboard />}
    </div>
  );
}
