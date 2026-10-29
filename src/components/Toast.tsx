import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface ToastOptions {
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

const ToastContext = createContext<(t: ToastOptions) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<number>(undefined);

  const show = useCallback((t: ToastOptions) => {
    window.clearTimeout(timer.current);
    const id = Date.now();
    setToast({ ...t, id });
    timer.current = window.setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), t.duration ?? 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div className="toast-region" role="status" aria-live="polite">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                className="toast"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              >
                <span>{toast.message}</span>
                {toast.action && (
                  <button
                    className="toast-action"
                    onClick={() => {
                      toast.action!.onClick();
                      setToast(null);
                    }}
                  >
                    {toast.action.label}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
