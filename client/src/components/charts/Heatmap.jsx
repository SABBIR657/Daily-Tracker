import dayjs from "dayjs";

export default function Heatmap({ data = {} }) {
  // Build last 91 days (13 weeks)
  const days = [];
  for (let i = 90; i >= 0; i--) {
    const date = dayjs().subtract(i, "day");
    const key = date.format("YYYY-MM-DD");
    days.push({ date, key, minutes: data[key] || 0 });
  }

  // Pad start so week columns align to Monday
  const firstDayOfWeek = days[0].date.day(); // 0=Sun
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const getColor = (minutes) => {
    if (minutes === 0) return "bg-gray-100 dark:bg-gray-800";
    if (minutes < 30) return "bg-primary-100 dark:bg-primary-900";
    if (minutes < 60) return "bg-primary-200 dark:bg-primary-700";
    if (minutes < 120) return "bg-primary-400 dark:bg-primary-500";
    return "bg-primary-600 dark:bg-primary-400";
  };

  const weeks = [];
  const allCells = [...Array(paddingDays).fill(null), ...days];

  for (let i = 0; i < allCells.length; i += 7) {
    weeks.push(allCells.slice(i, i + 7));
  }

  const dayLabels = ["Mon", "Wed", "Fri"];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Activity — last 13 weeks
      </h3>
      <div className="flex gap-1">
        {/* Day labels */}
        <div
          className="flex flex-col justify-between pr-1 py-0.5"
          style={{ gap: "2px" }}
        >
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <span
              key={i}
              className="text-xs text-gray-400 dark:text-gray-600 h-3 leading-3"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) =>
                day === null ? (
                  <div key={di} className="w-3 h-3 rounded-sm" />
                ) : (
                  <div
                    key={di}
                    title={`${day.key}: ${day.minutes} min`}
                    className={`w-3 h-3 rounded-sm cursor-default transition-opacity hover:opacity-75 ${getColor(day.minutes)}`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">Less</span>
        {[
          "bg-gray-100 dark:bg-gray-800",
          "bg-primary-100 dark:bg-primary-900",
          "bg-primary-200 dark:bg-primary-700",
          "bg-primary-400 dark:bg-primary-500",
          "bg-primary-600 dark:bg-primary-400",
        ].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-gray-400 dark:text-gray-500">More</span>
      </div>
    </div>
  );
}
