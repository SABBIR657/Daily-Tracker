import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Dumbbell,
  Footprints,
  CheckSquare,
  Settings,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import dayjs from "dayjs";
import { getAnalytics, getLogs } from "../api/logs";
import { getTodoSummary } from "../api/todos";
import useAuthStore from "../stores/authStore";
import StatCard from "../components/ui/StatCard";
import Heatmap from "../components/charts/Heatmap";
import GoalsModal from "../components/ui/GoalsModal";

const PERIODS = ["week", "month", "year"];

export default function Dashboard() {
  const [period, setPeriod] = useState("week");
  const [showGoals, setShowGoals] = useState(false); // ✅ moved inside component
  const user = useAuthStore((s) => s.user);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["analytics", period],
    queryFn: () => getAnalytics(period).then((r) => r.data),
    staleTime: 0, // always refetch when switching to dashboard
  });

  const { data: todoSummary } = useQuery({
    queryKey: ["todoSummary", period],
    queryFn: () => getTodoSummary(period).then((r) => r.data),
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["recentLogs"],
    queryFn: () => getLogs({ limit: 7 }).then((r) => r.data),
  });

  const subjectChartData = analytics
    ? Object.entries(analytics.study.bySubject).map(([name, mins]) => ({
        name,
        hours: Math.round((mins / 60) * 10) / 10,
      }))
    : [];

  const typeColors = { study: "#6366f1", run: "#10b981", workout: "#f59e0b" };

  if (loadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Goals Modal */}
      {showGoals && <GoalsModal onClose={() => setShowGoals(false)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {dayjs().format("dddd, MMMM D")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {/* Goals button */}
          <button
            onClick={() => setShowGoals(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Settings size={15} />
            Set goals
          </button>

          {/* Period selector */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  period === p
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Study hours"
          value={`${analytics?.study.totalHours ?? 0}h`}
          sub={`${analytics?.study.totalSessions ?? 0} sessions`}
          icon={BookOpen}
          color="study"
        />
        <StatCard
          label="Km run"
          value={`${analytics?.run.totalKm ?? 0} km`}
          sub={`${analytics?.run.totalSessions ?? 0} runs`}
          icon={Footprints}
          color="run"
        />
        <StatCard
          label="Workout days"
          value={analytics?.workout.totalDays ?? 0}
          sub={`${analytics?.workout.totalSessions ?? 0} sessions`}
          icon={Dumbbell}
          color="workout"
        />
        <StatCard
          label="Tasks done"
          value={todoSummary?.done ?? 0}
          sub={`${todoSummary?.pending ?? 0} pending · ${todoSummary?.overdue ?? 0} overdue`}
          icon={CheckSquare}
          color="primary"
        />
      </div>

      {/* Goals vs Actuals */}
      {user?.goals && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Goals vs Actuals ({period})
            </h3>
            <button
              onClick={() => setShowGoals(true)}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 transition-colors"
            >
              <Settings size={12} />
              Edit goals
            </button>
          </div>
          <div className="space-y-3">
            <GoalBar
              label="Study"
              actual={analytics?.study.totalHours ?? 0}
              goal={user.goals.studyHours}
              unit="hrs"
              color="bg-indigo-500"
            />
            <GoalBar
              label="Running"
              actual={analytics?.run.totalKm ?? 0}
              goal={user.goals.runKm}
              unit="km"
              color="bg-emerald-500"
            />
            <GoalBar
              label="Workouts"
              actual={analytics?.workout.totalDays ?? 0}
              goal={user.goals.workoutDays}
              unit="days"
              color="bg-amber-500"
            />
          </div>
        </div>
      )}

      {/* Study by subject chart + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Study by subject
          </h3>
          {subjectChartData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
              No study logs yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectChartData} barSize={28}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  unit="h"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  formatter={(v) => [`${v} hrs`, "Study time"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {subjectChartData.map((_, i) => (
                    <Cell key={i} fill="#6366f1" opacity={0.8 - i * 0.1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Recent activity
          </h3>
          {!recentLogs?.length ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
              No activity yet — start logging!
            </p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: typeColors[log.type] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {log.type === "study"
                        ? `${log.subject} — ${log.topic}`
                        : log.type === "run"
                          ? `Run ${log.distance} km`
                          : `${log.workoutType} workout`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {log.duration} min · {dayjs(log.date).format("MMM D")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <Heatmap data={analytics?.heatmap ?? {}} />
    </div>
  );
}

// ---- helpers ----

function GoalBar({ label, actual, goal, unit, color }) {
  const pct = Math.min((actual / goal) * 100, 100);
  const over = actual >= goal;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
        <span
          className={`text-xs font-semibold ${over ? "text-emerald-500" : "text-gray-500 dark:text-gray-400"}`}
        >
          {actual} / {goal} {unit} {over && "✓"}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
