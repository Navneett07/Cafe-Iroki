import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminAuthGuard } from './components/auth/AdminAuthGuard';

// Lazy-load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Menu = lazy(() => import('./pages/Menu'));
const Reservations = lazy(() => import('./pages/Reservations'));
const Customers = lazy(() => import('./pages/Customers'));
const Payments = lazy(() => import('./pages/Payments'));
const Coupons = lazy(() => import('./pages/Coupons'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Media = lazy(() => import('./pages/Media'));
const Reports = lazy(() => import('./pages/Reports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[--color-surface-900]">
    <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
  </div>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AdminAuthProvider>
      <ToastProvider>
        <HashRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected admin routes */}
              <Route path="/" element={<AdminAuthGuard><Dashboard /></AdminAuthGuard>} />
              <Route path="/orders" element={<AdminAuthGuard><Orders /></AdminAuthGuard>} />
              <Route path="/menu" element={<AdminAuthGuard><Menu /></AdminAuthGuard>} />
              <Route path="/reservations" element={<AdminAuthGuard><Reservations /></AdminAuthGuard>} />
              <Route path="/customers" element={<AdminAuthGuard><Customers /></AdminAuthGuard>} />
              <Route path="/payments" element={<AdminAuthGuard><Payments /></AdminAuthGuard>} />
              <Route path="/coupons" element={<AdminAuthGuard><Coupons /></AdminAuthGuard>} />
              <Route path="/reviews" element={<AdminAuthGuard><Reviews /></AdminAuthGuard>} />
              <Route path="/media" element={<AdminAuthGuard><Media /></AdminAuthGuard>} />
              <Route path="/reports" element={<AdminAuthGuard><Reports /></AdminAuthGuard>} />
              <Route path="/notifications" element={<AdminAuthGuard><Notifications /></AdminAuthGuard>} />
              <Route path="/audit-logs" element={<AdminAuthGuard><AuditLogs /></AdminAuthGuard>} />
              <Route path="/settings" element={<AdminAuthGuard><Settings /></AdminAuthGuard>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </ToastProvider>
    </AdminAuthProvider>
  </QueryClientProvider>
);

export default App;
