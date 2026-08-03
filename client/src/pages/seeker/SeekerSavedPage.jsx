import SavedDonorsList from "../../components/seeker/SavedDonorsList.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SeekerSavedPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.savedDonors")}</h1>
      <SavedDonorsList />
    </div>
  );
}
