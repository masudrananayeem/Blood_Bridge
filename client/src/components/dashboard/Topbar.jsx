import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu, FiLogOut, FiChevronDown, FiBell } from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import RoleSwitch from "./RoleSwitch.jsx";
import { getNotifications } from "../../services/notificationService.js";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getNotifications()
      .then(({ unreadCount }) => setUnreadCount(unreadCount))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("লগআউট হয়েছে");
    navigate("/");
  };

  const mode = user?.activeMode || "donor";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-lg dark:border-white/10 dark:bg-surface-dark/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden"
        >
          <FiMenu size={20} />
        </button>
        <div className="hidden sm:block">
          <RoleSwitch />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/dashboard/${mode}/notifications`)}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
        >
          <FiBell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                {user?.fullName?.charAt(0) || "U"}
              </div>
            )}
            <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 sm:block">
              {user?.fullName || "User"}
            </span>
            <FiChevronDown size={14} className="text-gray-400" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="glass-card absolute right-0 z-20 mt-2 w-44 overflow-hidden !rounded-xl p-1"
              >
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
