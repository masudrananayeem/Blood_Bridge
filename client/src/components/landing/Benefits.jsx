import { motion } from "framer-motion";
import { FiHeart, FiActivity, FiUsers, FiZap } from "react-icons/fi";

const benefits = [
  { icon: FiHeart, title: "Save Lives", desc: "একটি রক্তদান সরাসরি একজন মানুষের জীবন বাঁচাতে পারে।" },
  { icon: FiActivity, title: "Health Benefits", desc: "নিয়মিত রক্তদান নতুন রক্তকণিকা তৈরি ও আয়রন লেভেল ভারসাম্যে সাহায্য করে।" },
  { icon: FiUsers, title: "Community Impact", desc: "স্থানীয় ব্লাড ব্যাংক ও হাসপাতালের সরবরাহ স্থিতিশীল রাখে।" },
  { icon: FiZap, title: "Emergency Support", desc: "দুর্যোগ ও জরুরি পরিস্থিতিতে দ্রুত সাড়া দেওয়ার সক্ষমতা বাড়ায়।" },
];

export default function Benefits() {
  return (
    <section className="bg-gray-50 dark:bg-white/[0.02]">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Benefits of Donating Blood
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl bg-white p-6 text-center shadow-md dark:bg-white/5"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <b.icon size={26} />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">{b.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
