export default function Badge({ children, type = "default" }) {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    active: "bg-emerald-100 text-emerald-700",
    approved: "bg-emerald-100 text-emerald-700",
    valid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    dispensed: "bg-blue-100 text-blue-700",
    revoked: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-orange-100 text-orange-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[type] || styles.default}`}>
      {children}
    </span>
  );
}