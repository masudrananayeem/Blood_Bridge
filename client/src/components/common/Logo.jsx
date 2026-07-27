import { Link } from "react-router-dom";

export default function Logo({ variant = "default" }) {
  const isLight = variant === "light";
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-110"
      >
        <path
          d="M17 3C17 3 6 15.5 6 22.5C6 28.85 10.9 33 17 33C23.1 33 28 28.85 28 22.5C28 15.5 17 3 17 3Z"
          fill="url(#logo-gradient)"
        />
        <path
          d="M9 22C9 25.5 12 28 15.5 28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <defs>
          <linearGradient id="logo-gradient" x1="6" y1="3" x2="28" y2="33" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff6767" />
            <stop offset="1" stopColor="#bd1414" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`text-xl font-bold tracking-tight ${isLight ? "text-white" : "text-gray-900 dark:text-white"}`}>
        Blood<span className="text-brand-600">Bridge</span>
      </span>
    </Link>
  );
}
