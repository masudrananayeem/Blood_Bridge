import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUser,
  FiToggleLeft,
  FiClock,
  FiInbox,
  FiMapPin,
  FiBell,
  FiSettings,
  FiSearch,
  FiAlertTriangle,
  FiBookmark,
  FiList,
} from "react-icons/fi";
import Logo from "../common/Logo.jsx";

const donorLinks = [
  { to: "/dashboard/donor", label: "Overview", icon: FiGrid, end: true },
  { to: "/dashboard/donor/profile", label: "Profile", icon: FiUser },
  { to: "/dashboard/donor/availability", label: "Availability", icon: FiToggleLeft },
  { to: "/dashboard/donor/history", label: "Donation History", icon: FiClock },
  { to: "/dashboard/donor/requests", label: "Incoming Requests", icon: FiInbox },
  { to: "/dashboard/donor/nearby", label: "Nearby Requests", icon: FiMapPin },
  { to: "/dashboard/donor/notifications", label: "Notifications", icon: FiBell },
  { to: "/dashboard/donor/settings", label: "Settings", icon: FiSettings },
];

const seekerLinks = [
  { to: "/dashboard/seeker", label: "Overview", icon: FiGrid, end: true },
  { to: "/dashboard/seeker/profile", label: "Profile", icon: FiUser },
  { to: "/dashboard/seeker/search", label: "Search Donor", icon: FiSearch },
  { to: "/dashboard/seeker/emergency", label: "Emergency Request", icon: FiAlertTriangle },
  { to: "/dashboard/seeker/my-requests", label: "My Requests", icon: FiList },
  { to: "/dashboard/seeker/saved", label: "Saved Donors", icon: FiBookmark },
  { to: "/dashboard/seeker/history", label: "Request History", icon: FiClock },
  { to: "/dashboard/seeker/notifications", label: "Notifications", icon: FiBell },
  { to: "/dashboard/seeker/settings", label: "Settings", icon: FiSettings },
];

export default function Sidebar({ mode, open, onClose }) {
  const links = mode === "seeker" ? seekerLinks : donorLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-gray-100 bg-white p-5 transition-transform duration-300 dark:border-white/10 dark:bg-surface-dark lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 px-2">
          <Logo />
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-gradient text-white shadow-md shadow-brand-600/25"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                }`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
