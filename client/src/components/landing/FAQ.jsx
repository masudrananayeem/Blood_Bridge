import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
  {
    q: "রক্তদানের জন্য বয়স ও ওজন কত হতে হবে?",
    a: "সাধারণত ১৮-৬০ বছর বয়সী এবং কমপক্ষে ৫০ কেজি ওজনের সুস্থ ব্যক্তি রক্ত দিতে পারেন।",
  },
  {
    q: "কতদিন পরপর রক্ত দেওয়া যায়?",
    a: "পুরুষরা প্রতি ৩ মাসে এবং নারীরা প্রতি ৪ মাসে একবার রক্ত দিতে পারেন।",
  },
  {
    q: "BloodBridge এ কীভাবে ডোনার খুঁজব?",
    a: "Blood Group, District ও Upazila দিয়ে ফিল্টার করে আপনার কাছাকাছি ভেরিফায়েড ডোনার খুঁজে পাবেন।",
  },
  {
    q: "আমার তথ্য কি নিরাপদ থাকবে?",
    a: "হ্যাঁ। JWT অথেন্টিকেশন, এনক্রিপ্টেড পাসওয়ার্ড ও প্রোটেক্টেড API দিয়ে আপনার ডেটা সুরক্ষিত রাখা হয়।",
  },
  {
    q: "জরুরি প্রয়োজনে কীভাবে রিকোয়েস্ট করব?",
    a: "Seeker ড্যাশবোর্ড থেকে Emergency Request তৈরি করলে আশেপাশের ডোনাররা সাথে সাথে নোটিফিকেশন পাবেন।",
  },
];

function FaqItem({ faq, isOpen, onClick }) {
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{faq.q}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-brand-600"
        >
          <FiChevronDown size={20} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-gray-50 dark:bg-white/[0.02]">
      <div className="section-container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <FaqItem
                faq={faq}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
