import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  CheckSquare,
  GraduationCap,
  BookMarked,
  X,
  Globe,
  Lock,
  Copy,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import api from "../../api/axios";
import toast from "react-hot-toast";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/study", label: "Study", icon: BookOpen },
  { to: "/physical", label: "Physical", icon: Dumbbell },
  { to: "/todos", label: "To-Do", icon: CheckSquare },
  { to: "/subjects", label: "Subjects", icon: GraduationCap },
  { to: '/vocabulary',  label: 'Vocabulary', icon: BookMarked },
];

export default function Sidebar({ open, onClose }) {
  const { user, setAuth, logout } = useAuthStore();
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? false);
  const [toggling, setToggling] = useState(false);

  const handleVisibilityToggle = async () => {
    setToggling(true);
    try {
      const { data } = await api.put("/profile/visibility", {
        isPublic: !isPublic,
      });
      setIsPublic(data.isPublic);
      // Update stored user object
      const updated = { ...user, isPublic: data.isPublic };
      setAuth(updated, localStorage.getItem("token"));
      toast.success(
        data.isPublic ? "Profile is now public" : "Profile is now private",
      );
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setToggling(false);
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/u/${user._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  return (
    <aside
      className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900
      border-r border-gray-100 dark:border-gray-800
      transform transition-transform duration-200 ease-in-out
      lg:relative lg:translate-x-0 lg:flex lg:flex-col
      ${open ? "translate-x-0" : "-translate-x-full"}
    `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">
            Daily Tracker
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${
                isActive
                  ? "bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }
            `}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Public profile toggle */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe size={14} className="text-emerald-500" />
              ) : (
                <Lock size={14} className="text-gray-400" />
              )}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {isPublic ? "Profile is public" : "Profile is private"}
              </span>
            </div>

            {/* Toggle switch */}
            <button
              onClick={handleVisibilityToggle}
              disabled={toggling}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                isPublic ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  isPublic ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Copy link — only when public */}
          {isPublic && (
            <button
              onClick={copyProfileLink}
              className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              <Copy size={12} /> Copy profile link
            </button>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full text-left text-sm text-red-500 hover:text-red-600 font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
