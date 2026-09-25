import { useCallback, useMemo, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    const timeout = timerRef.current[id];
    if (timeout) {
      clearTimeout(timeout);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      timerRef.current[id] = setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  return useMemo(
    () => ({
      toasts,
      remove,
      success: (msg: string) => add(msg, "success"),
      error: (msg: string) => add(msg, "error"),
      info: (msg: string) => add(msg, "info"),
    }),
    [add, remove, toasts],
  );
};
