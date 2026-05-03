import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Target } from "lucide-react";
import toast from "react-hot-toast";
import { updateGoals } from "../../api/auth";
import useAuthStore from "../../stores/authStore";

export default function GoalsModal({ onClose }) {
  const { user, setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      studyHours: user?.goals?.studyHours ?? 20,
      workoutDays: user?.goals?.workoutDays ?? 4,
      runKm: user?.goals?.runKm ?? 10,
    },
  });

  // Reset form if user goals change
  useEffect(() => {
    if (user?.goals) {
      reset({
        studyHours: user.goals.studyHours,
        workoutDays: user.goals.workoutDays,
        runKm: user.goals.runKm,
      });
    }
  }, [user]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateGoals,
    onSuccess: ({ data }) => {
      // Update the stored user object with new goals
      const updatedUser = { ...user, goals: data.goals };
      setAuth(updatedUser, localStorage.getItem("token"));
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Goals updated!");
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update goals"),
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-primary-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Weekly Goals
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit((data) => mutate(data))}
            className="px-6 py-5 space-y-5"
          >
            {/* Study hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Study hours per week
              </label>
              <div className="relative">
                <input
                  {...register("studyHours", {
                    required: "Required",
                    min: { value: 1, message: "Minimum 1 hour" },
                    max: { value: 168, message: "Maximum 168 hours" },
                  })}
                  type="number"
                  className="input pr-12"
                  placeholder="20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  hrs
                </span>
              </div>
              {errors.studyHours && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.studyHours.message}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Current: {user?.goals?.studyHours ?? 20} hrs/week
              </p>
            </div>

            {/* Run km */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Running distance per week
              </label>
              <div className="relative">
                <input
                  {...register("runKm", {
                    required: "Required",
                    min: { value: 1, message: "Minimum 1 km" },
                    max: { value: 1000, message: "Maximum 1000 km" },
                  })}
                  type="number"
                  step="0.5"
                  className="input pr-12"
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  km
                </span>
              </div>
              {errors.runKm && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.runKm.message}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Current: {user?.goals?.runKm ?? 10} km/week
              </p>
            </div>

            {/* Workout days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Workout days per week
              </label>
              <div className="relative">
                <input
                  {...register("workoutDays", {
                    required: "Required",
                    min: { value: 1, message: "Minimum 1 day" },
                    max: { value: 7, message: "Maximum 7 days" },
                  })}
                  type="number"
                  className="input pr-14"
                  placeholder="4"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  days
                </span>
              </div>
              {errors.workoutDays && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.workoutDays.message}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Current: {user?.goals?.workoutDays ?? 4} days/week
              </p>
            </div>

            {/* Info box */}
            <div className="bg-primary-50 dark:bg-primary-500/10 rounded-lg px-4 py-3">
              <p className="text-xs text-primary-600 dark:text-primary-400">
                Goals are used to calculate your weekly progress bars on the
                dashboard. If you exceed a goal the bar shows 100% — it never
                overflows.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
              >
                {isPending ? "Saving..." : "Save goals"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
