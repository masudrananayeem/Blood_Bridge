import EmergencyRequestForm from "../../components/seeker/EmergencyRequestForm.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function SeekerEmergencyPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sidebar.emergencyRequest")}</h1>
      <EmergencyRequestForm />
    </div>
  );
}
