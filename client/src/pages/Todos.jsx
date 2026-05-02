import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  CheckSquare,
  Plus,
  Trash2,
  X,
  Circle,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../api/todos";
import Badge from "../components/ui/Badge";

const CATEGORIES = ["all", "study", "work", "physical", "personal"];
const PRIORITIES = ["all", "high", "medium", "low"];
const STATUSES = ["pending", "in-progress", "done"];

const statusIcon = {
  pending: <Circle size={16} className="text-gray-400" />,
  "in-progress": <Clock size={16} className="text-blue-400" />,
  done: <CheckCircle2 size={16} className="text-emerald-500" />,
};

const nextStatus = {
  pending: "in-progress",
  "in-progress": "done",
  done: "pending",
};

export default function Todos() {
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [filterPri, setFilterPri] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { priority: "medium", category: "personal" },
  });

  // Build query params
  const params = {};
  if (filterCat !== "all") params.category = filterCat;
  if (filterPri !== "all") params.priority = filterPri;
  if (filterStatus !== "all") params.status = filterStatus;

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos", params],
    queryFn: () => getTodos(params).then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ["todoSummary", "week"],
    queryFn: () =>
      import("../api/todos").then((m) =>
        m.getTodoSummary("week").then((r) => r.data),
      ),
  });

  const { mutate: addTodo, isPending } = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      toast.success("Task added!");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todoSummary"] });
      reset({ priority: "medium", category: "personal" });
      setShowForm(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add task"),
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }) => updateTodo(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todoSummary"] });
    },
  });

  const { mutate: removeTodo } = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todoSummary"] });
    },
  });

  const isOverdue = (todo) =>
    todo.status !== "done" &&
    todo.dueDate &&
    dayjs(todo.dueDate).isBefore(dayjs(), "day");

  // Group by status for kanban-style sections
  const pending = todos.filter((t) => t.status === "pending");
  const inProgress = todos.filter((t) => t.status === "in-progress");
  const done = todos.filter((t) => t.status === "done");

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            To-Do List
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {summary?.done ?? 0} done · {summary?.pending ?? 0} pending
            {summary?.overdue > 0 && (
              <span className="text-red-500 ml-2">
                · {summary.overdue} overdue
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add task"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Pending",
            value: summary?.pending ?? 0,
            color: "text-gray-500",
          },
          {
            label: "In Progress",
            value: summary?.inProgress ?? 0,
            color: "text-blue-500",
          },
          {
            label: "Done",
            value: summary?.done ?? 0,
            color: "text-emerald-500",
          },
          {
            label: "Overdue",
            value: summary?.overdue ?? 0,
            color: "text-red-500",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-3">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="card border-primary-200 dark:border-primary-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            New task
          </h3>
          <form
            onSubmit={handleSubmit((d) => addTodo(d))}
            className="space-y-4"
          >
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task title
              </label>
              <input
                {...register("title", { required: "Title is required" })}
                placeholder="e.g. Complete integration chapter"
                className="input"
                autoFocus
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                {...register("description")}
                placeholder="Any extra details..."
                rows={2}
                className="input resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select {...register("priority")} className="input">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select {...register("category")} className="input capitalize">
                  {["study", "work", "physical", "personal"].map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due date <span className="text-gray-400">(optional)</span>
                </label>
                <input {...register("dueDate")} type="date" className="input" />
              </div>
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
                {isPending ? "Adding..." : "Add task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category filter */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filterCat === c
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPri(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filterPri === p
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filterStatus === s
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Todo List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : todos.length === 0 ? (
        <div className="card text-center py-12">
          <CheckSquare
            size={40}
            className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
          />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No tasks found
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add a task or adjust your filters
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sections */}
          {[
            {
              label: "In Progress",
              items: inProgress,
              accent: "border-l-blue-400",
            },
            {
              label: "Pending",
              items: pending,
              accent: "border-l-gray-300 dark:border-l-gray-600",
            },
            { label: "Done", items: done, accent: "border-l-emerald-400" },
          ].map(({ label, items, accent }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {label} ({items.length})
                </p>
                <div className="space-y-2">
                  {items.map((todo) => (
                    <TodoRow
                      key={todo._id}
                      todo={todo}
                      accent={accent}
                      isOverdue={isOverdue(todo)}
                      onStatusClick={() =>
                        changeStatus({
                          id: todo._id,
                          status: nextStatus[todo.status],
                        })
                      }
                      onDelete={() => removeTodo(todo._id)}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ---- TodoRow sub-component ----
function TodoRow({ todo, accent, isOverdue, onStatusClick, onDelete }) {
  return (
    <div
      className={`card flex items-start gap-3 py-3 px-4 border-l-4 ${accent} transition-opacity ${
        todo.status === "done" ? "opacity-60" : ""
      }`}
    >
      {/* Status toggle button */}
      <button
        onClick={onStatusClick}
        className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
        title={`Mark as ${nextStatus[todo.status]}`}
      >
        {statusIcon[todo.status]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium text-gray-800 dark:text-gray-200 ${
            todo.status === "done"
              ? "line-through text-gray-400 dark:text-gray-500"
              : ""
          }`}
        >
          {todo.title}
        </p>

        {todo.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {todo.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge label={todo.priority} variant={todo.priority} />
          <Badge label={todo.category} variant="default" />
          {todo.dueDate && (
            <span
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? "text-red-500 font-medium"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {isOverdue && <AlertCircle size={11} />}
              {isOverdue ? "Overdue · " : ""}
              {dayjs(todo.dueDate).format("MMM D")}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
