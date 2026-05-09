import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Dumbbell,
  Footprints,
  CheckSquare,
  Lock,
} from "lucide-react";
// import axios from 'axios';
import dayjs from "dayjs";
import Heatmap from "../components/charts/Heatmap";
import api from "../api/axios";

const fetchProfile = (userId) =>
  api.get(`/profile/${userId}`).then((r) => r.data);

export default function PublicProfile() {
  const { userId } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: () => fetchProfile(userId),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    const isPrivate = error.response?.status === 403;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isPrivate ? "This profile is private" : "Profile not found"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isPrivate
              ? "This user has chosen to keep their profile private."
              : "The profile you are looking for does not exist."}
          </p>
        </div>
      </div>
    );
  }

  const { user, stats, subjects, heatmap } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {user.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Daily Tracker — last 30 days
          </p>

          {/* Goals */}
          {user.goals && (
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              <GoalChip
                label="Study goal"
                value={`${user.goals.studyHours}h/wk`}
              />
              <GoalChip label="Run goal" value={`${user.goals.runKm}km/wk`} />
              <GoalChip
                label="Workout"
                value={`${user.goals.workoutDays}d/wk`}
              />
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            icon={BookOpen}
            color="text-indigo-500"
            label="Study"
            value={`${stats.studyHours}h`}
          />
          <StatBox
            icon={Footprints}
            color="text-emerald-500"
            label="Running"
            value={`${stats.totalKm}km`}
          />
          <StatBox
            icon={Dumbbell}
            color="text-amber-500"
            label="Workouts"
            value={`${stats.workoutDays}d`}
          />
          <StatBox
            icon={CheckSquare}
            color="text-primary-500"
            label="Done"
            value={`${stats.doneTodos} tasks`}
          />
        </div>

        {/* Heatmap */}
        <Heatmap data={heatmap} />

        {/* Subjects */}
        {subjects.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Syllabus progress
            </h3>
            <div className="space-y-3">
              {subjects.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {s.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {s.completionPercent}% · {s.totalTopics} topics
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.completionPercent}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          Daily Tracker · Built by{" "}
          <span className="font-medium text-gray-500 dark:text-gray-600">
            <a
              href="https://www.linkedin.com/in/sabbir-rahman-9a077620b/"
              className="no-underline"
            >
              Sabbir Rahman
            </a>
          </span>{" "}
          © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, color, label, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center shadow-sm">
      <Icon size={20} className={`${color} mx-auto mb-1`} />
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function GoalChip({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {value}
      </p>
    </div>
  );
}
