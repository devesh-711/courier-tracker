import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Badge,
  useToast,
} from '@/components/ui';
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  RefreshCw,
  Clock,
  ArrowRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Sliders,
} from 'lucide-react';
import { dataStore } from '@/lib/dataStore';
import { api } from '@/lib/axios';
import { emitLocationUpdate } from '@/lib/socket';
import type { Shipment, ShipmentStatus } from '@/types';
import { formatDate, formatCurrency } from '@/utils/formatters';
import {
  ShipmentMap,
  type GeoFenceTransitionEvent,
} from '@/components/tracking/ShipmentMap';
import { resolveShipmentCoordinates, calculateDistance } from '@/lib/geo';

interface GeoFenceLogEntry {
  id: string;
  zoneName: string;
  transition: 'ENTER' | 'EXIT';
  timestamp: string;
  distanceKm: number;
}

export function TrackingPage() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState('COUR-98234-NY');
  const [shipment, setShipment] = useState<Shipment | null>(() =>
    dataStore.getShipmentByTracking('COUR-98234-NY') || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [allShipments, setAllShipments] = useState<Shipment[]>(() => dataStore.getShipments());
  const [geoFenceRadiusKm, setGeoFenceRadiusKm] = useState(25);
  const [geoFenceEvents, setGeoFenceEvents] = useState<GeoFenceLogEntry[]>([]);

  // Fetch shipment from backend API with instant fallback to dataStore
  const fetchShipmentData = useCallback(async (trackingId: string) => {
    setIsLoading(true);
    try {
      // Attempt backend API call first
      const response = await api.get(`/tracking/${encodeURIComponent(trackingId.trim())}/live`);
      if (response.data) {
        // Find or merge with local shipment object
        const local = dataStore.getShipmentByTracking(trackingId.trim());
        const merged: Shipment = local
          ? {
              ...local,
              currentLatitude: response.data.current_latitude ?? local.currentLatitude,
              currentLongitude: response.data.current_longitude ?? local.currentLongitude,
              status: response.data.status ?? local.status,
            }
          : (response.data as unknown as Shipment);

        setShipment(merged);
        setIsLoading(false);
        return;
      }
    } catch {
      // Graceful fallback to dataStore
    }

    const found = dataStore.getShipmentByTracking(trackingId.trim());
    setShipment(found || null);
    setIsLoading(false);
  }, []);

  // Subscribe to real-time dataStore events
  useEffect(() => {
    const handleUpdate = () => {
      setAllShipments(dataStore.getShipments());
      if (trackingNumber) {
        const found = dataStore.getShipmentByTracking(trackingNumber);
        if (found) setShipment(found);
      }
    };

    const unsub = dataStore.subscribe(handleUpdate);
    return () => unsub();
  }, [trackingNumber]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      fetchShipmentData(trackingNumber.trim());
    }
  };

  const selectShipment = (num: string) => {
    setTrackingNumber(num);
    fetchShipmentData(num);
  };

  // Callback when user simulates or pushes real-time location via the map
  const handleLocationUpdate = useCallback(
    (lat: number, lng: number, city?: string) => {
      if (!shipment) return;
      // Update dataStore
      const updated = dataStore.updateShipmentLocation(shipment.trackingNumber, lat, lng, city);
      if (updated) {
        setShipment({ ...updated });
      }
      // Broadcast via socket if connected
      emitLocationUpdate(shipment.trackingNumber, lat, lng, city);

      // Also fire patch to backend API if live
      api
        .patch(`/tracking/${encodeURIComponent(shipment.trackingNumber)}/location`, {
          latitude: lat,
          longitude: lng,
          city,
        })
        .catch(() => {
          // Backend offline or mock mode - silence error
        });
    },
    [shipment],
  );

  // Geo-fence transition handler (Triggers real-time Toast notifications on ENTER / EXIT)
  const handleGeoFenceTransition = useCallback(
    (event: GeoFenceTransitionEvent) => {
      if (!shipment) return;

      const isEnter = event.transition === 'ENTER';
      const toastMessage = isEnter
        ? `🚚 Geo-Fence Entry: Shipment ${shipment.trackingNumber} has ENTERED the "${event.zone.name}" (${event.distanceKm} km from destination).`
        : `⚠️ Geo-Fence Exit: Shipment ${shipment.trackingNumber} has EXITED the "${event.zone.name}" perimeter (${event.distanceKm} km away).`;

      // Trigger Toast Notification
      toast(toastMessage, isEnter ? 'success' : 'warning');

      // Record in local event list
      const newEntry: GeoFenceLogEntry = {
        id: `gfe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        zoneName: event.zone.name,
        transition: event.transition,
        timestamp: new Date().toLocaleTimeString(),
        distanceKm: event.distanceKm,
      };

      setGeoFenceEvents((prev) => [newEntry, ...prev.slice(0, 7)]);

      // Record in dataStore notifications & tracking logs for auditability
      dataStore.addNotification({
        userId: shipment.customerId,
        title: isEnter ? 'Geo-Fence: Entered Delivery Zone' : 'Geo-Fence: Exited Delivery Zone',
        message: toastMessage,
        type: isEnter ? 'SUCCESS' : 'STATUS_CHANGE',
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
      });
    },
    [shipment, toast],
  );

  // Calculate current distance to destination delivery zone
  const deliveryZoneInfo = useCallback(() => {
    if (!shipment) return null;
    const { destination, current } = resolveShipmentCoordinates(shipment);
    const distKm = calculateDistance(current[0], current[1], destination[0], destination[1]);
    const isInside = distKm <= geoFenceRadiusKm;
    return {
      distKm,
      isInside,
      zoneName: `${shipment.recipientCity || 'Destination'} Delivery Zone`,
      radiusKm: geoFenceRadiusKm,
      destination,
      current,
    };
  }, [shipment, geoFenceRadiusKm]);

  const zoneInfo = deliveryZoneInfo();

  // Test toggle: jump across the geo-fence boundary
  const handleTestBoundaryToggle = () => {
    if (!shipment || !zoneInfo) return;
    if (zoneInfo.isInside) {
      // Jump outside zone (radius + 15km)
      const offset = (geoFenceRadiusKm + 18) / 111;
      const newLat = zoneInfo.destination[0] - offset;
      const newLng = zoneInfo.destination[1] - offset;
      handleLocationUpdate(
        newLat,
        newLng,
        `Corridor Approach (${shipment.recipientCity} Perimeter - Outside)`,
      );
    } else {
      // Jump inside zone (4km from destination)
      const offset = 4 / 111;
      const newLat = zoneInfo.destination[0] + offset;
      const newLng = zoneInfo.destination[1] + offset;
      handleLocationUpdate(
        newLat,
        newLng,
        `${shipment.recipientCity} Final-Mile Delivery Zone (Inside Perimeter)`,
      );
    }
  };

  const getStatusVariant = (status: ShipmentStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'OUT_FOR_DELIVERY':
        return 'primary';
      case 'IN_TRANSIT':
        return 'info';
      case 'WAREHOUSE':
      case 'PICKED_UP':
      case 'SORTING_FACILITY':
        return 'info';
      case 'CREATED':
      case 'PENDING':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Quick Selector Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-black">Live Interactive Shipment Tracking</CardTitle>
              <CardDescription>
                Real-time GPS mapping & telemetry with automated Geo-Fencing perimeter alerts
              </CardDescription>
            </div>
            {shipment && (
              <Badge variant={getStatusVariant(shipment.status)} className="self-start sm:self-auto uppercase">
                {shipment.status.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g. COUR-98234-NY"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="max-w-md font-mono"
            />
            <Button type="submit" leftIcon={<Truck className="h-4 w-4" />} disabled={isLoading}>
              {isLoading ? 'Fetching...' : 'Track Package'}
            </Button>
            <Button
              type="button"
              variant="outline"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={() => fetchShipmentData(trackingNumber)}
            >
              Refresh
            </Button>
          </form>

          {/* Quick Select demo shipments */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-800 text-xs">
            <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400">
              Active Shipments:
            </span>
            {allShipments.slice(0, 5).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectShipment(s.trackingNumber)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  shipment?.trackingNumber === s.trackingNumber
                    ? 'bg-primary-600 text-white font-medium shadow-sm'
                    : 'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
                }`}
              >
                <span className="font-mono font-medium">{s.trackingNumber}</span>
                <span className="text-3xs opacity-80 uppercase">({s.status.replace(/_/g, ' ')})</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {shipment ? (
        <div className="space-y-6">
          {/* Main Leaflet Map Visualization with Geo-Fence Perimeter */}
          <Card className="overflow-hidden p-0">
            <CardHeader className="p-4 sm:p-5 border-b border-surface-200 dark:border-surface-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Real-Time Route Map & Geo-Fence Radar</CardTitle>
                    <CardDescription className="text-xs">
                      {shipment.senderCity} ({shipment.senderState}) → {shipment.recipientCity} ({shipment.recipientState})
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {zoneInfo && (
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                        zoneInfo.isInside
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      {zoneInfo.isInside ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      )}
                      <span>{zoneInfo.isInside ? 'Inside Delivery Zone' : 'Outside Delivery Zone'}</span>
                    </div>
                  )}

                  <Badge variant={getStatusVariant(shipment.status)}>
                    {shipment.serviceType}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* React-Leaflet Map Component */}
              <ShipmentMap
                shipment={shipment}
                onLocationUpdate={handleLocationUpdate}
                onGeoFenceTransition={handleGeoFenceTransition}
                geoFenceRadiusKm={geoFenceRadiusKm}
                onGeoFenceRadiusChange={setGeoFenceRadiusKm}
              />
            </CardContent>
          </Card>

          {/* Geo-Fencing Telemetry & Control Banner */}
          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/5 via-transparent to-primary-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
                        Geo-Fence Perimeter Alert Engine
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <Radio className="h-2.5 w-2.5 animate-pulse" /> Active Monitoring
                      </span>
                    </div>
                    <p className="text-xs text-surface-600 dark:text-surface-400 max-w-2xl">
                      Automated boundary monitoring triggers instant notifications whenever this package enters or exits the predefined <span className="font-semibold text-surface-900 dark:text-surface-200">{zoneInfo?.zoneName}</span> ({geoFenceRadiusKm} km perimeter).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                  {/* Zone Radius Selector */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white p-1 text-xs dark:border-surface-800 dark:bg-surface-900">
                    <Sliders className="h-3.5 w-3.5 text-surface-400 ml-1.5" />
                    <span className="text-3xs font-bold text-surface-400 uppercase">Radius:</span>
                    {[10, 25, 50].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setGeoFenceRadiusKm(r)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                          geoFenceRadiusKm === r
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>

                  {/* Interactive Test Trigger Button */}
                  <Button
                    type="button"
                    onClick={handleTestBoundaryToggle}
                    leftIcon={
                      zoneInfo?.isInside ? (
                        <ShieldAlert className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )
                    }
                    className={
                      zoneInfo?.isInside
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }
                  >
                    {zoneInfo?.isInside ? 'Test Exit Zone Alert' : 'Test Enter Zone Alert'}
                  </Button>
                </div>
              </div>

              {/* Recent Geo-Fence Crossings Log */}
              {geoFenceEvents.length > 0 && (
                <div className="mt-4 pt-3 border-t border-surface-200/60 dark:border-surface-800/60">
                  <span className="text-3xs uppercase font-extrabold tracking-wider text-surface-400 block mb-2">
                    Recent Perimeter Events (Triggered Live):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {geoFenceEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-2xs font-mono border ${
                          evt.transition === 'ENTER'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        <span className="font-bold">
                          {evt.transition === 'ENTER' ? 'ENTERED' : 'EXITED'}
                        </span>
                        <span>•</span>
                        <span>{evt.zoneName}</span>
                        <span className="opacity-70">({evt.timestamp})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata & Timeline 2-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Shipment Details Column */}
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-surface-500">
                  Shipment Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs pt-0">
                <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60">
                  <span className="text-3xs uppercase font-bold text-surface-400 tracking-wider">
                    Tracking ID
                  </span>
                  <p className="font-mono font-bold text-base text-primary-600 dark:text-primary-400">
                    {shipment.trackingNumber}
                  </p>
                </div>

                {/* Origin & Destination route pill */}
                <div className="space-y-2 rounded-lg border border-surface-200 p-3 dark:border-surface-800">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-3xs uppercase font-bold text-surface-400">Origin / Merchant</p>
                      <p className="font-semibold text-surface-900 dark:text-surface-100">{shipment.senderName}</p>
                      <p className="text-2xs text-surface-500">{shipment.senderAddress}, {shipment.senderCity}, {shipment.senderState}</p>
                    </div>
                  </div>

                  <div className="ml-1 pl-2 border-l-2 border-dashed border-surface-300 dark:border-surface-700 py-1">
                    <ArrowRight className="h-3 w-3 text-surface-400 rotate-90" />
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-3xs uppercase font-bold text-surface-400">Destination</p>
                      <p className="font-semibold text-surface-900 dark:text-surface-100">{shipment.recipientName}</p>
                      <p className="text-2xs text-surface-500">{shipment.recipientAddress}, {shipment.recipientCity}, {shipment.recipientState}</p>
                    </div>
                  </div>
                </div>

                {/* Courier info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-3xs text-surface-400 uppercase font-bold">Assigned Courier</span>
                    <p className="font-semibold text-surface-900 dark:text-surface-100 mt-0.5">
                      {shipment.assignedDriverName || 'Express Courier'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xs text-surface-400 uppercase font-bold">Est. Delivery</span>
                    <p className="font-semibold text-surface-900 dark:text-surface-100 mt-0.5">
                      {formatDate(shipment.estimatedDelivery || shipment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-3xs text-surface-400 uppercase font-bold">Package Weight</span>
                    <p className="font-semibold text-surface-900 dark:text-surface-100 mt-0.5">
                      {shipment.weight} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-3xs text-surface-400 uppercase font-bold">Declared Value</span>
                    <p className="font-semibold text-surface-900 dark:text-surface-100 mt-0.5">
                      {formatCurrency(shipment.declaredValue || 25000)}
                    </p>
                  </div>
                </div>

                {shipment.deliveryProof && (
                  <div className="rounded-xl border border-success-200 bg-success-50/70 p-3.5 dark:border-success-900 dark:bg-success-950/40">
                    <p className="text-xs font-bold text-success-700 dark:text-success-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Proof of Delivery Verified
                    </p>
                    <p className="text-2xs text-surface-600 dark:text-surface-300 mt-1">
                      Signed & received by {shipment.deliveryProof.recipientName || shipment.recipientName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checkpoint Logs & Timeline Column */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Location & Event Timeline</CardTitle>
                    <CardDescription>Chronological milestones, GPS pings & Geo-Fence logs</CardDescription>
                  </div>
                  <span className="text-2xs font-mono text-surface-400">
                    {shipment.trackingLogs?.length || 0} events
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4 pl-4 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-0.5 before:bg-surface-200 dark:before:bg-surface-800">
                  {shipment.trackingLogs && shipment.trackingLogs.length > 0 ? (
                    shipment.trackingLogs.map((log, idx) => (
                      <div key={log.id || idx} className="relative flex items-start gap-3">
                        <div
                          className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            idx === 0
                              ? 'border-primary-600 bg-primary-600 text-white ring-4 ring-primary-500/20'
                              : 'border-surface-300 bg-white text-surface-400 dark:border-surface-700 dark:bg-surface-900'
                          }`}
                        >
                          {idx === 0 ? (
                            <Truck className="h-3 w-3" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </div>

                        <div className="flex-1 rounded-xl border border-surface-100 bg-surface-50/50 p-3 dark:border-surface-800 dark:bg-surface-900/60">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-xs font-bold text-surface-900 dark:text-surface-100">
                              {log.eventType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-3xs text-surface-400 font-mono flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-surface-600 dark:text-surface-300 mt-1">
                            {log.message}
                          </p>

                          {log.city && (
                            <p className="text-2xs font-medium text-primary-600 dark:text-primary-400 mt-1">
                              📍 {log.city}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-surface-400">
                      No tracking milestones recorded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-sm text-surface-400">
            <Package className="h-10 w-10 mx-auto text-surface-400 mb-2 opacity-50" />
            <p>No shipment found for tracking number <span className="font-mono font-bold text-surface-600 dark:text-surface-300">{trackingNumber}</span>.</p>
            <p className="text-xs text-surface-400 mt-1">Please check the number or pick from the active shipments above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
