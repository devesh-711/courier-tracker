import { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Phone,
  Navigation,
  Compass,
  Check,
} from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { dataStore } from '@/lib/dataStore';
import type { Shipment, ShipmentStatus, User } from '@/types';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { formatDate } from '@/utils/formatters';

interface DeliveryAgentDashboardProps {
  currentUser: User;
}

export function DeliveryAgentDashboard({ currentUser }: DeliveryAgentDashboardProps) {
  const [assignedShipments, setAssignedShipments] = useState<Shipment[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ACTIVE');
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [selectedForProof, setSelectedForProof] = useState<Shipment | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadShipments = () => {
      const all = dataStore.getShipmentsForUser(currentUser.id, 'DRIVER');
      setAssignedShipments(all);
    };

    loadShipments();
    const unsub = dataStore.subscribe(loadShipments);
    return () => unsub();
  }, [currentUser]);

  // GPS geolocation toggle
  const toggleGps = () => {
    if (!gpsActive) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsActive(true);
          },
          () => {
            // Fallback simulated GPS
            setGpsCoords({ lat: 41.8781, lng: -87.6298 });
            setGpsActive(true);
          },
        );
      } else {
        setGpsCoords({ lat: 41.8781, lng: -87.6298 });
        setGpsActive(true);
      }
    } else {
      setGpsActive(false);
    }
  };

  const filteredShipments = assignedShipments.filter((s) => {
    if (activeFilter === 'ACTIVE') return s.status !== 'DELIVERED' && s.status !== 'CANCELLED';
    if (activeFilter === 'DELIVERED') return s.status === 'DELIVERED';
    return true;
  });

  const nextStatusMap: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
    CREATED: 'PICKED_UP',
    PENDING: 'PICKED_UP',
    PICKED_UP: 'WAREHOUSE',
    WAREHOUSE: 'SORTING_FACILITY',
    SORTING_FACILITY: 'IN_TRANSIT',
    IN_TRANSIT: 'OUT_FOR_DELIVERY',
    OUT_FOR_DELIVERY: 'DELIVERED',
  };

  const handleStatusAdvance = (shipment: Shipment) => {
    const nextStatus = nextStatusMap[shipment.status];
    if (!nextStatus) return;

    if (nextStatus === 'DELIVERED') {
      setSelectedForProof(shipment);
      return;
    }

    dataStore.updateShipmentStatus(
      shipment.id,
      nextStatus,
      `Status updated by delivery agent ${currentUser.name}`,
      shipment.currentCity || shipment.recipientCity,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    );
  };

  const handleAddNote = (shipmentId: string) => {
    const text = noteInput[shipmentId];
    if (!text) return;
    const shipment = assignedShipments.find((s) => s.id === shipmentId);
    if (!shipment) return;

    dataStore.updateShipmentStatus(
      shipment.id,
      shipment.status,
      `Driver Note: ${text}`,
      shipment.currentCity,
      { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    );

    setNoteInput((prev) => ({ ...prev, [shipmentId]: '' }));
  };

  const activeCount = assignedShipments.filter((s) => s.status !== 'DELIVERED').length;
  const outForDeliveryCount = assignedShipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length;
  const completedTodayCount = assignedShipments.filter((s) => s.status === 'DELIVERED').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / GPS Bar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-surface-900 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between border border-surface-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Delivery Agent Console</h1>
            <Badge variant="primary">Agent #{currentUser.id.slice(-4)}</Badge>
          </div>
          <p className="mt-1 text-xs text-surface-400">
            Active Driver: {currentUser.name} | Vehicle: VAN-101 (NY-K8290)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={toggleGps}
            className={gpsActive ? 'bg-success-600 hover:bg-success-700 text-white font-bold' : 'bg-surface-800 text-surface-200'}
            leftIcon={<Compass className={`h-4 w-4 ${gpsActive ? 'animate-spin' : ''}`} />}
          >
            {gpsActive ? `GPS Active (${gpsCoords?.lat.toFixed(2)}, ${gpsCoords?.lng.toFixed(2)})` : 'Enable GPS Tracking'}
          </Button>
        </div>
      </div>

      {/* Driver Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card hoverable>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-400">Assigned Active</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{activeCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-400">Out For Delivery</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{outForDeliveryCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-950 dark:text-accent-300">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-400">Completed Today</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{completedTodayCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-950 dark:text-success-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Filters */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-2 dark:border-surface-800">
        <button
          onClick={() => setActiveFilter('ACTIVE')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            activeFilter === 'ACTIVE'
              ? 'bg-primary-600 text-white'
              : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'
          }`}
        >
          Active Deliveries ({activeCount})
        </button>
        <button
          onClick={() => setActiveFilter('DELIVERED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            activeFilter === 'DELIVERED'
              ? 'bg-primary-600 text-white'
              : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'
          }`}
        >
          Completed History ({completedTodayCount})
        </button>
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            activeFilter === 'ALL'
              ? 'bg-primary-600 text-white'
              : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'
          }`}
        >
          All ({assignedShipments.length})
        </button>
      </div>

      {/* Deliveries List Cards */}
      <div className="space-y-4">
        {filteredShipments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-surface-400">
              No deliveries in this queue.
            </CardContent>
          </Card>
        ) : (
          filteredShipments.map((shipment) => {
            const nextStatus = nextStatusMap[shipment.status];
            return (
              <Card key={shipment.id} className="border-l-4 border-l-primary-600">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100">
                          {shipment.trackingNumber}
                        </span>
                        <Badge variant="primary">{shipment.status.replace(/_/g, ' ')}</Badge>
                        <span className="rounded bg-surface-100 px-2 py-0.5 text-2xs font-bold text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                          {shipment.serviceType}
                        </span>
                      </div>

                      <div className="grid gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-surface-100">
                            Recipient: {shipment.recipientName}
                          </p>
                          <p className="text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                            {shipment.recipientAddress}, {shipment.recipientCity}, {shipment.recipientState}{' '}
                            {shipment.recipientPostalCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-surface-500 dark:text-surface-400">
                            Weight: <span className="font-medium text-surface-800 dark:text-surface-200">{shipment.weight} kg</span> ({shipment.dimensions})
                          </p>
                          {shipment.notes && (
                            <p className="text-2xs text-amber-600 dark:text-amber-400 font-medium">
                              Note: {shipment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                      <div className="flex gap-2">
                        <a
                          href={`tel:${shipment.recipientPhone}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
                        >
                          <Phone className="h-3.5 w-3.5 text-success-600" />
                          Call
                        </a>

                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(
                            `${shipment.recipientAddress}, ${shipment.recipientCity}, ${shipment.recipientState}`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
                        >
                          <Navigation className="h-3.5 w-3.5 text-primary-600" />
                          Maps
                        </a>
                      </div>

                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusAdvance(shipment)}
                          leftIcon={<Check className="h-4 w-4" />}
                          className="bg-primary-600 text-white font-bold"
                        >
                          Mark as {nextStatus.replace(/_/g, ' ')}
                        </Button>
                      )}

                      {shipment.status === 'DELIVERED' && shipment.deliveryProof && (
                        <Badge variant="success">Proof Recorded</Badge>
                      )}
                    </div>
                  </div>

                  {/* Add Delivery Note Bar */}
                  {shipment.status !== 'DELIVERED' && (
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
                      <input
                        type="text"
                        placeholder="Add quick driver note (e.g. Gate code, calling recipient...)"
                        value={noteInput[shipment.id] || ''}
                        onChange={(e) =>
                          setNoteInput((prev) => ({ ...prev, [shipment.id]: e.target.value }))
                        }
                        className="h-8 flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3 text-2xs text-surface-900 focus:border-primary-500 focus:outline-none dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                      />
                      <Button size="sm" variant="outline" onClick={() => handleAddNote(shipment.id)}>
                        Log Note
                      </Button>
                    </div>
                  )}

                  {/* Delivery Timeline / Tracking Logs */}
                  {shipment.trackingLogs && shipment.trackingLogs.length > 0 && (
                    <div className="mt-3 rounded-lg bg-surface-50/70 p-3 dark:bg-surface-800/40">
                      <p className="text-2xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                        Latest Logs ({shipment.trackingLogs.length})
                      </p>
                      <div className="space-y-1.5">
                        {shipment.trackingLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="flex items-center justify-between text-2xs">
                            <span className="text-surface-700 dark:text-surface-300">{log.message}</span>
                            <span className="text-surface-400">{formatDate(log.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Proof Modal */}
      {selectedForProof && (
        <ProofOfDeliveryModal
          isOpen={!!selectedForProof}
          onClose={() => setSelectedForProof(null)}
          trackingNumber={selectedForProof.trackingNumber}
          recipientNameDefault={selectedForProof.recipientName}
          onSubmitProof={(proof) => {
            dataStore.updateShipmentStatus(
              selectedForProof.id,
              'DELIVERED',
              `Delivered to ${proof.recipientName}. Proof recorded.`,
              selectedForProof.recipientCity,
              { id: currentUser.id, name: currentUser.name, role: currentUser.role },
              proof,
            );
            setSelectedForProof(null);
          }}
        />
      )}
    </div>
  );
}
