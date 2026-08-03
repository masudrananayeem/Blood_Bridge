import RequestsList from "../../components/seeker/RequestsList.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SeekerHistoryPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.requestHistory")}</h1>
      <RequestsList statuses={["completed", "cancelled", "rejected"]} emptyText={t("requests.noHistory")} />
    </div>
  );
}
