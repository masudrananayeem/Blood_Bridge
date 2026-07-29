import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiList, FiBookmark, FiAlertTriangle, FiUsers, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner.jsx";
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
      <WelcomeBanner
        title={`স্বাগতম, ${user?.fullName?.split(" ")[0] || "Seeker"} 👋`}
        subtitle="আপনার সিকার ড্যাশবোর্ড"
        photoURL={user?.photoURL}
        initial={user?.fullName?.charAt(0) || "S"}
        badges={[{ label: user?.district || "—" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiList} label="Active Requests" value={activeCount} tint="amber" />
        <StatCard icon={FiBookmark} label="Saved Donors" value={savedCount} tint="blue" />
        <StatCard icon={FiSearch} label="Total Searches" value="—" />
        <StatCard icon={FiAlertTriangle} label="Emergency Requests" value={emergencyCount} tint="green" />
      </div>

      <Link
        to="/dashboard/seeker/emergency"
        className="glass-card relative flex items-center justify-between overflow-hidden p-6 transition-transform hover:-translate-y-0.5"
      >
        <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-2xl" />
        <div className="relative">
          <h3 className="font-semibold text-gray-900 dark:text-white">জরুরি রক্তের প্রয়োজন?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">এখনই একটি Emergency Request তৈরি করুন — নিকটতম ৫ জন ডোনার সাথে সাথে জানবেন।</p>
        </div>
        <span className="btn-primary relative !px-5 !py-2.5 text-sm">
          Create Request <FiArrowRight />
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/dashboard/seeker/search"
          className="glass-card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <FiSearch size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">ডোনার খুঁজুন</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Blood group / district / near me দিয়ে খুঁজুন</p>
          </div>
        </Link>

        <Link
          to="/dashboard/seeker/organizations"
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
