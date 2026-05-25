export default function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 ${
        hover
          ? "transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
