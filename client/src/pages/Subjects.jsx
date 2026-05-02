import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  GraduationCap,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
} from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  getSubjects,
  createSubject,
  deleteSubject,
  addTopic,
  updateTopic,
  deleteTopic,
} from "../api/subjects";
import Badge from "../components/ui/Badge";

const TOPIC_STATUSES = ["not-started", "in-progress", "done", "revised"];

const statusStyles = {
  "not-started":
    "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  "in-progress":
    "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  done: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  revised:
    "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const nextTopicStatus = {
  "not-started": "in-progress",
  "in-progress": "done",
  done: "revised",
  revised: "not-started",
};

export default function Subjects() {
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [addingTopicId, setAddingTopicId] = useState(null);
  const queryClient = useQueryClient();

  const {
    register: regSubject,
    handleSubmit: handleSubject,
    reset: resetSubject,
    formState: { errors: subjectErrors },
  } = useForm({ defaultValues: { color: "#6366f1" } });

  const {
    register: regTopic,
    handleSubmit: handleTopic,
    reset: resetTopic,
  } = useForm();

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => getSubjects().then((r) => r.data),
  });

  // --- Subject mutations ---
  const { mutate: addSubject, isPending: addingSubject } = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      toast.success("Subject created!");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      resetSubject({ color: "#6366f1" });
      setShowSubjectForm(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create subject"),
  });

  const { mutate: removeSubject } = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      toast.success("Subject deleted");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  // --- Topic mutations ---
  const { mutate: addTopicMutation, isPending: addingTopic } = useMutation({
    mutationFn: ({ subjectId, data }) => addTopic(subjectId, data),
    onSuccess: () => {
      toast.success("Topic added!");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      resetTopic();
      setAddingTopicId(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add topic"),
  });

  const { mutate: changeTopicStatus } = useMutation({
    mutationFn: ({ subjectId, topicId, status }) =>
      updateTopic(subjectId, topicId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const { mutate: removeTopic } = useMutation({
    mutationFn: ({ subjectId, topicId }) => deleteTopic(subjectId, topicId),
    onSuccess: () => {
      toast.success("Topic deleted");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Subjects & Syllabus
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          onClick={() => setShowSubjectForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          {showSubjectForm ? <X size={16} /> : <Plus size={16} />}
          {showSubjectForm ? "Cancel" : "Add subject"}
        </button>
      </div>

      {/* Add Subject Form */}
      {showSubjectForm && (
        <div className="card border-primary-200 dark:border-primary-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            New subject
          </h3>
          <form
            onSubmit={handleSubject((d) => addSubject(d))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject name
                </label>
                <input
                  {...regSubject("name", { required: "Name is required" })}
                  placeholder="e.g. Mathematics"
                  className="input"
                  autoFocus
                />
                {subjectErrors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {subjectErrors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target date <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  {...regSubject("targetDate")}
                  type="date"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    {...regSubject("color")}
                    type="color"
                    className="h-9 w-16 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Used to color-code this subject
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  {...regSubject("description")}
                  placeholder="e.g. HSC Mathematics 2026"
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSubjectForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingSubject}
                className="btn-primary"
              >
                {addingSubject ? "Creating..." : "Create subject"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subject List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap
            size={40}
            className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
          />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No subjects yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add a subject to start tracking your syllabus
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject._id}
              subject={subject}
              expanded={expandedId === subject._id}
              addingTopic={addingTopicId === subject._id}
              regTopic={regTopic}
              handleTopic={handleTopic}
              addingTopicPending={addingTopic}
              onToggleExpand={() =>
                setExpandedId(expandedId === subject._id ? null : subject._id)
              }
              onDelete={() => removeSubject(subject._id)}
              onAddTopicOpen={() => {
                setAddingTopicId(subject._id);
                setExpandedId(subject._id);
              }}
              onAddTopicClose={() => {
                setAddingTopicId(null);
                resetTopic();
              }}
              onAddTopicSubmit={(data) =>
                addTopicMutation({ subjectId: subject._id, data })
              }
              onTopicStatusChange={(topicId, currentStatus) =>
                changeTopicStatus({
                  subjectId: subject._id,
                  topicId,
                  status: nextTopicStatus[currentStatus],
                })
              }
              onTopicDelete={(topicId) =>
                removeTopic({ subjectId: subject._id, topicId })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- SubjectCard ----
function SubjectCard({
  subject,
  expanded,
  addingTopic,
  regTopic,
  handleTopic,
  addingTopicPending,
  onToggleExpand,
  onDelete,
  onAddTopicOpen,
  onAddTopicClose,
  onAddTopicSubmit,
  onTopicStatusChange,
  onTopicDelete,
}) {
  const pct = subject.completionPercent ?? 0;
  const daysLeft = subject.targetDate
    ? dayjs(subject.targetDate).diff(dayjs(), "day")
    : null;

  // Count by status
  const counts = subject.topics.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card overflow-hidden">
      {/* Color bar */}
      <div
        className="h-1 -mx-5 -mt-5 mb-4 rounded-t-xl"
        style={{ backgroundColor: subject.color }}
      />

      {/* Subject header */}
      <div className="flex items-start gap-4">
        {/* Completion ring */}
        <div className="shrink-0">
          <CompletionRing pct={pct} color={subject.color} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {subject.name}
              </h3>
              {subject.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {subject.description}
                </p>
              )}
            </div>
            <button
              onClick={onDelete}
              className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <BookOpen size={11} />
              {subject.topics.length} topics
            </span>
            {daysLeft !== null && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  daysLeft < 0
                    ? "text-red-500"
                    : daysLeft < 14
                      ? "text-amber-500"
                      : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <Target size={11} />
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)}d overdue`
                  : `${daysLeft}d left`}
              </span>
            )}
            {/* Status counts */}
            {Object.entries(counts).map(([status, count]) => (
              <Badge
                key={status}
                label={`${count} ${status.replace("-", " ")}`}
                variant={
                  status === "done"
                    ? "done"
                    : status === "in-progress"
                      ? "in-progress"
                      : "default"
                }
              />
            ))}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: subject.color }}
          />
        </div>
      </div>

      {/* Expanded — Topics */}
      {expanded && (
        <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
          {subject.topics.length === 0 && !addingTopic && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
              No topics yet — add your first one below
            </p>
          )}

          {/* Topic rows */}
          {subject.topics.map((topic) => (
            <div
              key={topic._id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
            >
              {/* Status badge — clickable to cycle */}
              <button
                onClick={() => onTopicStatusChange(topic._id, topic.status)}
                className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize transition-colors shrink-0 ${statusStyles[topic.status]}`}
                title={`Click to mark as ${nextTopicStatus[topic.status]}`}
              >
                {topic.status.replace("-", " ")}
              </button>

              <span
                className={`flex-1 text-sm text-gray-700 dark:text-gray-300 ${
                  topic.status === "done" || topic.status === "revised"
                    ? "line-through text-gray-400 dark:text-gray-500"
                    : ""
                }`}
              >
                {topic.title}
              </span>

              {topic.notes && (
                <span
                  className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px] hidden sm:block"
                  title={topic.notes}
                >
                  {topic.notes}
                </span>
              )}

              <button
                onClick={() => onTopicDelete(topic._id)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Add topic inline form */}
          {addingTopic ? (
            <form
              onSubmit={handleTopic(onAddTopicSubmit)}
              className="flex gap-2 pt-1"
            >
              <input
                {...regTopic("title", { required: true })}
                placeholder="Topic title"
                className="input text-sm flex-1"
                autoFocus
              />
              <input
                {...regTopic("notes")}
                placeholder="Notes (optional)"
                className="input text-sm w-36 hidden sm:block"
              />
              <button
                type="submit"
                disabled={addingTopicPending}
                className="btn-primary text-sm px-3 shrink-0"
              >
                {addingTopicPending ? "..." : "Add"}
              </button>
              <button
                type="button"
                onClick={onAddTopicClose}
                className="btn-secondary text-sm px-3 shrink-0"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={onAddTopicOpen}
              className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium pt-1 transition-colors"
            >
              <Plus size={13} /> Add topic
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Completion Ring SVG ----
function CompletionRing({ pct, color }) {
  const r = 20;
  const cx = 26;
  const cy = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-[52px] h-[52px]">
      <svg width="52" height="52" className="-rotate-90">
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-100 dark:text-gray-800"
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {/* Percentage text */}
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
        {pct}%
      </span>
    </div>
  );
}
