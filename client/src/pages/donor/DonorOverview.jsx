import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiDroplet, FiInbox, FiClock, FiCheckCircle, FiUsers, FiMapPin } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner.jsx";
import AvailabilityToggle from "../../components/donor/AvailabilityToggle.jsx";
import { getIncomingRequests } from "../../services/requestService.js";
import { getDonationHistory } from "../../services/userService.js";
import { getAge } from "../../utils/age.js";

export default function DonorOverview() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState("—");
  const [donationCount, setDonationCount] = useState("—");
  const age = getAge(user?.dateOfBirth);

  useEffect(() => {
    getIncomingRequests()
      .then(({ requests }) => setPendingCount(requests.length))
      .catch(() => setPendingCount(0));
    getDonationHistory()
      .then(({ history }) => setDonationCount(history.length))
      .catch(() => setDonationCount(0));
  }, []);

  const badges = [
    { label: user?.bloodGroup || "—" },
    { label: user?.isAvailable ? "Available" : "Unavailable", tone: user?.isAvailable ? "light" : "dark" },
  ];
  if (user?.isVerified) badges.push({ label: "✓ Verified" });
  if (age !== null) badges.push({ label: `${age} বছর` });

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={`স্বাগতম, ${user?.fullName?.split(" ")[0] || "Donor"} 👋`}
        subtitle="আপনার ডোনার ড্যাশবোর্ড"
        photoURL={user?.photoURL}
        initial={user?.fullName?.charAt(0) || "D"}
        badges={badges}
      />

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/dashboard/donor/nearby"
          className="glass-card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <FiMapPin size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Nearby Requests দেখুন</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">আপনার এলাকায় কার রক্ত দরকার</p>
          </div>
        </Link>

        <Link
          to="/dashboard/donor/organizations"
          className="glass-card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <FiUsers size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">রক্তদান সংগঠন দেখুন</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">স্বেচ্ছাসেবী গ্রুপ ও ব্লাড ব্যাংক</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
