import SearchDonor from "../../components/seeker/SearchDonor.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SeekerSearchPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.searchDonor")}</h1>
      <SearchDonor />
    </div>
  );
}
