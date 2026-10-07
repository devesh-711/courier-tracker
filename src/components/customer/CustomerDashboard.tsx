import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  QrCode,
  Bell,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Input } from '@/components/ui';
import { dataStore } from '@/lib/dataStore';
import type { Shipment, User, ShipmentStatus } from '@/types';
import { CreateShipmentModal } from './CreateShipmentModal';
import { QRCodeModal } from './QRCodeModal';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface CustomerDashboardProps {
  currentUser: User;
}

export function CustomerDashboard({ currentUser }: CustomerDashboardProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchType] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQrShipment, setSelectedQrShipment] = useState<Shipment | null>(null);
  const [activeTab, setActiveTab] = useState<'shipments' | 'notifications' | 'profile'>('shipments');

  useEffect(() => {
    const loadData = () => {
      const userShipments = dataStore.getShipmentsForUser(currentUser.id, currentUser.role);
      setShipments(userShipments);
    };

    loadData();
    const unsubscribe = dataStore.subscribe(loadData);
    return () => unsubscribe();
  }, [currentUser]);

  // Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientCity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = shipments.filter((s) => ['CREATED', 'PENDING', 'PICKED_UP', 'WAREHOUSE', 'SORTING_FACILITY', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length;
  const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;
  const inTransitCount = shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY').length;
  const totalSpent = shipments.reduce((sum, s) => sum + (s.price || 1450), 0);

  const notifications = dataStore.getNotifications(currentUser.id);

  const getStatusBadge = (status: ShipmentStatus) => {
    const variants: Record<ShipmentStatus, 'primary' | 'success' | 'warning' | 'info' | 'error' | 'neutral'> = {
      CREATED: 'neutral',
      PENDING: 'warning',
      PICKED_UP: 'info',
      WAREHOUSE: 'info',
      SORTING_FACILITY: 'info',
      IN_TRANSIT: 'info',
      OUT_FOR_DELIVERY: 'primary',
      DELIVERED: 'success',
      EXCEPTION: 'error',
      CANCELLED: 'error',
    };
    return <Badge variant={variants[status] || 'neutral'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-900 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">Welcome back, {currentUser.name}!</h1>
          <p className="mt-1 text-xs text-primary-200">
            Track your parcels, book new deliveries, and view real-time log updates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-white text-primary-900 hover:bg-surface-100 shadow-md font-bold"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Shipment
          </Button>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-2 dark:border-surface-800">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'shipments'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 font-bold'
              : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'
          }`}
        >
          <Package className="h-4 w-4" />
          My Shipments ({shipments.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'notifications'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 font-bold'
              : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifications
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 font-bold'
              : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Customer Profile
        </button>
      </div>

      {activeTab === 'shipments' && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card hoverable>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Active Parcels</p>
                  <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{activeCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Package className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">In Transit</p>
                  <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{inTransitCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400">
                  <Truck className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Delivered</p>
                  <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{deliveredCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Total Spent</p>
                  <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                  <Clock className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search, Filter Bar & Shipment History Table */}
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Shipment History & Live Status</CardTitle>
                <CardDescription>View, track, or generate QR code for your shipments</CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Input
                  className="w-full sm:w-64"
                  placeholder="Search tracking #, name, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchType(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-lg border border-surface-300 bg-white px-3 text-xs text-surface-900 focus:border-primary-500 focus:outline-none dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CREATED">Created</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-surface-200 bg-surface-50 font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/60 dark:text-surface-400">
                    <tr>
                      <th className="px-4 py-3">Tracking #</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Destination</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-surface-400">
                          No shipments found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredShipments.map((shipment) => (
                        <tr
                          key={shipment.id}
                          className="transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/40"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-surface-900 dark:text-surface-100">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary-600" />
                              <span>{shipment.trackingNumber}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-surface-800 dark:text-surface-200">
                            {shipment.recipientName}
                          </td>
                          <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                            {shipment.recipientCity}, {shipment.recipientState}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-surface-100 px-2 py-0.5 font-mono text-[10px] font-bold text-surface-700 dark:bg-surface-800 dark:text-surface-300">
                              {shipment.serviceType}
                            </span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(shipment.status)}</td>
                          <td className="px-4 py-3 text-surface-400">{formatDate(shipment.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedQrShipment(shipment)}
                                title="Show QR Code"
                              >
                                <QrCode className="h-4 w-4 text-surface-600 dark:text-surface-300" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Tab: Notifications */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications & Alerts</CardTitle>
            <CardDescription>Recent updates on your shipments and deliveries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-surface-400">No notifications yet.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => dataStore.markNotificationAsRead(notif.id)}
                  className={`flex items-start justify-between rounded-xl border p-4 transition-colors cursor-pointer ${
                    notif.read
                      ? 'border-surface-200 bg-surface-50/50 dark:border-surface-800 dark:bg-surface-900/30'
                      : 'border-primary-200 bg-primary-50/30 dark:border-primary-800 dark:bg-primary-950/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-surface-900 dark:text-surface-100">{notif.title}</h4>
                      <p className="mt-0.5 text-xs text-surface-600 dark:text-surface-300">{notif.message}</p>
                      <span className="mt-2 block text-2xs text-surface-400">{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                  {!notif.read && <span className="h-2 w-2 rounded-full bg-primary-600 shrink-0" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Account Settings</CardTitle>
            <CardDescription>Manage your contact and delivery preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <Input label="Full Name" defaultValue={currentUser.name} />
            <Input label="Email Address" defaultValue={currentUser.email} disabled />
            <Input label="Phone Number" defaultValue={currentUser.phone || '+1 (555) 902-8310'} />
            <Input label="Default Sender Address" defaultValue="742 Evergreen Terrace, Springfield" />

            <div className="pt-2">
              <Button leftIcon={<Shield className="h-4 w-4" />}>Save Profile Settings</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateShipmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        customerId={currentUser.id}
        customerName={currentUser.name}
      />

      {selectedQrShipment && (
        <QRCodeModal
          isOpen={!!selectedQrShipment}
          onClose={() => setSelectedQrShipment(null)}
          trackingNumber={selectedQrShipment.trackingNumber}
          recipientName={selectedQrShipment.recipientName}
          destination={`${selectedQrShipment.recipientCity}, ${selectedQrShipment.recipientState}`}
        />
      )}
    </div>
  );
}
