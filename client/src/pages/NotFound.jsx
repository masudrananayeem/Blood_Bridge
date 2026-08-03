import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-brand-600">404</h1>
      <p className="text-gray-500 dark:text-gray-400">{t("notFound.message")}</p>
      <Link to="/" className="btn-primary">{t("notFound.goHome")}</Link>
    </div>
  );
}
