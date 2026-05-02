export default function Badge({ label, variant = "default" }) {
  const variants = {
    default: "bg-gray-100  dark:bg-gray-800 text-gray-600 dark:text-gray-300",
    study:
      "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    run: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    workout:
      "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    high: "bg-red-100   dark:bg-red-500/20   text-red-600   dark:text-red-400",
    medium:
      "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    low: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
    done: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
    pending: "bg-gray-100  dark:bg-gray-800 text-gray-500 dark:text-gray-400",
    "in-progress":
      "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}
    >
      {label}
    </span>
  );
}
