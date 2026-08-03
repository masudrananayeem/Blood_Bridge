import AccountSettings from "../../components/dashboard/AccountSettings.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function DonorSettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.settings")}</h1>
      <AccountSettings />
    </div>
  );
}
