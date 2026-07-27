import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiUsers, FiDroplet, FiSearch, FiClock, FiCheckCircle } from "react-icons/fi";
import { getDashboardStats } from "../../services/adminService.js";
import StatCard from "../../components/dashboard/StatCard.jsx";
import Loader from "../../components/common/Loader.jsx";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(({ stats }) => setStats(stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">প্ল্যাটফর্মের সার্বিক অবস্থা</p>
      </motion.div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={FiUsers} label="Total Users" value={stats?.totalUsers ?? 0} />
          <StatCard icon={FiDroplet} label="Total Donors" value={stats?.totalDonors ?? 0} tint="green" />
          <StatCard icon={FiSearch} label="Total Seekers" value={stats?.totalSeekers ?? 0} tint="blue" />
          <StatCard icon={FiClock} label="Pending Requests" value={stats?.pendingRequests ?? 0} tint="amber" />
          <StatCard icon={FiCheckCircle} label="Completed Donations" value={stats?.completedDonations ?? 0} tint="green" />
        </div>
      )}
    </div>
  );
}
