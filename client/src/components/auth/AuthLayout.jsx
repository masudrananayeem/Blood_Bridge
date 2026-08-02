import { motion } from "framer-motion";
import Logo from "../common/Logo.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AuthLayout({ title, subtitle, children }) {
  const { t } = useLanguage();
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
      {/* Brand panel — hidden on small screens */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
        </div>

        <Logo variant="light" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <h2 className="text-3xl font-bold leading-snug">
            {t("hero.title")} <br /> {t("hero.titleHighlight")}
          </h2>
          <p className="mt-4 max-w-sm text-brand-50/90">{t("auth.brandSubtitle")}</p>
        </motion.div>

        <p className="relative text-sm text-brand-50/70">© {new Date().getFullYear()} BloodBridge</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
