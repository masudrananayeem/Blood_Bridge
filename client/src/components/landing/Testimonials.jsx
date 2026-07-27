import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";

const testimonials = [
  {
    name: "রফিকুল ইসলাম",
    role: "নিয়মিত ডোনার",
    quote:
      "BloodBridge এর মাধ্যমে আমি জরুরি মুহূর্তে দ্রুত হাসপাতালে পৌঁছাতে পেরেছিলাম। প্ল্যাটফর্মটা সত্যিই জীবন বাঁচায়।",
  },
  {
    name: "সুমাইয়া আক্তার",
    role: "Blood Seeker",
    quote:
      "আমার বাবার অপারেশনের সময় মাত্র ২০ মিনিটে কাছাকাছি একজন ডোনার খুঁজে পেয়েছিলাম। অসাধারণ অভিজ্ঞতা।",
  },
  {
    name: "ডা. তানভীর আহমেদ",
    role: "মেডিকেল অফিসার",
    quote:
      "ভেরিফায়েড ডোনার সিস্টেমটা হাসপাতালের জন্য নির্ভরযোগ্য একটা রিসোর্স হয়ে উঠেছে।",
  },
];

export default function Testimonials() {
  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          মানুষ কী বলছেন
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            whileHover={{ y: -6 }}
            className="glass-card flex flex-col p-7"
          >
            <div className="mb-4 flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, idx) => (
                <FiStar key={idx} fill="currentColor" size={16} />
              ))}
            </div>
            <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              “{t.quote}”
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
