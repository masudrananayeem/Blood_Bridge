import OrganizationsList from "../../components/common/OrganizationsList.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SeekerOrganizationsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.organizations")}</h1>
      <OrganizationsList />
    </div>
  );
}
