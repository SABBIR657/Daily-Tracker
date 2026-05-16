import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { BookOpen, Plus, Trash2, Clock, X } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { getLogs, createLog, deleteLog } from "../api/logs";
import { getSubjects } from "../api/subjects";
import Badge from "../components/ui/Badge";
import { RotateCcw } from "lucide-react";
import { getDueRevisions } from "../api/revisions";
import { Timer } from "lucide-react";
import PomodoroTimer from "../components/ui/PomodoroTimer";

export default function Study() {
  const [showForm, setShowForm] = useState(false);
  const [studyTab, setStudyTab] = useState("logs");
  const queryClient = useQueryClient();
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroData, setPomodoroData] = useState(null);

  const { data: dueRevisions = [] } = useQuery({
    queryKey: ["revisions", "due"],
    queryFn: () => getDueRevisions().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { date: dayjs().format("YYYY-MM-DD") },
  });

  useEffect(() => {
    if (pomodoroData) {
      reset({
        date: dayjs().format("YYYY-MM-DD"),
        duration: pomodoroData.duration,
      });
      setPomodoroData(null);
      setShowForm(true);
    }
  }, [pomodoroData]);

  // Fetch study logs only
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs", "study"],
    queryFn: () => getLogs({ type: "study", limit: 50 }).then((r) => r.data),
  });

  // Fetch subjects for the quick-pick dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => getSubjects().then((r) => r.data),
  });

  const { mutate: addLog, isPending } = useMutation({
    mutationFn: createLog,
    onSuccess: () => {
      toast.success("Study session logged!");
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["recentLogs"] });
      reset({ date: dayjs().format("YYYY-MM-DD") });
      setShowForm(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to log session"),
  });

  const { mutate: removeLog } = useMutation({
    mutationFn: deleteLog,
    onSuccess: () => {
      toast.success("Log deleted");
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const onSubmit = (data) => {
    // Parse date as local time, not UTC
    const [year, month, day] = data.date.split("-");
    const localDate = new Date(year, month - 1, day, 12, 0, 0); // noon local time

    addLog({
      ...data,
      type: "study",
      duration: Number(data.duration),
      date: localDate.toISOString(),
    });
  };

  // Group logs by date for display
  const grouped = logs.reduce((acc, log) => {
    const day = dayjs(log.date).format("YYYY-MM-DD");
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Study Tracker
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {logs.length} sessions logged
          </p>
        </div>
        {/* Pomodoro Timer */}
        {showPomodoro && studyTab === "logs" && (
          <PomodoroTimer
            onClose={() => setShowPomodoro(false)}
            onSessionComplete={(minutes) => {
              setPomodoroData({ duration: minutes });
              setShowPomodoro(false);
            }}
          />
        )}
        {studyTab === "logs" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPomodoro((v) => !v)}
              className={`btn-secondary flex items-center gap-2 ${
                showPomodoro ? "ring-2 ring-primary-500" : ""
              }`}
            >
              <Timer size={15} />
              Pomodoro
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="btn-primary flex items-center gap-2"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Cancel" : "Log session"}
            </button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setStudyTab("logs")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            studyTab === "logs"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <BookOpen size={14} /> Study Logs
        </button>
        <button
          onClick={() => setStudyTab("revision")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            studyTab === "revision"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <RotateCcw size={14} />
          Due Revisions
          {dueRevisions.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {dueRevisions.length}
            </span>
          )}
        </button>
      </div>

      {studyTab === "logs" && (
        <>
          {/* Log Form */}
          {showForm && (
            <div className="card border-primary-200 dark:border-primary-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                New study session
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    {subjects.length > 0 ? (
                      <select
                        {...register("subject", {
                          required: "Subject is required",
                        })}
                        className="input"
                      >
                        <option value="">Select subject</option>
                        {subjects.map((s) => (
                          <option key={s._id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <input
                        {...register("subject", {
                          required: "Subject is required",
                        })}
                        placeholder="e.g. Mathematics"
                        className="input"
                      />
                    )}
                    {errors.subject && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Topic
                    </label>
                    <input
                      {...register("topic", { required: "Topic is required" })}
                      placeholder="e.g. Integration"
                      className="input"
                    />
                    {errors.topic && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.topic.message}
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      {...register("duration", {
                        required: "Duration is required",
                        min: { value: 1, message: "Must be at least 1 minute" },
                      })}
                      type="number"
                      placeholder="90"
                      className="input"
                    />
                    {errors.duration && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.duration.message}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      {...register("date", { required: "Date is required" })}
                      type="date"
                      className="input"
                    />
                    {errors.date && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    {...register("notes")}
                    placeholder="What did you cover? Any key takeaways?"
                    rows={3}
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary"
                  >
                    {isPending ? "Saving..." : "Save session"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Session History */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen
                size={40}
                className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No study sessions yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Hit "Log session" to record your first one
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped)
                .sort(([a], [b]) => (a < b ? 1 : -1))
                .map(([day, dayLogs]) => (
                  <div key={day}>
                    {/* Date header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {dayjs(day).isToday()
                          ? "Today"
                          : dayjs(day).isYesterday()
                            ? "Yesterday"
                            : dayjs(day).format("dddd, MMM D")}
                      </span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {dayLogs.reduce((s, l) => s + l.duration, 0)} min total
                      </span>
                    </div>

                    {/* Logs for that day */}
                    <div className="space-y-2">
                      {dayLogs.map((log) => (
                        <div
                          key={log._id}
                          className="card flex items-start gap-3 py-3 px-4 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                        >
                          <div className="w-1 self-stretch rounded-full bg-indigo-400 shrink-0" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {log.subject}
                              </span>
                              <Badge label={log.topic} variant="study" />
                            </div>
                            {log.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {log.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                              <Clock size={12} />
                              {log.duration} min
                            </div>
                            <button
                              onClick={() => removeLog(log._id)}
                              className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Revision tab */}
      {studyTab === "revision" && (
        <div className="space-y-3">
          {dueRevisions.length === 0 ? (
            <div className="card text-center py-12">
              <RotateCcw
                size={40}
                className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Nothing due for revision today 🎉
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Go to the Revision page to manage your topics
              </p>
            </div>
          ) : (
            dueRevisions.map((rev) => (
              <div
                key={rev._id}
                className="card border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {rev.subject}
                      </span>
                      <Badge label={rev.topic} variant="study" />
                    </div>
                    <p className="text-xs text-amber-500 mt-0.5">
                      {rev.revisionCount}x revised · Due today
                    </p>
                  </div>

                  <a
                    href="/revision"
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Revise
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
