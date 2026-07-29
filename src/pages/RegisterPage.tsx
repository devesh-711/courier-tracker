import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, User, Mail, Lock, Phone, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/providers/AuthProvider';

type RoleChoice = 'CUSTOMER' | 'DRIVER';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-2 text-xs">
          {c.met ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-surface-300" />
          )}
          <span className={c.met ? 'text-success-600 dark:text-success-400' : 'text-surface-400'}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleChoice>('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ email, password, name, role, phone: phone || undefined });
      toast('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-8 dark:bg-surface-950">
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Create account</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Get started with CourierOS
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    role === 'CUSTOMER'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-surface-300 hover:border-surface-400 dark:border-surface-700'
                  }`}
                >
                  <User className="mx-auto mb-1 h-5 w-5" />
                  <span className="text-sm font-medium">Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DRIVER')}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    role === 'DRIVER'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-surface-300 hover:border-surface-400 dark:border-surface-700'
                  }`}
                >
                  <Truck className="mx-auto mb-1 h-5 w-5" />
                  <span className="text-sm font-medium">Delivery Agent</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Full name
              </label>
              <Input
                placeholder="John Doe"
                leftIcon={<User className="h-4 w-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
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
                Phone <span className="text-surface-400">(optional)</span>
              </label>
              <Input
                type="tel"
                placeholder="555-0100"
                leftIcon={<Phone className="h-4 w-4" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
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
                autoComplete="new-password"
              />
              <PasswordStrength password={password} />
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
