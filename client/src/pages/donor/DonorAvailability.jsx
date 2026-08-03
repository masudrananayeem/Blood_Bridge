import AvailabilityToggle from "../../components/donor/AvailabilityToggle.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function DonorAvailability() {
  const { t } = useLanguage();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.availability")}</h1>
      <AvailabilityToggle />
    </div>
  );
}
