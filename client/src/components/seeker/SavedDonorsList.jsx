import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiShield, FiBookmark, FiSend } from "react-icons/fi";
import { getSavedDonors, toggleSavedDonor } from "../../services/userService.js";
import SendRequestModal from "./SendRequestModal.jsx";
import Loader from "../common/Loader.jsx";

export default function SavedDonorsList() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingDonor, setRequestingDonor] = useState(null);

  const load = () => {
    setLoading(true);
    getSavedDonors()
      .then(({ donors }) => setDonors(donors))
      .catch(() => setDonors([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (id) => {
    try {
      await toggleSavedDonor(id);
      setDonors((prev) => prev.filter((d) => d.id !== id));
      toast.success("তালিকা থেকে সরানো হয়েছে");
    } catch {
      toast.error("সরানো যায়নি");
    }
  };

  if (loading) return <Loader />;

  if (donors.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
        <FiBookmark size={28} className="text-brand-300" />
        <p className="text-gray-500 dark:text-gray-400">এখনো কোনো ডোনার সেভ করা হয়নি।</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {donors.map((d) => (
        <div key={d.id} className="glass-card p-5">
          <div className="mb-3 flex items-center gap-3">
            {d.photoURL ? (
              <img src={d.photoURL} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient font-bold text-white">
                {d.fullName.charAt(0)}
              </div>
            )}
            <div>
              <p className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                {d.fullName}
                {d.isVerified && <FiShield className="text-blue-500" size={14} />}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {d.upazila}, {d.district}
              </p>
            </div>
          </div>

          <span className="mb-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
            {d.bloodGroup}
          </span>
          <p className="mb-4 text-xs text-gray-400">
            {d.phone} {d.email ? `· ${d.email}` : ""}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => handleRemove(d.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 py-2 text-xs font-semibold text-gray-600 dark:border-white/10 dark:text-gray-300"
            >
              Remove
            </button>
            <button
              onClick={() => setRequestingDonor(d)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-gradient py-2 text-xs font-semibold text-white"
            >
              <FiSend size={14} /> Request
            </button>
          </div>
        </div>
      ))}

      {requestingDonor && (
        <SendRequestModal donor={requestingDonor} onClose={() => setRequestingDonor(null)} />
      )}
    </div>
  );
}
