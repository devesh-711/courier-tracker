import { Search, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ui';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white/80 px-6 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-950/80 sticky top-0 z-10">
      <div>
        <h2 className="text-base font-bold tracking-tight text-surface-900 dark:text-surface-100">{title}</h2>
        {subtitle && <p className="text-2xs text-surface-400 font-mono">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search shipments, tracking IDs, or users..."
            className="h-9 w-80 rounded-lg border border-surface-300 bg-white pl-10 pr-3 text-xs text-surface-900 placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-100 dark:placeholder-surface-500"
          />
        </div>

        <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error-500" />
        </button>

        <ThemeToggle />

        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500" />
      </div>
    </header>
  );
}
