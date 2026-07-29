import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Truck } from 'lucide-react';

const drivers = [
  { name: 'John Martinez', vehicle: 'Van — NY-2841', status: 'On route', deliveries: 12 },
  { name: 'Sarah Chen', vehicle: 'Truck — CA-9932', status: 'Available', deliveries: 0 },
  { name: 'Mike Johnson', vehicle: 'Van — TX-1120', status: 'On route', deliveries: 8 },
  { name: 'Emma Wilson', vehicle: 'Bike — OR-4471', status: 'Off duty', deliveries: 0 },
];

export function FleetPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {drivers.map((d) => (
          <Card key={d.name} hoverable>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{d.name}</p>
                  <p className="text-xs text-surface-400">{d.vehicle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-500 dark:text-surface-400">{d.status}</span>
                <span className="font-medium text-surface-700 dark:text-surface-300">{d.deliveries} deliveries</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
          <CardDescription>Vehicle and driver management will be available here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-surface-400">Fleet management features coming in the next phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
