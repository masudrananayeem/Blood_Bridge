import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiSearch, FiList, FiBookmark, FiAlertTriangle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import { getMyRequests } from "../../services/requestService.js";
import { getSavedDonors } from "../../services/userService.js";

export default function SeekerOverview() {
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState("—");
  const [emergencyCount, setEmergencyCount] = useState("—");
  const [savedCount, setSavedCount] = useState("—");

  useEffect(() => {
    getMyRequests().then(({ requests }) => {
      setActiveCount(requests.filter((r) => ["pending", "accepted"].includes(r.status)).length);
      setEmergencyCount(requests.filter((r) => r.urgency === "High").length);
    }).catch(() => {
      setActiveCount(0);
      setEmergencyCount(0);
    });
    getSavedDonors().then(({ donors }) => setSavedCount(donors.length)).catch(() => setSavedCount(0));
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          স্বাগতম, {user?.fullName?.split(" ")[0] || "Seeker"} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400">আপনার সিকার ড্যাশবোর্ড</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiList} label="Active Requests" value={activeCount} tint="amber" />
        <StatCard icon={FiBookmark} label="Saved Donors" value={savedCount} tint="blue" />
        <StatCard icon={FiSearch} label="Total Searches" value="—" />
        <StatCard icon={FiAlertTriangle} label="Emergency Requests" value={emergencyCount} tint="green" />
      </div>

      <Link
        to="/dashboard/seeker/emergency"
        className="glass-card flex items-center justify-between p-6 transition-transform hover:-translate-y-0.5"
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">জরুরি রক্তের প্রয়োজন?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">এখনই একটি Emergency Request তৈরি করুন।</p>
        </div>
        <span className="btn-primary !px-5 !py-2.5 text-sm">Create Request</span>
      </Link>
    </div>
  );
}
