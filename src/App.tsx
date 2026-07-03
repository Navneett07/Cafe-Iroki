import React, { lazy, Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonCard } from './components/ui/Skeleton';

// Route Lazy Loading & Code Splitting
const Home = lazy(() => import('./features/home/Home'));
const Menu = lazy(() => import('./features/menu/Menu'));
const Reserve = lazy(() => import('./features/reservation/Reserve'));
const Gallery = lazy(() => import('./features/gallery/Gallery'));
const Checkout = lazy(() => import('./features/ordering/Checkout'));
const TrackOrder = lazy(() => import('./features/ordering/TrackOrder'));

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

    // Fire first notify after 10s, then periodically
    const delayTimer = setTimeout(() => {
      showToast(alertMessages[0], 'info', 5000);
    }, 10000);

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * alertMessages.length);
      showToast(alertMessages[idx], 'info', 5000);
    }, 45000); // Fire every 45 seconds

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
              {/* Background notification simulator */}
              <LiveNotifier />
              
              {/* Scroll controller */}
              <ScrollToTop />

              {/* Shell Layout wrapper */}
              <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
                <Navbar />

                {/* Main Suspended views */}
                <main className="flex-1">
                  <Suspense
                    fallback={
                      <div className="pt-28 pb-24 max-w-7xl mx-auto px-6 md:px-12">
                        {/* Elegant loading placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <SkeletonCard />
                          <SkeletonCard />
                          <SkeletonCard />
                        </div>
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/reserve" element={<Reserve />} />
                      <Route path="/gallery" element={<Gallery />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/track/:orderId" element={<TrackOrder />} />
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
