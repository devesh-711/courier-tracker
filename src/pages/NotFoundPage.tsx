import { Link } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4 dark:bg-surface-950">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white">
          <Truck className="h-8 w-8" />
        </div>
        <h1 className="text-6xl font-bold text-surface-900 dark:text-surface-100">404</h1>
        <p className="mt-2 text-lg text-surface-500 dark:text-surface-400">Page not found</p>
        <p className="mt-1 text-sm text-surface-400">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="mt-6 inline-block">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
