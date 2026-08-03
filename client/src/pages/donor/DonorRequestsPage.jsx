import IncomingRequests from "../../components/donor/IncomingRequests.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function DonorRequestsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.incomingRequests")}</h1>
      <IncomingRequests />
    </div>
  );
}
