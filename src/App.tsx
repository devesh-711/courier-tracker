import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ToastProvider } from '@/components/ui/Toast';
import { DashboardPage } from '@/pages/DashboardPage';
import { ShipmentsPage } from '@/pages/ShipmentsPage';
import { TrackingPage } from '@/pages/TrackingPage';
import { FleetPage } from '@/pages/FleetPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { PublicTrackingPage } from '@/pages/PublicTrackingPage';

export default function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public Live Tracking Landing Page */}
                <Route path="/" element={<PublicTrackingPage />} />

                {/* Auth routes — no layout, no auth required */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* App routes — protected with layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/shipments" element={<ShipmentsPage />} />
                  <Route path="/tracking" element={<TrackingPage />} />
                  <Route
                    path="/fleet"
                    element={
                      <ProtectedRoute roles={['ADMIN', 'DISPATCHER']}>
                        <FleetPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
