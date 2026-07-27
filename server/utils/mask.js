// Masks contact details so seekers can browse donors without seeing their
// raw phone/email — full contact is only ever revealed on the request
// document itself, after that specific donor has accepted that request.

// 01843XXXXXX -> 01843******
export const maskPhone = (phone) => {
  if (!phone) return phone;
  const digits = String(phone);
  if (digits.length <= 5) return "*".repeat(digits.length);
  const visible = digits.slice(0, 5);
  return `${visible}${"*".repeat(Math.max(digits.length - 5, 0))}`;
};

// admin@example.com -> adm****@**.com
export const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  const domainParts = domain.split(".");
  const tld = domainParts.pop();
  const domainName = domainParts.join(".");

  const maskedLocal =
    local.length <= 3 ? `${local[0] || ""}**` : `${local.slice(0, 3)}${"*".repeat(Math.max(local.length - 3, 2))}`;
  const maskedDomain = domainName.length <= 1 ? "**" : `${"*".repeat(Math.max(domainName.length - 0, 2))}`;

  return `${maskedLocal}@${maskedDomain}.${tld}`;
};

// Returns a shallow copy of a donor object with phone/email masked.
export const maskDonorContact = (donor) => ({
  ...donor,
  phone: maskPhone(donor.phone),
  email: maskEmail(donor.email),
});

export default { maskPhone, maskEmail, maskDonorContact };
