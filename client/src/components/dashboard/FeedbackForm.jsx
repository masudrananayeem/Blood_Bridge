import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiLoader, FiMessageSquare, FiCheckCircle } from "react-icons/fi";
import { sendFeedback, getMyFeedback } from "../../services/feedbackService.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const CATEGORIES = ["General", "Bug Report", "Feature Request", "Complaint", "Praise"];

export default function FeedbackForm() {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [sentJustNow, setSentJustNow] = useState(false);
  const [history, setHistory] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { category: "General" } });

  const loadHistory = () => {
    getMyFeedback()
      .then(({ feedback }) => setHistory(feedback))
      .catch(() => setHistory([]));
  };

  useEffect(loadHistory, []);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-white";

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await sendFeedback(formData);
      toast.success(t("feedback.sent"));
      setSentJustNow(true);
      reset({ category: "General", message: "" });
      loadHistory();
      setTimeout(() => setSentJustNow(false), 4000);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <FiMessageSquare className="text-brand-500" size={18} />
        <h3 className="font-semibold text-gray-900 dark:text-white">{t("feedback.title")}</h3>
      </div>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{t("feedback.subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("feedback.category")}</label>
          <select {...register("category")} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("feedback.message")}</label>
          <textarea
            {...register("message", { required: true, minLength: 5 })}
            rows={4}
            placeholder={t("feedback.placeholder")}
            className={`${inputClass} ${errors.message ? "border-red-400" : ""}`}
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <FiLoader className="animate-spin" />
          ) : sentJustNow ? (
            <FiCheckCircle />
          ) : (
            <FiMessageSquare />
          )}
          {sentJustNow ? t("feedback.sentShort") : t("feedback.send")}
        </button>
      </form>

      {history.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5 dark:border-white/10">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{t("feedback.myFeedback")}</h4>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {history.map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-white/5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-brand-600">{item.category}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      item.status === "reviewed"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                    }`}
                  >
                    {item.status === "reviewed" ? t("feedback.statusReviewed") : t("feedback.statusNew")}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{item.message}</p>
                <p className="mt-1 text-[11px] text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
