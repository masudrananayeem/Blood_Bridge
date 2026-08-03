import LegalPageLayout from "../components/landing/LegalPageLayout.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const Section = ({ title, children }) => (
  <div>
    <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed">{children}</div>
  </div>
);

export default function TermsOfServicePage() {
  const { language } = useLanguage();

  if (language === "bn") {
    return (
      <LegalPageLayout title="ব্যবহারের শর্তাবলী" updatedLabel="সর্বশেষ আপডেট: আগস্ট ২০২৬">
        <p className="text-sm leading-relaxed">
          BloodBridge একটি প্ল্যাটফর্ম যা স্বেচ্ছাসেবী রক্তদাতাদের সাথে রক্তপ্রার্থীদের সংযুক্ত করে। অ্যাকাউন্ট তৈরি
          করার মাধ্যমে আপনি নিচের শর্তাবলীতে সম্মত হচ্ছেন।
        </p>

        <Section title="১. প্ল্যাটফর্মের ভূমিকা">
          <p>
            BloodBridge শুধুমাত্র ডোনার ও সিকারদের মধ্যে যোগাযোগের একটি মাধ্যম — আমরা কোনো হাসপাতাল, ব্লাড ব্যাংক বা
            মেডিকেল সেবা প্রদানকারী প্রতিষ্ঠান নই, এবং রক্তদান/গ্রহণের চিকিৎসাগত ফলাফলের জন্য দায়ী নই।
          </p>
        </Section>

        <Section title="২. তথ্যের সঠিকতা">
          <p>
            আপনি নিশ্চিত করছেন যে রেজিস্ট্রেশন ও প্রোফাইলে দেওয়া তথ্য (ব্লাড গ্রুপ, ফোন নম্বর, ঠিকানা ইত্যাদি) সঠিক ও
            আপ-টু-ডেট। ভুল তথ্য জরুরি পরিস্থিতিতে ক্ষতির কারণ হতে পারে।
          </p>
        </Section>

        <Section title="৩. রক্তদানের যোগ্যতা">
          <p>
            "Available" হিসেবে দেখানোর আগে নিশ্চিত হন যে আপনি চিকিৎসাগতভাবে রক্তদানের জন্য উপযুক্ত। প্ল্যাটফর্ম শেষ
            ডোনেশনের ১২০ দিন পর্যন্ত স্বয়ংক্রিয়ভাবে Unavailable রাখে, তবে চূড়ান্ত সিদ্ধান্ত সবসময় আপনার এবং
            চিকিৎসা পেশাদারের।
          </p>
        </Section>

        <Section title="৪. দায়বদ্ধতা">
          <p>
            দুই পক্ষের মধ্যে প্রকৃত রক্তদান/সংগ্রহ সংক্রান্ত যেকোনো ব্যবস্থা, স্থান, এবং চিকিৎসাগত যাচাই — এই সবকিছুর
            দায়িত্ব সংশ্লিষ্ট ব্যবহারকারী ও হাসপাতাল/মেডিকেল প্রতিষ্ঠানের। BloodBridge কোনো লেনদেনের সাক্ষী বা
            গ্যারান্টার নয়।
          </p>
        </Section>

        <Section title="৫. অ্যাকাউন্ট ও আচরণ">
          <ul className="list-disc space-y-1 pl-5">
            <li>একটি email দিয়ে একটি অ্যাকাউন্টই তৈরি করা যাবে</li>
            <li>হয়রানিমূলক, প্রতারণামূলক, বা মিথ্যা তথ্যযুক্ত ব্যবহার নিষিদ্ধ</li>
            <li>নিয়ম ভঙ্গকারী অ্যাকাউন্ট Admin কর্তৃক সাসপেন্ড বা ডিলিট করা হতে পারে</li>
          </ul>
        </Section>

        <Section title="৬. পরিবর্তন">
          <p>এই শর্তাবলী সময়ে সময়ে আপডেট হতে পারে। বড় কোনো পরিবর্তন হলে প্ল্যাটফর্মে জানিয়ে দেওয়া হবে।</p>
        </Section>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout title="Terms of Service" updatedLabel="Last updated: August 2026">
      <p className="text-sm leading-relaxed">
        BloodBridge is a platform that connects voluntary blood donors with people who need blood. By creating an
        account, you agree to the terms below.
      </p>

      <Section title="1. What the platform is">
        <p>
          BloodBridge is only a communication channel between donors and seekers — we are not a hospital, blood
          bank, or medical service provider, and we are not responsible for the medical outcome of any donation.
        </p>
      </Section>

      <Section title="2. Accuracy of information">
        <p>
          You confirm that the information you provide (blood group, phone number, address, etc.) is accurate and
          kept up to date. Incorrect information can cause real harm in an emergency.
        </p>
      </Section>

      <Section title="3. Donation eligibility">
        <p>
          Before marking yourself "Available," make sure you're medically fit to donate. The platform automatically
          keeps you Unavailable for 120 days after a logged donation, but the final judgment always rests with you
          and a medical professional.
        </p>
      </Section>

      <Section title="4. Responsibility">
        <p>
          Any arrangement, location, and medical verification for an actual donation is the responsibility of the
          users and the relevant hospital/medical facility involved. BloodBridge does not witness or guarantee any
          transaction between users.
        </p>
      </Section>

      <Section title="5. Accounts and conduct">
        <ul className="list-disc space-y-1 pl-5">
          <li>One account per email address</li>
          <li>Harassment, fraud, or knowingly false information is not allowed</li>
          <li>Accounts that violate these terms may be suspended or removed by an admin</li>
        </ul>
      </Section>

      <Section title="6. Changes">
        <p>These terms may be updated from time to time. Significant changes will be announced on the platform.</p>
      </Section>
    </LegalPageLayout>
  );
}
