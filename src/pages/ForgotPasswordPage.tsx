import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/lib/auth';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast('Reset link sent if account exists', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Request failed', 'error');
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Forgot password
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" />
              <h2 className="mb-2 text-lg font-semibold text-surface-900 dark:text-surface-100">
                Check your email
              </h2>
              <p className="mb-6 text-sm text-surface-500 dark:text-surface-400">
                If an account exists for {email}, a password reset link has been sent. The link
                expires in 1 hour.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
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
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Send reset link
              </Button>
            </form>
          )}

          <div className="mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
