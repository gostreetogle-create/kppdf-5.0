'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  toast: (variant: ToastVariant, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; styles: string }> = {
  success: {
    icon: CheckCircle2,
    styles: 'border-success bg-success/10 text-success',
  },
  error: {
    icon: AlertCircle,
    styles: 'border-destructive bg-destructive/10 text-destructive',
  },
  info: {
    icon: Info,
    styles: 'border-info bg-info/10 text-info',
  },
  warning: {
    icon: AlertTriangle,
    styles: 'border-warning bg-warning/10 text-warning',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, variant, message }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => {
            const config = variantConfig[t.variant];
            const Icon = config.icon;
            return (
              <div
                key={t.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm',
                  'animate-in slide-in-from-right-full fade-in',
                  config.styles,
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{t.message}</span>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
