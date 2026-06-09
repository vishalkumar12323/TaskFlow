import { useState, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  remove: (id: string) => void;
}

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export const ToastContainer = ({ toasts, remove }: ToastContainerProps) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
        <span style={{ fontWeight: 700 }}>{ICONS[t.type]}</span>
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const add = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    timerRef.current[id] = setTimeout(() => remove(id), duration);
  };

  const remove = (id: string) => {
    clearTimeout(timerRef.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    remove,
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    info: (msg: string) => add(msg, 'info'),
  };
};
