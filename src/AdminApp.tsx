import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const Admin = lazy(() => import('./features/admin/Admin'));

export const AdminApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
              <main className="flex-1">
                <Suspense
                  fallback={
                    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                      <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/*" element={<Admin />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default AdminApp;
