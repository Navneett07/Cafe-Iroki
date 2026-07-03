import React, { lazy, Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonCard } from './components/ui/Skeleton';
import { ProtectedRoute } from './components/ProtectedRoute';

// Route Lazy Loading & Code Splitting
const Home = lazy(() => import('./features/home/Home'));
const Menu = lazy(() => import('./features/menu/Menu'));
const Reserve = lazy(() => import('./features/reservation/Reserve'));
const Gallery = lazy(() => import('./features/gallery/Gallery'));
const Checkout = lazy(() => import('./features/ordering/Checkout'));
const TrackOrder = lazy(() => import('./features/ordering/TrackOrder'));
const Profile = lazy(() => import('./features/profile/Profile'));

// Auth Pages Code Splitting
const Login = lazy(() => import('./features/auth/Login'));
const Register = lazy(() => import('./features/auth/Register'));
const ForgotPassword = lazy(() => import('./features/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./features/auth/ResetPassword'));
const EmailVerification = lazy(() => import('./features/auth/EmailVerification'));
const Unauthorized = lazy(() => import('./features/auth/ErrorPages').then((m) => ({ default: m.Unauthorized })));
const Forbidden = lazy(() => import('./features/auth/ErrorPages').then((m) => ({ default: m.Forbidden })));
const SessionExpired = lazy(() => import('./features/auth/ErrorPages').then((m) => ({ default: m.SessionExpired })));

// Auto Scroll To Top on Route Changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Live Toast Notification Alert Simulator (Nagpur activity simulation)
const LiveNotifier: React.FC = () => {
  const { showToast } = useToast();

  useEffect(() => {
    const alertMessages = [
      'Someone in Wardha Road just ordered an Iced Raspberry Matcha!',
      'Someone near Ajni Metro Station just reserved a Table in the Balcony zone!',
      'Someone in Samarth Nagar just ordered a Korean Paneer UFO Burger!',
      'Someone just reserved Table #3 in our Cozy Book Nook!',
      'Someone in Ajni Chowk just ordered a Custard Cream Taiyaki!',
      'Someone just ordered a Spicy Tofu Ramen bowl!'
    ];

    const delayTimer = setTimeout(() => {
      showToast(alertMessages[0], 'info', 5000);
    }, 10000);

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * alertMessages.length);
      showToast(alertMessages[idx], 'info', 5000);
    }, 45000);

    return () => {
      clearTimeout(delayTimer);
      clearInterval(interval);
    };
  }, [showToast]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <LiveNotifier />
              <ScrollToTop />
              <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
                <Navbar />
                <main className="flex-1">
                  <Suspense
                    fallback={
                      <div className="pt-28 pb-24 max-w-7xl mx-auto px-6 md:px-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <SkeletonCard />
                          <SkeletonCard />
                          <SkeletonCard />
                        </div>
                      </div>
                    }
                  >
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/gallery" element={<Gallery />} />
                      <Route path="/track/:orderId" element={<TrackOrder />} />

                      {/* Guest-only auth routes */}
                      <Route path="/login" element={<ProtectedRoute guestOnly><Login /></ProtectedRoute>} />
                      <Route path="/register" element={<ProtectedRoute guestOnly><Register /></ProtectedRoute>} />
                      <Route path="/forgot-password" element={<ProtectedRoute guestOnly><ForgotPassword /></ProtectedRoute>} />
                      
                      {/* Regular auth handling paths */}
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify-email" element={<EmailVerification />} />
                      <Route path="/unauthorized" element={<Unauthorized />} />
                      <Route path="/forbidden" element={<Forbidden />} />
                      <Route path="/session-expired" element={<SessionExpired />} />

                      {/* Protected Customer Routes */}
                      <Route path="/reserve" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><Reserve /></ProtectedRoute>} />
                      <Route path="/checkout" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><Checkout /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><Profile /></ProtectedRoute>} />

                      <Route path="*" element={<Home />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
