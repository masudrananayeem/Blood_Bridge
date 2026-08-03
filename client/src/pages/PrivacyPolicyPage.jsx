import LegalPageLayout from "../components/landing/LegalPageLayout.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const Section = ({ title, children }) => (
  <div>
    <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed">{children}</div>
  </div>
);

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();

  if (language === "bn") {
    return (
      <LegalPageLayout title="প্রাইভেসি পলিসি" updatedLabel="সর্বশেষ আপডেট: আগস্ট ২০২৬">
        <p className="text-sm leading-relaxed">
          BloodBridge ব্যবহার করার মাধ্যমে আপনি এই প্রাইভেসি পলিসিতে বর্ণিত তথ্য সংগ্রহ ও ব্যবহারের পদ্ধতিতে সম্মত হচ্ছেন।
          আমরা রক্তদাতা ও রক্তপ্রার্থীদের নিরাপদে সংযুক্ত করার জন্য প্রয়োজনীয় ন্যূনতম তথ্যই সংগ্রহ করি।
        </p>

        <Section title="১. আমরা কী তথ্য সংগ্রহ করি">
          <p>
            রেজিস্ট্রেশনের সময়: পূর্ণ নাম, ইমেইল, ফোন নম্বর, ব্লাড গ্রুপ, জন্ম তারিখ, লিঙ্গ, জেলা/উপজেলা, বর্তমান ঠিকানা এবং
            (ঐচ্ছিক) প্রোফাইল ছবি। এই তথ্যগুলো ছাড়া ডোনার/সিকার ম্যাচিং সঠিকভাবে কাজ করতে পারে না।
          </p>
          <p>প্ল্যাটফর্ম ব্যবহারের সময়: রক্তের অনুরোধ, ডোনেশন হিস্ট্রি, সেভড ডোনার, এবং আপনার পাঠানো ফিডব্যাক।</p>
        </Section>

        <Section title="২. আমরা এই তথ্য কীভাবে ব্যবহার করি">
          <ul className="list-disc space-y-1 pl-5">
            <li>ব্লাড গ্রুপ ও এলাকা অনুযায়ী উপযুক্ত ডোনার/রিকোয়েস্ট খুঁজে বের করতে</li>
            <li>একজন ডোনার রিকোয়েস্ট গ্রহণ করলে সেই নির্দিষ্ট অনুরোধে যোগাযোগের তথ্য প্রকাশ করতে</li>
            <li>জরুরি প্রয়োজনে নিকটতম উপযুক্ত ডোনারদের নোটিফিকেশন পাঠাতে</li>
            <li>অ্যাকাউন্ট নিরাপত্তা ও জালিয়াতি প্রতিরোধে</li>
          </ul>
        </Section>

        <Section title="৩. যোগাযোগের তথ্য কীভাবে সুরক্ষিত থাকে">
          <p>
            ডোনার খুঁজতে গেলে আপনার ফোন নম্বর ও ইমেইল সবসময় মাস্ক করা অবস্থায় দেখানো হয় (যেমন{" "}
            <code>01843******</code>)। কোনো ডোনার আপনার রিকোয়েস্ট গ্রহণ করলেই কেবল সেই নির্দিষ্ট অনুরোধে পূর্ণ যোগাযোগের
            তথ্য প্রকাশিত হয়।
          </p>
        </Section>

        <Section title="৪. তথ্য কার সাথে শেয়ার করা হয়">
          <p>
            আপনার তথ্য কখনো তৃতীয় পক্ষের কাছে বিক্রি করা হয় না। প্রোফাইল ছবি সংরক্ষণের জন্য আমরা Cloudinary এবং
            অ্যাকাউন্ট/লগইনের জন্য Firebase Authentication ব্যবহার করি — এই সেবাগুলোর নিজস্ব প্রাইভেসি নীতি প্রযোজ্য হয়।
          </p>
        </Section>

        <Section title="৫. আপনার নিয়ন্ত্রণ">
          <ul className="list-disc space-y-1 pl-5">
            <li>যেকোনো সময় Profile পেজ থেকে নিজের তথ্য আপডেট করতে পারবেন</li>
            <li>Availability টগল করে ডোনার সার্চ থেকে নিজেকে লুকিয়ে রাখতে পারবেন</li>
            <li>Account Settings থেকে আপনার অ্যাকাউন্ট ও সংশ্লিষ্ট সব তথ্য স্থায়ীভাবে ডিলিট করতে পারবেন</li>
          </ul>
        </Section>

        <Section title="৬. যোগাযোগ">
          <p>এই পলিসি সম্পর্কে কোনো প্রশ্ন থাকলে Profile পেজের Feedback সেকশনের মাধ্যমে আমাদের জানান।</p>
        </Section>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout title="Privacy Policy" updatedLabel="Last updated: August 2026">
      <p className="text-sm leading-relaxed">
        By using BloodBridge, you agree to the collection and use of information as described in this policy. We
        collect only the minimum information needed to safely connect blood donors with people who need blood.
      </p>

      <Section title="1. What we collect">
        <p>
          At registration: full name, email, phone number, blood group, date of birth, gender, district/upazila,
          present address, and an optional profile photo. Without these, donor/seeker matching can't work properly.
        </p>
        <p>While using the platform: blood requests, donation history, saved donors, and any feedback you submit.</p>
      </Section>

      <Section title="2. How we use it">
        <ul className="list-disc space-y-1 pl-5">
          <li>To match seekers with suitable donors by blood group and location</li>
          <li>To reveal contact details on a specific request once a donor accepts it</li>
          <li>To notify the nearest suitable donors for emergency requests</li>
          <li>To keep accounts secure and prevent abuse</li>
        </ul>
      </Section>

      <Section title="3. How contact info is protected">
        <p>
          Your phone number and email are always masked (e.g. <code>01843******</code>) when donors are being
          searched. Full contact details are only revealed on a specific request once that donor accepts it.
        </p>
      </Section>

      <Section title="4. Who we share data with">
        <p>
          We never sell your data to third parties. We use Cloudinary to store profile photos and Firebase
          Authentication for accounts/login — their own privacy policies apply to that processing.
        </p>
      </Section>

      <Section title="5. Your control">
        <ul className="list-disc space-y-1 pl-5">
          <li>Update your information anytime from the Profile page</li>
          <li>Toggle Availability off to hide yourself from donor search</li>
          <li>Permanently delete your account and all related data from Account Settings</li>
        </ul>
      </Section>

      <Section title="6. Contact">
        <p>Questions about this policy? Reach us through the Feedback section on your Profile page.</p>
      </Section>
    </LegalPageLayout>
  );
}
