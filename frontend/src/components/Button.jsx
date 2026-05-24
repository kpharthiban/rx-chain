export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const variants = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 hover:shadow-md hover:shadow-brand-600/30",
    secondary:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20",
    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20",
    warning:
      "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  );
}
