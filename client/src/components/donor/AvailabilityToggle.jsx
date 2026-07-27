import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { toggleAvailability } from "../../services/userService.js";

export default function AvailabilityToggle() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const isAvailable = user?.isAvailable ?? true;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const { isAvailable: updated } = await toggleAvailability(!isAvailable);
      setUser((prev) => ({ ...prev, isAvailable: updated }));
      toast.success(updated ? "আপনি এখন Available" : "আপনি এখন Unavailable");
    } catch {
      toast.error("স্ট্যাটাস পরিবর্তন করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        }`}
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
  );
}
