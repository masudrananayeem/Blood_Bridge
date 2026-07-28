export const DONATION_COOLDOWN_DAYS = 120;

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// The date this donor becomes eligible to donate again, or null if they've
// never donated (i.e. always eligible).
export const getNextEligibleDate = (lastDonationDate) => {
  const last = toDate(lastDonationDate);
  if (!last) return null;
  const next = new Date(last);
  next.setDate(next.getDate() + DONATION_COOLDOWN_DAYS);
  return next;
};

// Whole days remaining until eligible again (0 if already eligible / never donated).
export const getDaysUntilEligible = (lastDonationDate) => {
  const next = getNextEligibleDate(lastDonationDate);
  if (!next) return 0;
  const diffMs = next.getTime() - Date.now();
  return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
};

export const isInCooldown = (lastDonationDate) => getDaysUntilEligible(lastDonationDate) > 0;

export default { DONATION_COOLDOWN_DAYS, getNextEligibleDate, getDaysUntilEligible, isInCooldown };
