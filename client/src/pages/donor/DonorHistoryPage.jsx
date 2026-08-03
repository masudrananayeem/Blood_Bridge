import DonationHistory from "../../components/donor/DonationHistory.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function DonorHistoryPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.donationHistory")}</h1>
      <DonationHistory />
    </div>
  );
}
