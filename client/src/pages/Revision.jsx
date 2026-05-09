import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  RotateCcw,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Trophy,
  Clock,
  BookOpen,
  Flame,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toast from "react-hot-toast";
import {
  getRevisions,
  getDueRevisions,
  getRevisionStats,
  createRevision,
  markRevised,
  deleteRevision,
} from "../api/revisions";
import { getLogs } from "../api/logs";
import Badge from "../components/ui/Badge";

dayjs.extend(relativeTime);

const CONFIDENCE_LEVELS = [
  { value: "hard", label: "Hard", color: "bg-red-500", next: "1 day" },
  { value: "medium", label: "Medium", color: "bg-amber-500", next: "3 days" },
  { value: "easy", label: "Easy", color: "bg-emerald-500", next: "7 days" },
  {
    value: "very-easy",
    label: "Very Easy",
    color: "bg-blue-500",
    next: "14 days",
  },
];

export default function Revision() {
  const [activeTab, setActiveTab] = useState("due"); // due | all | mastered
  const [showForm, setShowForm] = useState(false);
  const [revisingId, setRevisingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Queries
  const { data: stats } = useQuery({
    queryKey: ["revisionStats"],
    queryFn: () => getRevisionStats().then((r) => r.data),
  });

  const { data: dueRevisions = [], isLoading: loadingDue } = useQuery({
    queryKey: ["revisions", "due"],
    queryFn: () => getDueRevisions().then((r) => r.data),
  });

  const { data: allRevisions = [], isLoading: loadingAll } = useQuery({
    queryKey: ["revisions", "all"],
    queryFn: () => getRevisions({ mastered: false }).then((r) => r.data),
  });

  const { data: masteredRevisions = [] } = useQuery({
    queryKey: ["revisions", "mastered"],
    queryFn: () => getRevisions({ mastered: true }).then((r) => r.data),
  });

  // Fetch recent study logs to suggest topics
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["logs", "study"],
    queryFn: () => getLogs({ type: "study", limit: 30 }).then((r) => r.data),
  });

  // Get unique topics from study logs not already in revision
  const allRevisionTopics = new Set(
    allRevisions.map((r) => `${r.subject}::${r.topic}`),
  );
  const suggestedTopics = recentLogs
    .filter((l) => !allRevisionTopics.has(`${l.subject}::${l.topic}`))
    .reduce((acc, l) => {
      const key = `${l.subject}::${l.topic}`;
      if (!acc.find((i) => i.key === key)) {
        acc.push({ key, subject: l.subject, topic: l.topic });
      }
      return acc;
    }, [])
    .slice(0, 5);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["revisions"] });
    queryClient.invalidateQueries({ queryKey: ["revisionStats"] });
  };

  // Mutations
  const { mutate: addRevision, isPending: adding } = useMutation({
    mutationFn: createRevision,
    onSuccess: () => {
      toast.success("Added to revision list!");
      invalidateAll();
      reset();
      setShowForm(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add"),
  });

  const { mutate: revise } = useMutation({
    mutationFn: ({ id, data }) => markRevised(id, data),
    onSuccess: (res) => {
      const r = res.data;
      if (r.mastered) {
        toast.success("🎉 Topic mastered!");
      } else {
        toast.success(
          `Revised! Next due ${dayjs(r.nextRevisionDate).fromNow()}`,
        );
      }
      setRevisingId(null);
      invalidateAll();
    },
    onError: () => toast.error("Failed to mark as revised"),
  });

  const { mutate: removeRevision } = useMutation({
    mutationFn: deleteRevision,
    onSuccess: () => {
      toast.success("Removed");
      invalidateAll();
    },
  });

  const displayList =
    activeTab === "due"
      ? dueRevisions
      : activeTab === "all"
        ? allRevisions
        : masteredRevisions;

  const isLoading = activeTab === "due" ? loadingDue : loadingAll;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Revision Tracker
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Spaced repetition for long-term retention
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add topic"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Due today",
            value: stats?.dueToday ?? 0,
            color: "text-red-500",
            icon: Flame,
          },
          {
            label: "Active",
            value: stats?.active ?? 0,
            color: "text-amber-500",
            icon: RotateCcw,
          },
          {
            label: "Mastered",
            value: stats?.mastered ?? 0,
            color: "text-emerald-500",
            icon: Trophy,
          },
          {
            label: "Total",
            value: stats?.total ?? 0,
            color: "text-primary-500",
            icon: BookOpen,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card text-center py-3">
            <Icon size={18} className={`${color} mx-auto mb-1`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card border-primary-200 dark:border-primary-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Add topic to revision
          </h3>

          {/* Suggested from study logs */}
          {suggestedTopics.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Quick add from recent study logs:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((s) => (
                  <button
                    key={s.key}
                    onClick={() =>
                      addRevision({ subject: s.subject, topic: s.topic })
                    }
                    className="text-xs bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors border border-primary-200 dark:border-primary-800"
                  >
                    + {s.subject} — {s.topic}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs text-gray-400">or add manually</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit((d) => addRevision(d))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  {...register("subject", { required: "Subject is required" })}
                  placeholder="e.g. Mathematics"
                  className="input"
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.subject.message}
                  </p>
                )}
              </div>
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
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={adding} className="btn-primary">
                {adding ? "Adding..." : "Add to revision"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {[
          { id: "due", label: `Due (${stats?.dueToday ?? 0})` },
          { id: "all", label: `Active (${stats?.active ?? 0})` },
          { id: "mastered", label: `Mastered (${stats?.mastered ?? 0})` },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="card text-center py-12">
          <RotateCcw
            size={40}
            className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
          />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {activeTab === "due"
              ? "Nothing due today — great job! 🎉"
              : activeTab === "mastered"
                ? "No mastered topics yet — keep revising!"
                : "No active revisions — add a topic above"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((rev) => (
            <RevisionCard
              key={rev._id}
              revision={rev}
              isRevising={revisingId === rev._id}
              expanded={expandedId === rev._id}
              onRevise={() => setRevisingId(rev._id)}
              onCancelRevise={() => setRevisingId(null)}
              onConfidenceSelect={(confidence, resource, notes) =>
                revise({ id: rev._id, data: { confidence, resource, notes } })
              }
              onToggleExpand={() =>
                setExpandedId(expandedId === rev._id ? null : rev._id)
              }
              onDelete={() => removeRevision(rev._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- RevisionCard ----
function RevisionCard({
  revision,
  isRevising,
  expanded,
  onRevise,
  onCancelRevise,
  onConfidenceSelect,
  onToggleExpand,
  onDelete,
}) {
  const [resource, setResource] = useState("");
  const [notes, setNotes] = useState("");

  const isOverdue = dayjs(revision.nextRevisionDate).isBefore(dayjs(), "day");
  const isDueToday = dayjs(revision.nextRevisionDate).isSame(dayjs(), "day");

  return (
    <div
      className={`card transition-colors ${
        revision.mastered
          ? "border-emerald-200 dark:border-emerald-800"
          : isOverdue
            ? "border-red-200 dark:border-red-900"
            : isDueToday
              ? "border-amber-200 dark:border-amber-800"
              : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {revision.subject}
            </span>
            <Badge label={revision.topic} variant="study" />
            {revision.mastered && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Trophy size={10} /> Mastered
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <RotateCcw size={11} />
              {revision.revisionCount}x revised
            </span>
            {!revision.mastered && (
              <span
                className={`text-xs flex items-center gap-1 font-medium ${
                  isOverdue
                    ? "text-red-500"
                    : isDueToday
                      ? "text-amber-500"
                      : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <Clock size={11} />
                {isOverdue
                  ? `Overdue by ${dayjs().diff(dayjs(revision.nextRevisionDate), "day")}d`
                  : isDueToday
                    ? "Due today"
                    : `Due ${dayjs(revision.nextRevisionDate).fromNow()}`}
              </span>
            )}
            {revision.lastRevisionDate && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Last: {dayjs(revision.lastRevisionDate).format("MMM D")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!revision.mastered && !isRevising && (
            <button
              onClick={onRevise}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <RotateCcw size={12} /> Revise
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={onDelete}
            className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Revise panel */}
      {isRevising && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            How well did you remember it?
          </p>

          {/* Resource input */}
          <input
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="Resource used (e.g. Thomas Calculus Ch.5, YouTube, Notes)"
            className="input text-sm"
          />

          {/* Notes input */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes from this revision session... (optional)"
            rows={2}
            className="input text-sm resize-none"
          />

          {/* Confidence buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CONFIDENCE_LEVELS.map(({ value, label, color, next }) => (
              <button
                key={value}
                onClick={() => onConfidenceSelect(value, resource, notes)}
                className={`${color} text-white rounded-lg py-2.5 px-2 text-xs font-semibold hover:opacity-90 transition-opacity text-center`}
              >
                <span className="block">{label}</span>
                <span className="block font-normal opacity-80 mt-0.5">
                  Next in {next}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={onCancelRevise} className="btn-secondary text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* History expand */}
      {expanded && revision.history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Revision history
          </p>
          <div className="space-y-2">
            {[...revision.history].reverse().map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    h.confidence === "hard"
                      ? "bg-red-500"
                      : h.confidence === "medium"
                        ? "bg-amber-500"
                        : h.confidence === "easy"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {h.confidence.replace("-", " ")}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      {dayjs(h.date).format("MMM D, YYYY")}
                    </span>
                  </div>
                  {h.resource && (
                    <p className="text-xs text-primary-500 mt-0.5">
                      📖 {h.resource}
                    </p>
                  )}
                  {h.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {h.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
