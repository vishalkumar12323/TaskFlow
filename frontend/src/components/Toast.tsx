import type { Toast } from "./toast";

interface ToastContainerProps {
  toasts: Toast[];
  remove: (id: string) => void;
}

const ICONS = { success: "✓", error: "✕", info: "ℹ" };

export const ToastContainer = ({ toasts, remove }: ToastContainerProps) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`toast toast-${t.type}`}
        onClick={() => remove(t.id)}
      >
        <span style={{ fontWeight: 700 }}>{ICONS[t.type]}</span>
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);
