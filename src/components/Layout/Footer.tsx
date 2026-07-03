import React from 'react';
import { Link } from 'react-router-dom';
import { CAFE_METADATA } from '../../constants';
import { MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-secondary text-text-primary border-t border-border-subtle py-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Block */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex flex-col items-start select-none">
            <span className="font-serif text-2xl tracking-widest font-extrabold uppercase text-text-primary flex items-center gap-1.5">
              <span>IROKI</span>
              <span className="text-accent-gold text-sm leading-none">いろき</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">
              Nagpur Premium Cafe
            </span>
          </Link>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xs mt-2">
            Experience Japanese Café Culture in Nagpur. Where traditional minimalism meets specialty coffee craft and artisan UFO Burgers.
          </p>
          {/* Social Row */}
          <div className="flex items-center gap-4 mt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-bg-primary hover:bg-brand-primary hover:text-white rounded-full border border-border-subtle transition-all active:scale-95"
              aria-label="Instagram Profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-bg-primary hover:bg-brand-primary hover:text-white rounded-full border border-border-subtle transition-all active:scale-95"
              aria-label="Facebook Profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
        </div>

        {/* Cafe Information */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Visit Us
          </h4>
          <ul className="space-y-3.5 text-xs text-text-primary">
            <li className="flex items-start gap-2.5 leading-relaxed">
              <MapPin size={16} className="text-brand-primary flex-shrink-0 mt-0.5" />
              <span>
                {CAFE_METADATA.address.street},<br />
                {CAFE_METADATA.address.city}, {CAFE_METADATA.address.state} - {CAFE_METADATA.address.pincode}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="text-brand-primary flex-shrink-0" />
              <a href={`tel:${CAFE_METADATA.phone}`} className="hover:underline">
                {CAFE_METADATA.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock size={16} className="text-brand-primary flex-shrink-0" />
              <span>{CAFE_METADATA.workingHours}</span>
            </li>
          </ul>
        </div>

        {/* Discover Sitemap */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Discover
          </h4>
          <ul className="space-y-2.5 text-xs font-semibold">
            <li>
              <Link to="/menu" className="text-text-secondary hover:text-brand-primary transition-colors flex items-center gap-1">
                <span>Explore Full Menu</span>
                <ArrowUpRight size={12} className="opacity-60" />
              </Link>
            </li>
            <li>
              <Link to="/reserve" className="text-text-secondary hover:text-brand-primary transition-colors flex items-center gap-1">
                <span>Book a Seating Table</span>
                <ArrowUpRight size={12} className="opacity-60" />
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="text-text-secondary hover:text-brand-primary transition-colors flex items-center gap-1">
                <span>Photo Gallery & Vibe</span>
                <ArrowUpRight size={12} className="opacity-60" />
              </Link>
            </li>

          </ul>
        </div>

        {/* Nagpur Maps Widget Shortcut */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Quick Route
          </h4>
          <div className="rounded-md overflow-hidden h-32 border border-border-subtle bg-bg-primary relative group">
            {/* Visual map representation with navigational link */}
            <div className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 dark:invert" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=40')" }}>
              <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-brand-dark/10 transition-colors" />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${CAFE_METADATA.coordinates.lat},${CAFE_METADATA.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center z-10"
            >
              <span className="text-[10px] uppercase font-bold text-white bg-brand-primary py-1 px-3.5 rounded shadow-premium-sm active:scale-95 transition-all">
                Navigate to Cafe
              </span>
              <span className="text-[9px] text-white/95 drop-shadow-sm font-semibold truncate max-w-[180px]">
                Samarth Nagar Nagpur
              </span>
            </a>
          </div>
        </div>

      </div>

      {/* Copy row */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-border-subtle/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-text-secondary">
        <p>© {currentYear} Cafe Iroki Nagpur. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <span className="cursor-help hover:text-brand-primary">Privacy Policy</span>
          <span className="cursor-help hover:text-brand-primary">Terms of Service</span>
          <span className="text-accent-gold">Identifies as Women-Owned • LGBTQ+ Friendly</span>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
