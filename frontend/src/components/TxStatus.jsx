import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function TxStatus({ status, message }) {
  if (!status) return null;

  const config = {
    pending: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-800",
      icon: <Loader2 size={16} className="animate-spin text-amber-600" />,
      label: "Pending",
    },
    confirmed: {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      icon: <CheckCircle size={16} className="text-emerald-600" />,
      label: "Confirmed",
    },
    failed: {
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-800",
      icon: <XCircle size={16} className="text-red-600" />,
      label: "Failed",
    },
  };

  const c = config[status] || config.pending;

  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-slide-up ${c.border} ${c.bg} ${c.text}`}
    >
      <span className="mt-0.5 shrink-0">{c.icon}</span>
      <div>
        <span className="font-semibold">{c.label}:</span> {message}
      </div>
    </div>
  );
}
