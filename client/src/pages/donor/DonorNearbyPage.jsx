import NearbyRequests from "../../components/donor/NearbyRequests.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function DonorNearbyPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.nearbyRequests")}</h1>
      <NearbyRequests />
    </div>
  );
}
