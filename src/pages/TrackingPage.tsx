import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Badge } from '@/components/ui';
import { Search, Truck, CheckCircle2, Compass } from 'lucide-react';
import { dataStore } from '@/lib/dataStore';
import type { Shipment } from '@/types';
import { formatDate } from '@/utils/formatters';

export function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('COUR-98234-NY');
  const [shipment, setShipment] = useState<Shipment | null>(() =>
    dataStore.getShipmentByTracking('COUR-98234-NY') || null,
  );

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const found = dataStore.getShipmentByTracking(trackingNumber);
    setShipment(found || null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Live Interactive Shipment Tracking</CardTitle>
          <CardDescription>Enter a tracking number to view real-time location & timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g. COUR-98234-NY"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="max-w-md"
            />
            <Button type="submit" leftIcon={<Truck className="h-4 w-4" />}>
              Track Package
            </Button>
          </form>
        </CardContent>
      </Card>

      {shipment ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map View Frame */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary-600 animate-spin" />
                  <CardTitle className="text-base font-bold">Route Map & GPS Position</CardTitle>
                </div>
                <Badge variant="primary">{shipment.status.replace(/_/g, ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative flex h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-b-xl bg-surface-900 text-white p-6">
                {/* Visual Map Canvas Simulation */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b66f6_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 w-full max-w-lg space-y-6 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-600/30 text-primary-400 border border-primary-500/50 shadow-2xl animate-pulse">
                    <Truck className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-primary-400 font-bold">Current Hub Position</p>
                    <h3 className="text-xl font-black mt-1 text-white">
                      {shipment.currentCity || shipment.recipientCity}
                    </h3>
                    <p className="text-2xs text-surface-400 mt-1 font-mono">
                      GPS Coords: {shipment.currentLatitude || 41.5034}° N, {shipment.currentLongitude || -72.6598}° W
                    </p>
                  </div>

                  {/* Route progress */}
                  <div className="rounded-xl border border-surface-800 bg-surface-950/80 p-4 text-left space-y-2">
                    <div className="flex justify-between text-2xs text-surface-400">
                      <span>Origin: {shipment.senderCity}</span>
                      <span>Dest: {shipment.recipientCity}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-500 to-success-500 w-3/4 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Side Details */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment Metadata</CardTitle>
              <CardDescription>Order details & courier info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="text-2xs text-surface-400 uppercase font-bold">Tracking #</span>
                <p className="font-mono font-bold text-sm text-surface-900 dark:text-surface-100">{shipment.trackingNumber}</p>
              </div>

              <div>
                <span className="text-2xs text-surface-400 uppercase font-bold">Recipient</span>
                <p className="font-medium text-surface-900 dark:text-surface-100">{shipment.recipientName}</p>
                <p className="text-2xs text-surface-500">{shipment.recipientAddress}, {shipment.recipientCity}</p>
              </div>

              <div>
                <span className="text-2xs text-surface-400 uppercase font-bold">Assigned Courier</span>
                <p className="font-medium text-primary-600 dark:text-primary-400">
                  {shipment.assignedDriverName || 'Alex Rivera (Agent)'}
                </p>
              </div>

              <div>
                <span className="text-2xs text-surface-400 uppercase font-bold">Est. Delivery</span>
                <p className="font-semibold text-surface-900 dark:text-surface-100">
                  {formatDate(shipment.estimatedDelivery || shipment.createdAt)}
                </p>
              </div>

              {shipment.deliveryProof && (
                <div className="rounded-lg border border-success-200 bg-success-50/50 p-3 dark:border-success-900 dark:bg-success-950/30">
                  <p className="text-2xs font-bold text-success-700 dark:text-success-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Proof of Delivery Recorded
                  </p>
                  <p className="text-2xs text-surface-600 dark:text-surface-300 mt-1">
                    Signed by {shipment.deliveryProof.recipientName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-xs text-surface-400">
            Enter a valid tracking number above to start live tracking.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
