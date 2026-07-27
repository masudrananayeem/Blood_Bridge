import { motion } from "framer-motion";
import { FiDroplet, FiAlertCircle, FiUsers, FiHeart } from "react-icons/fi";

const stats = [
  {
    icon: FiDroplet,
    title: "একজনের রক্ত বাঁচায় ৩ জন",
    desc: "প্রতিটি রক্তদান বিভক্ত হয়ে একাধিক রোগীর কাজে লাগে — প্লাজমা, প্লাটিলেট, রেড সেল আলাদাভাবে ব্যবহৃত হয়।",
  },
  {
    icon: FiAlertCircle,
    title: "জরুরি চাহিদা প্রতিনিয়ত",
    desc: "দুর্ঘটনা, অস্ত্রোপচার ও প্রসবকালীন জটিলতায় প্রতি মুহূর্তে নিরাপদ রক্তের প্রয়োজন হয়।",
  },
  {
    icon: FiUsers,
    title: "কমিউনিটি সাপোর্ট",
    desc: "স্বেচ্ছায় রক্তদান একটি সহায়ক সমাজ গঠন করে — একজন আরেকজনের পাশে দাঁড়ায়।",
  },
  {
    icon: FiHeart,
    title: "কোনো বিকল্প নেই",
    desc: "রক্ত কৃত্রিমভাবে তৈরি করা যায় না — একমাত্র মানুষের দানই এর একমাত্র উৎস।",
  },
];

// Animate in once when scrolled into view; never replay on scroll-up
const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function WhyDonate() {
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
          Why Blood Donation Matters
        </h2>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          আপনার একটা সিদ্ধান্ত হয়তো কারো জীবনের সবচেয়ে গুরুত্বপূর্ণ মুহূর্তে কাজে লাগবে।
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.title}
            custom={i}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariant}
            className="glass-card p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <s.icon size={22} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{s.title}</h3>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
