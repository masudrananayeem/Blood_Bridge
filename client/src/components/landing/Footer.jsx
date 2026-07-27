import { Link } from "react-router-dom";
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from "react-icons/fi";
import Logo from "../common/Logo.jsx";

const quickLinks = [
  { label: "হোম", to: "/" },
  { label: "লগইন", to: "/login" },
  { label: "রেজিস্টার", to: "/register" },
  { label: "How It Works", to: "/#how-it-works" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms of Service", to: "/terms" },
];

const socials = [
  { icon: FiFacebook, href: "#" },
  { icon: FiTwitter, href: "#" },
  { icon: FiInstagram, href: "#" },
  { icon: FiLinkedin, href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white dark:border-white/10 dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-gray-500 dark:text-gray-400">
              রক্তদাতা ও রক্তগ্রহীতাদের একটি নিরাপদ প্ল্যাটফর্মে সংযুক্ত করার উদ্যোগ।
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Legal
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Follow Us
            </h4>
            <div className="flex gap-3">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-brand-600 hover:text-white dark:bg-white/5 dark:text-gray-300"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-6 text-center text-sm text-gray-400 dark:border-white/10">
          © {new Date().getFullYear()} BloodBridge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
