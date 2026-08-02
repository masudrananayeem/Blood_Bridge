import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function LegalPageLayout({ title, updatedLabel, children }) {
  return (
    <div className="min-h-screen min-h-[100dvh]">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{title}</h1>
        {updatedLabel && <p className="mt-2 text-sm text-gray-400">{updatedLabel}</p>}
        <div className="mt-8 space-y-6 text-gray-600 dark:text-gray-300">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
