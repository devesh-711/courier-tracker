import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/providers/AuthProvider';

export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 dark:bg-surface-950">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-elevated">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">CourierOS</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Sign in to your courier management dashboard
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pointer-events-auto text-surface-400 hover:text-surface-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t border-surface-200 pt-5 dark:border-surface-800">
            <p className="mb-2 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Quick Demo Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@courieros.com');
                  setPassword('Password123!');
                }}
                className="rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('driver@courieros.com');
                  setPassword('Password123!');
                }}
                className="rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('customer@courieros.com');
                  setPassword('Password123!');
                }}
                className="rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                Customer
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
