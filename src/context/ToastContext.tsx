import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = `toast-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const iconMap = {
    success: <CheckCircle2 className="text-green-500 h-5 w-5 flex-shrink-0" />,
    warning: <AlertTriangle className="text-amber-500 h-5 w-5 flex-shrink-0" />,
    error: <ShieldAlert className="text-rose-500 h-5 w-5 flex-shrink-0" />,
    info: <Info className="text-accent-gold h-5 w-5 flex-shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Toasts Portal */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glassmorphism w-full p-4 rounded-md shadow-premium-lg flex items-center justify-between gap-3 pointer-events-auto border-l-4 border-l-brand-primary"
              style={{
                borderLeftColor:
                  toast.type === 'success'
                    ? '#16a34a'
                    : toast.type === 'error'
                    ? '#e11d48'
                    : toast.type === 'warning'
                    ? '#f59e0b'
                    : '#C5A880',
              }}
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {iconMap[toast.type]}
                <p className="text-xs font-sans font-medium text-text-primary truncate">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-border-subtle/30 transition-colors active:scale-90"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
