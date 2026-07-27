import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiDroplet, FiInbox, FiClock, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import AvailabilityToggle from "../../components/donor/AvailabilityToggle.jsx";
import { getIncomingRequests } from "../../services/requestService.js";
import { getDonationHistory } from "../../services/userService.js";

export default function DonorOverview() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState("—");
  const [donationCount, setDonationCount] = useState("—");

  useEffect(() => {
    getIncomingRequests()
      .then(({ requests }) => setPendingCount(requests.length))
      .catch(() => setPendingCount(0));
    getDonationHistory()
      .then(({ history }) => setDonationCount(history.length))
      .catch(() => setDonationCount(0));
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          স্বাগতম, {user?.fullName?.split(" ")[0] || "Donor"} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400">আপনার ডোনার ড্যাশবোর্ড</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiDroplet} label="Blood Group" value={user?.bloodGroup || "—"} />
        <StatCard icon={FiInbox} label="Pending Requests" value={pendingCount} tint="amber" />
        <StatCard icon={FiCheckCircle} label="Total Donations" value={donationCount} tint="green" />
        <StatCard
          icon={FiClock}
          label="Last Donation"
          value={user?.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : "N/A"}
          tint="blue"
        />
      </div>

      <AvailabilityToggle />
    </div>
  );
}
