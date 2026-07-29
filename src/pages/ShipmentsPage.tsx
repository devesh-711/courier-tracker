import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button, Badge, Input } from '@/components/ui';
import { Search, Plus, Package, QrCode } from 'lucide-react';
import { dataStore } from '@/lib/dataStore';
import { useAuth } from '@/providers/AuthProvider';
import type { Shipment, ShipmentStatus } from '@/types';
import { CreateShipmentModal } from '@/components/customer/CreateShipmentModal';
import { QRCodeModal } from '@/components/customer/QRCodeModal';
import { formatDate } from '@/utils/formatters';

export function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQrShipment, setSelectedQrShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    const loadData = () => {
      const all = dataStore.getShipmentsForUser(user?.id || 'usr_admin', user?.role || 'ADMIN');
      setShipments(all);
    };

    loadData();
    const unsub = dataStore.subscribe(loadData);
    return () => unsub();
  }, [user]);

  const filteredShipments = shipments.filter((s) => {
    const matchesQuery =
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const getStatusVariant = (status: ShipmentStatus): 'primary' | 'success' | 'warning' | 'info' | 'error' | 'neutral' => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'OUT_FOR_DELIVERY':
        return 'primary';
      case 'IN_TRANSIT':
      case 'WAREHOUSE':
      case 'PICKED_UP':
      case 'SORTING_FACILITY':
        return 'info';
      case 'PENDING':
      case 'CREATED':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">Shipments Management</h1>
          <p className="text-xs text-surface-400">View and track all registered parcels</p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          New Shipment
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            className="max-w-xs"
            placeholder="Search by tracking number, sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-surface-300 bg-white px-3 text-xs text-surface-900 focus:border-primary-500 focus:outline-none dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="WAREHOUSE">Warehouse Hub</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-200 bg-surface-50 font-bold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/60 dark:text-surface-400">
                <tr>
                  <th className="px-4 py-3">Tracking #</th>
                  <th className="px-4 py-3">Sender</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-surface-400">
                      No shipments found.
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary-600" />
                          <span className="font-mono font-bold text-surface-900 dark:text-surface-100">
                            {s.trackingNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{s.senderName}</td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                        {s.recipientName} ({s.recipientCity})
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-2xs text-surface-600 dark:text-surface-300">
                        {s.serviceType}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(s.status)}>
                          {s.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-400">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedQrShipment(s)}
                          title="Show QR Code"
                        >
                          <QrCode className="h-4 w-4 text-surface-600 dark:text-surface-300" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CreateShipmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        customerId={user?.id || 'usr_admin'}
        customerName={user?.name || 'Administrator'}
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
