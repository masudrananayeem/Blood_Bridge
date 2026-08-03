import RequestsList from "../../components/seeker/RequestsList.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SeekerMyRequestsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.myRequests")}</h1>
      <RequestsList statuses={["pending", "accepted"]} emptyText={t("requests.noActive")} />
    </div>
  );
}
