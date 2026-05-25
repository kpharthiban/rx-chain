export default function StatCard({ label, value, icon, color = "brand" }) {
  const colors = {
    brand: "text-brand-600 bg-brand-50",
    emerald: "text-emerald-600 bg-emerald-50",
    sky: "text-sky-600 bg-sky-50",
    red: "text-red-600 bg-red-50",
    amber: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="group rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
            colors[color] || colors.brand
          } transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 sm:mt-3 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
