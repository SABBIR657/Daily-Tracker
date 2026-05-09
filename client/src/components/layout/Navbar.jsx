import { Menu, Sun, Moon } from "lucide-react";
import { useLocation } from "react-router-dom";
import useThemeStore from "../../stores/themeStore";

const titles = {
  "/": "Dashboard",
  "/study": "Study Tracker",
  "/physical": "Physical Tracker",
  "/todos": "To-Do List",
  "/subjects": "Subjects & Syllabus",
  "/revision": "Revision Tracker",
  "/vocabulary": "Vocabulary",
};

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { dark, toggle } = useThemeStore();

  return (
    <header className="h-14 flex items-center gap-4 px-4 md:px-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Menu size={22} />
      </button>

      <h1 className="text-base font-semibold text-gray-900 dark:text-white flex-1">
        {titles[pathname] || "Daily Tracker"}
      </h1>

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
