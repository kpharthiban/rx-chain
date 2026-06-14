import { useEffect, useState, useRef } from "react";
import { CheckCircle, Loader2, X, XCircle } from "lucide-react";

export default function TxStatus({ status, message }) {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status) {
      setVisible(true);
      setDismissing(false);
    } else {
      setVisible(false);
    }
  }, [status, message]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (visible && (status === "confirmed" || status === "failed")) {
      requestAnimationFrame(() => setDismissing(true));
      timerRef.current = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timerRef.current);
    }
  }, [visible, status]);

  if (!visible || !status) return null;

  const config = {
    pending: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-800",
      icon: <Loader2 size={16} className="animate-spin text-amber-600" />,
      label: "Processing...",
      progressColor: "bg-amber-400",
    },
    confirmed: {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      icon: <CheckCircle size={16} className="text-emerald-600" />,
      label: "Success",
      progressColor: "bg-emerald-400",
    },
    failed: {
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-800",
      icon: <XCircle size={16} className="text-red-600" />,
      label: "Failed",
      progressColor: "bg-red-400",
    },
  };

  const c = config[status] || config.pending;

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm animate-slide-up">
      <div
        className={`relative overflow-hidden rounded-xl border px-4 py-3 shadow-lg ${c.border} ${c.bg} ${c.text}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">{c.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{c.label}</span>
            <p className="mt-0.5 text-sm break-words">{message}</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        {(status === "confirmed" || status === "failed") && (
          <div
            className={`absolute bottom-0 left-0 h-0.5 ${c.progressColor} transition-all duration-[5000ms] ease-linear`}
            style={{ width: dismissing ? "0%" : "100%" }}
          />
        )}
      </div>
    </div>
  );
}
