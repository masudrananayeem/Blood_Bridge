import { motion } from "framer-motion";
import {
  FiUserPlus,
  FiSearch,
  FiAlertTriangle,
  FiCheckCircle,
  FiMapPin,
  FiClock,
  FiBell,
  FiUserCheck,
} from "react-icons/fi";

const services = [
  { icon: FiUserPlus, title: "Blood Donor Registration" },
  { icon: FiUserCheck, title: "Blood Seeker Registration" },
  { icon: FiSearch, title: "Blood Search" },
  { icon: FiAlertTriangle, title: "Emergency Blood Request" },
  { icon: FiCheckCircle, title: "Verified Donors" },
  { icon: FiMapPin, title: "Nearby Donors" },
  { icon: FiClock, title: "Blood Request History" },
  { icon: FiBell, title: "Notifications" },
];

export default function Services() {
  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Our Services</h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: (i % 4) * 0.08 }}
            className="glass-card group flex flex-col items-start gap-4 p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gradient text-white transition-transform group-hover:rotate-6">
              <s.icon size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{s.title}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
