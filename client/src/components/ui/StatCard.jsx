export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "primary",
}) {
  const colors = {
    primary: "bg-primary-50 dark:bg-primary-500/10 text-primary-500",
    study: "bg-indigo-50  dark:bg-indigo-500/10  text-indigo-500",
    run: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500",
    workout: "bg-amber-50   dark:bg-amber-500/10   text-amber-500",
    red: "bg-red-50     dark:bg-red-500/10     text-red-500",
  };

  return (
    <div className="card flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
