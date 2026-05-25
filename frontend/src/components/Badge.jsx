export default function Badge({ children, type = "default" }) {
  const styles = {
    default: "bg-slate-100 text-slate-600 ring-slate-200",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    valid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200 animate-pulse-slow",
    dispensed: "bg-sky-50 text-sky-700 ring-sky-200",
    revoked: "bg-red-50 text-red-700 ring-red-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    expired: "bg-orange-50 text-orange-700 ring-orange-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[type] || styles.default
      }`}
    >
      {children}
    </span>
  );
}
