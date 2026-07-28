import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiDroplet, FiLoader } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { toggleAvailability, recordDonation } from "../../services/userService.js";
import { getDaysUntilEligible, getNextEligibleDateLabel, isInCooldown } from "../../utils/donationEligibility.js";

export default function AvailabilityToggle() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [confirmingDonation, setConfirmingDonation] = useState(false);
  const isAvailable = user?.isAvailable ?? true;
  const cooldown = isInCooldown(user?.lastDonationDate);
  const daysLeft = getDaysUntilEligible(user?.lastDonationDate);

  const handleToggle = async () => {
    if (!isAvailable && cooldown) {
      toast.error(`আপনি আরও ${daysLeft} দিন পর আবার Available হতে পারবেন।`);
      return;
    }
    setLoading(true);
    try {
      const { isAvailable: updated } = await toggleAvailability(!isAvailable);
      setUser((prev) => ({ ...prev, isAvailable: updated }));
      toast.success(updated ? "আপনি এখন Available" : "আপনি এখন Unavailable");
    } catch (err) {
      toast.error(err?.response?.data?.message || "স্ট্যাটাস পরিবর্তন করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDonation = async () => {
    setRecording(true);
    try {
      const { user: updated } = await recordDonation();
      setUser((prev) => ({ ...prev, ...updated }));
      toast.success("অভিনন্দন! আপনার রক্তদান রেকর্ড করা হয়েছে — ১২০ দিনের কুলডাউন শুরু হলো।");
      setConfirmingDonation(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "রেকর্ড করা যায়নি, আবার চেষ্টা করুন।");
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card flex items-center justify-between p-6">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Donation Availability</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Unavailable রাখলে নতুন কোনো রিকোয়েস্ট আপনাকে দেখানো হবে না।
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative h-8 w-16 shrink-0 rounded-full transition-colors duration-300 ${
            isAvailable ? "bg-brand-gradient" : "bg-gray-300 dark:bg-white/10"
          } ${!isAvailable && cooldown ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <motion.span
            animate={{ x: isAvailable ? 32 : 4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-gray-600 shadow"
          >
            {isAvailable ? "ON" : "OFF"}
          </motion.span>
        </button>
      </div>

      {cooldown && (
        <div className="glass-card flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          <FiDroplet className="mt-0.5 shrink-0" />
          <span>
            আপনি সম্প্রতি রক্ত দিয়েছেন — শরীরের সুরক্ষার জন্য আরও <b>{daysLeft} দিন</b> অপেক্ষা করতে হবে
            (আবার Available: <b>{getNextEligibleDateLabel(user?.lastDonationDate)}</b>)।
          </span>
        </div>
      )}

      {!cooldown && (
        <div className="glass-card p-6">
          <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">আজকে কি রক্ত দিয়েছেন?</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            রেকর্ড করলে এটা আপনার Donation History-তে যোগ হবে এবং ১২০ দিনের জন্য স্বয়ংক্রিয়ভাবে Unavailable হয়ে যাবেন।
          </p>

          {!confirmingDonation ? (
            <button
              onClick={() => setConfirmingDonation(true)}
              className="flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white"
            >
              <FiDroplet /> আজকে রক্ত দিয়েছি
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">নিশ্চিত করছেন?</p>
              <button
                onClick={handleRecordDonation}
                disabled={recording}
                className="flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {recording ? <FiLoader className="animate-spin" size={14} /> : null} হ্যাঁ, নিশ্চিত
              </button>
              <button
                onClick={() => setConfirmingDonation(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-white/10 dark:text-gray-300"
              >
                বাতিল
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
