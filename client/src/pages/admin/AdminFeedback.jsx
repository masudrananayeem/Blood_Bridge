import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiMessageSquare, FiCheckCircle, FiMail } from "react-icons/fi";
import { getAllFeedback, updateFeedbackStatus } from "../../services/feedbackService.js";
import Loader from "../../components/common/Loader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const TABS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
];

export default function AdminFeedback() {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");

  const load = (status = tab) => {
    setLoading(true);
    getAllFeedback(status ? { status } : {})
      .then(({ feedback }) => setFeedback(feedback))
      .catch(() => setFeedback([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(""), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTab = (value) => {
    setTab(value);
    load(value);
  };

  const handleMarkReviewed = async (id) => {
    try {
      const { feedback: updated } = await updateFeedbackStatus(id, "reviewed");
      setFeedback((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success(t("adminFeedback.markedReviewed"));
    } catch {
      toast.error(t("adminOrg.actionFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("admin.feedback")}</h1>

      <div className="flex gap-2">
        {TABS.map((tabOption) => (
          <button
            key={tabOption.value}
            onClick={() => handleTab(tabOption.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === tabOption.value
                ? "bg-brand-gradient text-white"
                : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300"
            }`}
          >
            {tabOption.label}
          </button>
        ))}
      </div>

      {loading && <Loader />}

      {!loading && feedback.length === 0 && (
        <div className="glass-card p-12 text-center text-gray-500 dark:text-gray-400">{t("adminFeedback.noneFound")}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {feedback.map((item) => (
          <div key={item.id} className="glass-card p-5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                  <FiMessageSquare size={14} className="text-brand-500" /> {item.userName}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  <FiMail size={11} /> {item.userEmail}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.status === "reviewed"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                }`}
              >
                {item.status === "reviewed" ? "Reviewed" : "New"}
              </span>
            </div>

            <span className="mb-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              {item.category}
            </span>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{item.message}</p>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
              {item.status !== "reviewed" && (
                <button
                  onClick={() => handleMarkReviewed(item.id)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <FiCheckCircle size={13} /> Mark Reviewed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
