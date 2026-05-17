export default function TxStatus({ status, message }) {
  if (!status) return null;

  const styles = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    failed: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${styles[status]}`}>
      <strong className="capitalize">{status}:</strong> {message}
    </div>
  );
}