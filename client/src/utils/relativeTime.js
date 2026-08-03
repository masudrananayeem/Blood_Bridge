// "2 minutes ago" style relative time, falling back to a locale date string
// for anything older than a week.
export const formatRelativeTime = (dateInput, language = "en") => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  const isBn = language === "bn";

  if (diffSec < 45) return isBn ? "এইমাত্র" : "just now";
  if (diffMin < 60) return isBn ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
  if (diffHr < 24) return isBn ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
  if (diffDay < 7) return isBn ? `${diffDay} দিন আগে` : `${diffDay}d ago`;

  return date.toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric" });
};

export default formatRelativeTime;
