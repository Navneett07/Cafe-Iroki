import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Calendar,
  Users, CreditCard, Tag, Star, Image, Settings, FileText,
  Bell, Shield, LogOut, ChevronLeft, ChevronRight,
  Coffee, Menu as MenuIcon, X
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { NotificationBell } from './NotificationBell';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Orders', icon: ShoppingBag, path: '/orders' },
  { label: 'Menu', icon: UtensilsCrossed, path: '/menu' },
  { label: 'Reservations', icon: Calendar, path: '/reservations' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Coupons', icon: Tag, path: '/coupons' },
  { label: 'Reviews', icon: Star, path: '/reviews' },
  { label: 'Media', icon: Image, path: '/media' },
  { label: 'Reports', icon: FileText, path: '/reports' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Audit Logs', icon: Shield, path: '/audit-logs' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const SidebarContent: React.FC<{ collapsed: boolean; onLinkClick?: () => void }> = ({ collapsed, onLinkClick }) => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[--color-border] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
          <Coffee size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-bold text-[--color-text-primary]">Cafe Iroki</p>
              <p className="text-[10px] text-[--color-text-muted] uppercase tracking-widest">Admin Portal</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={17} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`border-t border-[--color-border] px-3 py-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 text-brand-400 text-xs font-bold">
          {adminUser?.name?.charAt(0).toUpperCase() ?? 'A'}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 overflow-hidden min-w-0"
            >
              <p className="text-xs font-semibold text-[--color-text-primary] truncate">{adminUser?.name}</p>
              <p className="text-[10px] text-[--color-text-muted] truncate">{adminUser?.email}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[--color-text-muted] hover:text-red-400 transition-colors flex-shrink-0"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
};

export const AdminSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => (
  <>
    {/* Desktop sidebar */}
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="hidden lg:flex flex-col h-screen fixed top-0 left-0 z-30 bg-[--color-surface-800] border-r border-[--color-border] overflow-hidden"
    >
      <SidebarContent collapsed={collapsed} />
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3.5 top-20 w-7 h-7 rounded-full bg-[--color-surface-700] border border-[--color-border] flex items-center justify-center hover:bg-[--color-surface-600] transition-colors z-50 shadow-lg"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} className="text-[--color-text-secondary]" /> : <ChevronLeft size={14} className="text-[--color-text-secondary]" />}
      </button>
    </motion.aside>

    {/* Mobile overlay */}
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onMobileClose}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed top-0 left-0 z-50 h-screen w-[260px] bg-[--color-surface-800] border-r border-[--color-border] lg:hidden"
          >
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-[--color-text-secondary]"
            >
              <X size={18} />
            </button>
            <SidebarContent collapsed={false} onLinkClick={onMobileClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
);

interface HeaderProps {
  collapsed: boolean;
  onMobileMenuToggle: () => void;
  title: string;
}

export const AdminHeader: React.FC<HeaderProps> = ({ collapsed, onMobileMenuToggle, title }) => (
  <header
    className="fixed top-0 right-0 z-20 flex items-center gap-4 px-6 border-b border-[--color-border] bg-[--color-surface-900]/80 backdrop-blur-xl transition-all duration-300"
    style={{
      left: 0,
      height: 'var(--header-height)',
      paddingLeft: `calc(var(--header-height) * 0 + ${collapsed ? '72px' : '260px'} + 1.5rem)`,
    }}
  >
    <button
      onClick={onMobileMenuToggle}
      className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-[--color-text-secondary]"
    >
      <MenuIcon size={18} />
    </button>
    <h1 className="text-base font-semibold text-[--color-text-primary] truncate">{title}</h1>
    <div className="ml-auto flex items-center gap-2">
      <NotificationBell />
    </div>
  </header>
);

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[--color-surface-900]">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <AdminHeader
        collapsed={collapsed}
        onMobileMenuToggle={() => setMobileOpen(true)}
        title={title}
      />
      <main
        className="transition-all duration-300 min-h-screen pt-[--header-height]"
        style={{ paddingLeft: collapsed ? '72px' : '260px' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
