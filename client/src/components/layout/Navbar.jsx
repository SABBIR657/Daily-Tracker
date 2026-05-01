import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

const titles = {
  "/": "Dashboard",
  "/study": "Study Tracker",
  "/physical": "Physical Tracker",
  "/todos": "To-Do List",
  "/subjects": "Subjects & Syllabus",
};

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();

  return (
    <header className="h-14 flex items-center gap-4 px-4 md:px-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Menu size={22} />
      </button>

      <h1 className="text-base font-semibold text-gray-900 dark:text-white">
        {titles[pathname] || "Daily Tracker"}
      </h1>
    </header>
  );
}
