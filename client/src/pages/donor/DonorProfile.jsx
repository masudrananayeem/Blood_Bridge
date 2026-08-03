import ProfileForm from "../../components/dashboard/ProfileForm.jsx";
import FeedbackForm from "../../components/dashboard/FeedbackForm.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function DonorProfile() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.profile")}</h1>
      <ProfileForm />
      <FeedbackForm />
    </div>
  );
}
