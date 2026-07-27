import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient background glow — quiet, not the focal point */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-600/10" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl dark:bg-brand-900/20" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        {/* Text column */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300"
          >
            🩸 প্রতি ২ সেকেন্ডে একজনের রক্ত প্রয়োজন হয়
          </motion.span>

          <motion.h1
            variants={item}
            className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
          >
            Donate Blood,
            <br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">Save Lives.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-lg text-lg text-gray-600 dark:text-gray-300"
          >
            Connect blood donors with people in need through one secure platform.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/login" className="btn-primary">
              Login <FiArrowRight />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-gray-600 underline-offset-4 hover:underline dark:text-gray-300"
            >
              এটা কীভাবে কাজ করে?
            </a>
          </motion.div>
        </motion.div>

        {/* Signature illustration: a heartbeat / EKG line that draws itself,
            tying the visual directly to "life" — the platform's actual subject
            — instead of a generic decorative shape. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          className="relative mx-auto flex h-72 w-full max-w-md items-center justify-center sm:h-96"
        >
          <div className="glass-card relative flex h-full w-full items-center justify-center overflow-hidden">
            <svg viewBox="0 0 400 200" className="w-[90%]" fill="none">
              <motion.path
                d="M0 100 H120 L140 40 L165 160 L190 70 L210 100 H400"
                stroke="#e21f1f"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.6 }}
              />
            </svg>

            {/* Blood drop marker riding the pulse line */}
            <motion.div
              className="absolute left-[41%] top-[18%]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
                <path
                  d="M17 3C17 3 6 15.5 6 22.5C6 28.85 10.9 33 17 33C23.1 33 28 28.85 28 22.5C28 15.5 17 3 17 3Z"
                  fill="#e21f1f"
                />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
