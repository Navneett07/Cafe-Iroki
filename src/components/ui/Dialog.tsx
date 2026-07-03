import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}) => {
  const iconMap = {
    info: <Info className="h-6 w-6 text-brand-primary" />,
    success: <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />,
    warning: <AlertCircle className="h-6 w-6 text-amber-500" />,
    danger: <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-500" />,
  };

  const confirmButtonVariant = variant === 'danger' ? 'primary' : 'secondary';
  const confirmButtonColorClass = variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white ring-rose-500' : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col gap-4">
        {/* Icon & Title Row */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{iconMap[variant]}</div>
          <div>
            <h4 className="text-lg font-serif font-semibold text-text-primary leading-6">
              {title}
            </h4>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Buttons Action Row */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border-subtle">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className={confirmButtonColorClass}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
