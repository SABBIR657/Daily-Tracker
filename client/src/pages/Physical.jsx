import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Dumbbell,
  Footprints,
  Plus,
  Trash2,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { getLogs, createLog, deleteLog } from "../api/logs";
import Badge from "../components/ui/Badge";

const WORKOUT_TYPES = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "fullbody",
];

export default function Physical() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all | run | workout
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "run",
      date: dayjs().format("YYYY-MM-DD"),
      exercises: [{ name: "", sets: "", reps: "", weight: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  const logType = watch("type");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs", "physical", activeTab],
    queryFn: () =>
      getLogs({
        type: activeTab === "all" ? undefined : activeTab,
        limit: 50,
      }).then((r) => r.data.filter((l) => l.type !== "study")),
  });

  const { mutate: addLog, isPending } = useMutation({
    mutationFn: createLog,
    onSuccess: () => {
      toast.success("Activity logged!");
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      reset({
        type: "run",
        date: dayjs().format("YYYY-MM-DD"),
        exercises: [{ name: "", sets: "", reps: "", weight: "" }],
      });
      setShowForm(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to log activity"),
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
    const payload = {
      type: data.type,
      duration: Number(data.duration),
      date: data.date,
      notes: data.notes,
    };

    if (data.type === "run") {
      payload.distance = Number(data.distance);
    }

    if (data.type === "workout") {
      payload.workoutType = data.workoutType;
      payload.exercises = data.exercises
        .filter((e) => e.name)
        .map((e) => ({
          name: e.name,
          sets: Number(e.sets),
          reps: Number(e.reps),
          weight: Number(e.weight) || 0,
        }));
    }

    addLog(payload);
  };

  // Group by date
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
            Physical Tracker
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {logs.length} activities logged
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Log activity"}
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="card border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            New activity
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Type toggle */}
            <div className="flex gap-2">
              {["run", "workout"].map((t) => (
                <label
                  key={t}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border cursor-pointer text-sm font-medium capitalize transition-colors ${
                    logType === t
                      ? t === "run"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-700 dark:text-emerald-400"
                        : "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/10 dark:border-amber-700 dark:text-amber-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <input
                    {...register("type")}
                    type="radio"
                    value={t}
                    className="hidden"
                  />
                  {t === "run" ? (
                    <Footprints size={16} />
                  ) : (
                    <Dumbbell size={16} />
                  )}
                  {t}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  {...register("duration", {
                    required: "Duration is required",
                    min: { value: 1, message: "At least 1 minute" },
                  })}
                  type="number"
                  placeholder="45"
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
              </div>

              {/* Run — distance */}
              {logType === "run" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Distance (km)
                  </label>
                  <input
                    {...register("distance", {
                      required: "Distance is required",
                      min: { value: 0.1, message: "Must be greater than 0" },
                    })}
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    className="input"
                  />
                  {errors.distance && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.distance.message}
                    </p>
                  )}
                </div>
              )}

              {/* Workout — type */}
              {logType === "workout" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workout type
                  </label>
                  <select
                    {...register("workoutType", {
                      required: "Select a workout type",
                    })}
                    className="input capitalize"
                  >
                    <option value="">Select type</option>
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.workoutType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.workoutType.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Workout — exercises */}
            {logType === "workout" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exercises
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      append({ name: "", sets: "", reps: "", weight: "" })
                    }
                    className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                  >
                    <Plus size={12} /> Add exercise
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <input
                        {...register(`exercises.${index}.name`)}
                        placeholder="Exercise name"
                        className="input col-span-4 text-xs"
                      />
                      <input
                        {...register(`exercises.${index}.sets`)}
                        placeholder="Sets"
                        type="number"
                        className="input col-span-2 text-xs"
                      />
                      <input
                        {...register(`exercises.${index}.reps`)}
                        placeholder="Reps"
                        type="number"
                        className="input col-span-2 text-xs"
                      />
                      <input
                        {...register(`exercises.${index}.weight`)}
                        placeholder="kg"
                        type="number"
                        className="input col-span-3 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="col-span-1 text-gray-300 dark:text-gray-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Weight is optional — enter 0 for bodyweight exercises
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                {...register("notes")}
                placeholder={
                  logType === "run"
                    ? "Morning run, felt great..."
                    : "Increased bench press weight today..."
                }
                rows={2}
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
                {isPending ? "Saving..." : "Save activity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab filter */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 self-start w-fit">
        {["all", "run", "workout"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity History */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <Dumbbell
            size={40}
            className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
          />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No activities logged yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Hit "Log activity" to record your first session
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => (a < b ? 1 : -1))
            .map(([day, dayLogs]) => (
              <div key={day}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {dayjs(day).isToday()
                      ? "Today"
                      : dayjs(day).isYesterday()
                        ? "Yesterday"
                        : dayjs(day).format("dddd, MMM D")}
                  </span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                </div>

                <div className="space-y-2">
                  {dayLogs.map((log) => (
                    <div key={log._id} className="card py-3 px-4">
                      {/* Log header */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            log.type === "run"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {log.type === "run" ? (
                            <Footprints size={16} />
                          ) : (
                            <Dumbbell size={16} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                              {log.type === "run"
                                ? `Run — ${log.distance} km`
                                : `${log.workoutType} workout`}
                            </span>
                            {log.type === "run" && log.duration > 0 && (
                              <Badge
                                label={`${(log.distance / (log.duration / 60)).toFixed(1)} km/h`}
                                variant="run"
                              />
                            )}
                            {log.type === "workout" && (
                              <Badge
                                label={`${log.exercises?.length ?? 0} exercises`}
                                variant="workout"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            <Clock size={11} />
                            {log.duration} min
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {log.type === "workout" &&
                            log.exercises?.length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedId(
                                    expandedId === log._id ? null : log._id,
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                {expandedId === log._id ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </button>
                            )}
                          <button
                            onClick={() => removeLog(log._id)}
                            className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Notes */}
                      {log.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-11">
                          {log.notes}
                        </p>
                      )}

                      {/* Exercises expand */}
                      {expandedId === log._id && log.exercises?.length > 0 && (
                        <div className="mt-3 ml-11 border-t border-gray-100 dark:border-gray-800 pt-3">
                          <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium mb-1 px-1">
                            <span>Exercise</span>
                            <span className="text-center">Sets</span>
                            <span className="text-center">Reps</span>
                            <span className="text-center">Weight</span>
                          </div>
                          {log.exercises.map((ex, i) => (
                            <div
                              key={i}
                              className="grid grid-cols-4 gap-2 text-xs text-gray-700 dark:text-gray-300 py-1.5 px-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <span className="font-medium truncate">
                                {ex.name}
                              </span>
                              <span className="text-center">{ex.sets}</span>
                              <span className="text-center">{ex.reps}</span>
                              <span className="text-center">
                                {ex.weight ? `${ex.weight} kg` : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
