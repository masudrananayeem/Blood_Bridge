import Notifications from "../../components/dashboard/Notifications.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SeekerNotificationsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.notifications")}</h1>
      <Notifications />
    </div>
  );
}
