import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheckCircle, FiXCircle, FiShield, FiMessageSquare, FiCheck } from "react-icons/fi";
import { getNotifications, markAllAsRead } from "../../services/notificationService.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { formatRelativeTime } from "../../utils/relativeTime.js";
import Loader from "../common/Loader.jsx";

const iconFor = {
  request: FiBell,
  accepted: FiCheckCircle,
  rejected: FiXCircle,
  verified: FiShield,
  filled: FiXCircle,
  feedback: FiMessageSquare,
};
const tintFor = {
  request: "text-brand-600 bg-brand-50 dark:bg-brand-950/40",
  accepted: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  rejected: "text-red-500 bg-red-50 dark:bg-red-950/40",
  verified: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  filled: "text-gray-500 bg-gray-100 dark:bg-white/10",
  feedback: "text-purple-600 bg-purple-50 dark:bg-purple-950/40",
};

export default function Notifications() {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  useEffect(() => {
    getNotifications()
      .then(({ notifications }) => {
        setNotifications(notifications);
        if (notifications.some((n) => !n.isRead)) markAllAsRead();
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  if (notifications.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
        <FiBell size={28} className="text-brand-300" />
        <p className="text-gray-500 dark:text-gray-400">{t("notifications.empty")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        {[
          { value: "all", label: t("notifications.all") },
          { value: "unread", label: `${t("notifications.unread")}${unreadCount ? ` (${unreadCount})` : ""}` },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === tab.value
                ? "bg-brand-gradient text-white"
                : "border border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 p-10 text-center">
          <FiCheck size={22} className="text-emerald-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("notifications.noUnread")}</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-3">
            {visible.map((n, i) => {
              const Icon = iconFor[n.type] || FiBell;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                  className={`glass-card relative flex items-start gap-4 p-4 ${
                    !n.isRead ? "ring-1 ring-brand-200 dark:ring-brand-900" : ""
                  }`}
                >
                  {!n.isRead && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-brand-500" />}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tintFor[n.type] || tintFor.request}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-200">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(n.createdAt, language)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
