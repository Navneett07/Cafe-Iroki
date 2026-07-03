import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { OrderDrawer } from '../../features/ordering/OrderDrawer';
import { NotificationBell } from './NotificationBell';
import { Menu, X, Sun, Moon, Volume2, VolumeX, ShoppingBag } from 'lucide-react';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Menu', path: '/menu' },
  { name: 'Reservation', path: '/reserve' },
  { name: 'Gallery', path: '/gallery' },
];

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const location = useLocation();
  const { cartItems } = useCart();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Theme from matchMedia
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync scroll positions for navigation shrink
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on path transition
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle music player
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-ambient-lounge-sound-2559.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Low ambient sound
    }

    if (isMusicPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Audio play auto-blocked by browser policies', err);
        setIsMusicPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isMusicPlaying]);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleMusic = () => {
    setIsMusicPlaying((prev) => !prev);
  };

  const totalCartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 font-sans ${
          isScrolled
            ? 'glassmorphism shadow-premium-md py-3'
            : 'bg-transparent py-5 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between">
          {/* Logo Brand */}
          <Link to="/" className="flex flex-col items-start select-none">
            <span className="font-serif text-xl tracking-widest font-extrabold uppercase text-text-primary flex items-center gap-1.5">
              <span>IROKI</span>
              <span className="text-accent-gold text-xs leading-none">いろき</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-text-secondary -mt-1 font-bold">
              Nagpur Premium Cafe
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-xs uppercase tracking-widest transition-colors duration-300 font-bold hover:text-brand-primary ${
                  location.pathname === link.path ? 'text-brand-primary' : 'text-text-secondary'
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <span className="absolute bottom-[-6px] left-0 right-0 h-[1.5px] bg-brand-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Ambient Sound Trigger */}
            <button
              onClick={toggleMusic}
              className={`p-2 rounded-full border border-border-subtle/50 text-text-primary transition-all active:scale-90 hover:bg-border-subtle/20 relative ${
                isMusicPlaying ? 'bg-accent-gold/10 border-accent-gold/40' : 'bg-transparent'
              }`}
              title="Toggle Japanese Ambient Loop"
              aria-label="Toggle Japanese Ambient Loop"
            >
              {isMusicPlaying ? (
                <>
                  <Volume2 size={16} className="text-brand-primary" />
                  <span className="absolute inset-0 rounded-full border border-accent-gold animate-ping opacity-60 pointer-events-none" />
                </>
              ) : (
                <VolumeX size={16} className="text-text-secondary" />
              )}
            </button>

            {/* Dark/Light Switch */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-border-subtle/50 text-text-primary transition-all active:scale-90 hover:bg-border-subtle/20 bg-transparent"
              title="Toggle Theme"
              aria-label="Toggle dark and light theme mode"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Realtime Notifications */}
            <NotificationBell />

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 rounded-full border border-border-subtle/50 text-text-primary transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-border-subtle/20 hover:text-brand-primary bg-transparent relative"
              title="Open Shopping Cart"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag size={21} />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-accent-warm text-white text-[8px] font-bold flex items-center justify-center animate-bounce shadow-premium-sm">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden rounded-full border border-border-subtle/50 text-text-primary transition-all active:scale-90 bg-transparent"
              aria-label="Toggle mobile navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[100%] left-0 right-0 glassmorphism border-b border-border-subtle animate-fadeIn p-6 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs uppercase tracking-widest py-2 font-bold hover:text-brand-primary transition-colors ${
                  location.pathname === link.path ? 'text-brand-primary' : 'text-text-secondary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Slide Cart Drawer */}
      <OrderDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          // Standard router navigation to checkout path
          window.location.hash = '#/checkout'; // We'll configure HashRouter or fallback inside App.tsx
        }}
      />
    </>
  );
};
export default Navbar;
