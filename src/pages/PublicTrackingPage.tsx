import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Truck, MapPin, Package, CheckCircle2, QrCode, CornerDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '@/components/ui';
import { ThemeToggle } from '@/components/ui';
import { dataStore } from '@/lib/dataStore';
import type { Shipment, ShipmentStatus } from '@/types';
import { QRCodeModal } from '@/components/customer/QRCodeModal';
import { formatDate } from '@/utils/formatters';

export function PublicTrackingPage() {
  const [query, setQuery] = useState('COUR-98234-NY');
  const [searchedShipment, setSearchedShipment] = useState<Shipment | null>(() =>
    dataStore.getShipmentByTracking('COUR-98234-NY') || null,
  );
  const [showQr, setShowQr] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const found = dataStore.getShipmentByTracking(query.trim());
    setSearchedShipment(found || null);
  };

  const statusSteps: { key: ShipmentStatus; label: string; desc: string }[] = [
    { key: 'CREATED', label: 'Order Created', desc: 'Shipment booked and label generated' },
    { key: 'PICKED_UP', label: 'Picked Up', desc: 'Package collected from sender' },
    { key: 'WAREHOUSE', label: 'Warehouse Hub', desc: 'Arrived at sorting facility' },
    { key: 'IN_TRANSIT', label: 'In Transit', desc: 'En route between distribution hubs' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Courier dispatched for final delivery' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Package signed and delivered' },
  ];

  const getStepIndex = (status: ShipmentStatus) => {
    const map: Record<ShipmentStatus, number> = {
      CREATED: 0,
      PENDING: 0,
      PICKED_UP: 1,
      WAREHOUSE: 2,
      SORTING_FACILITY: 2,
      IN_TRANSIT: 3,
      OUT_FOR_DELIVERY: 4,
      DELIVERED: 5,
      EXCEPTION: 3,
      CANCELLED: 0,
    };
    return map[status] ?? 0;
  };

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-surface-100 font-sans selection:bg-primary-500 selection:text-white">
      {/* Public Navbar */}
      <header className="sticky top-0 z-40 border-b border-surface-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-surface-800 dark:bg-surface-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-surface-900 dark:text-surface-100">
                CourierOS
              </span>
              <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-2xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                Live Tracking
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Portal Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-surface-900 to-surface-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Badge variant="primary" className="mb-4 inline-flex">
            Enterprise Logistics Network
          </Badge>
          <h1 className="text-3xl font-extrabold sm:text-5xl tracking-tight">
            Track Your Shipment in Real Time
          </h1>
          <p className="mt-3 text-sm text-surface-300 max-w-xl mx-auto">
            Instant status updates, GPS route tracking, and proof of delivery for thousands of parcels nationwide.
          </p>

          <form onSubmit={handleTrack} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Enter Tracking Number (e.g. COUR-98234-NY)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-surface-700 bg-surface-800/90 pl-10 pr-4 text-sm text-white placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <Button size="lg" type="submit" className="w-full sm:w-auto h-12 px-6 font-bold" leftIcon={<Truck className="h-5 w-5" />}>
              Track Package
            </Button>
          </form>

          {/* Quick Demo Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-2xs text-surface-400">
            <span>Try sample tracking numbers:</span>
            {['COUR-98234-NY', 'COUR-44120-CHI', 'COUR-88192-LA'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setQuery(num);
                  setSearchedShipment(dataStore.getShipmentByTracking(num) || null);
                }}
                className="font-mono underline hover:text-primary-300"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Tracking Results Container */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {searchedShipment ? (
          <div className="space-y-6 animate-fade-in">
            {/* Package Overview Card */}
            <Card className="border-t-4 border-t-primary-600 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-surface-200 pb-6 dark:border-surface-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-mono text-xl font-black text-surface-900 dark:text-surface-100">
                        {searchedShipment.trackingNumber}
                      </h2>
                      <Badge variant="primary" size="lg">
                        {searchedShipment.status.replace(/_/g, ' ')}
                      </Badge>
                      <button
                        onClick={() => setShowQr(true)}
                        className="p-1 rounded-lg border border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:hover:bg-surface-800"
                        title="Show QR Code"
                      >
                        <QrCode className="h-4 w-4 text-surface-600 dark:text-surface-300" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                      Service: <span className="font-bold text-surface-800 dark:text-surface-200">{searchedShipment.serviceType}</span> | Sender: {searchedShipment.senderName}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-2xs font-bold uppercase tracking-wider text-surface-400">Estimated Delivery</p>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      {formatDate(searchedShipment.estimatedDelivery || searchedShipment.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Sender -> Recipient Route */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 rounded-xl bg-surface-50 p-4 dark:bg-surface-800/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xs font-bold uppercase tracking-wider text-surface-400">From (Origin)</p>
                      <p className="text-xs font-bold text-surface-900 dark:text-surface-100">{searchedShipment.senderName}</p>
                      <p className="text-2xs text-surface-500">{searchedShipment.senderCity}, {searchedShipment.senderState}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-surface-200 pt-3 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4 dark:border-surface-700">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xs font-bold uppercase tracking-wider text-surface-400">To (Destination)</p>
                      <p className="text-xs font-bold text-surface-900 dark:text-surface-100">{searchedShipment.recipientName}</p>
                      <p className="text-2xs text-surface-500">{searchedShipment.recipientCity}, {searchedShipment.recipientState}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="mt-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-6">Delivery Lifecycle Progress</h3>
                  <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-6">
                    {statusSteps.map((step, idx) => {
                      const currentIndex = getStepIndex(searchedShipment.status);
                      const isDone = idx <= currentIndex;
                      const isCurrent = idx === currentIndex;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                              isCurrent
                                ? 'border-primary-600 bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                                : isDone
                                ? 'border-success-500 bg-success-500 text-white'
                                : 'border-surface-300 bg-surface-100 text-surface-400 dark:border-surface-700 dark:bg-surface-800'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                          </div>
                          <p className="mt-2 text-xs font-bold text-surface-900 dark:text-surface-100">{step.label}</p>
                          <p className="mt-0.5 text-[10px] text-surface-400 leading-tight">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Logs History */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Tracking Log History</CardTitle>
                <CardDescription>Scan milestones and facility check-ins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchedShipment.trackingLogs?.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                      <CornerDownRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-surface-900 dark:text-surface-100">{log.message}</p>
                      <p className="text-2xs text-surface-400">{log.city || 'Distribution Center'}</p>
                    </div>
                    <span className="text-2xs text-surface-400 font-mono">{formatDate(log.timestamp)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-surface-400" />
              <h3 className="mt-3 text-base font-bold text-surface-900 dark:text-surface-100">
                No Shipment Found
              </h3>
              <p className="mt-1 text-xs text-surface-400">
                Double check the tracking number and try again.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* QR Modal */}
      {searchedShipment && (
        <QRCodeModal
          isOpen={showQr}
          onClose={() => setShowQr(false)}
          trackingNumber={searchedShipment.trackingNumber}
          recipientName={searchedShipment.recipientName}
          destination={`${searchedShipment.recipientCity}, ${searchedShipment.recipientState}`}
        />
      )}
    </div>
  );
}
