// Central translation dictionary for the app's language toggle.
// Usage: const { t } = useLanguage(); t("nav.login")
//
// This covers the structural UI chrome (navbar, sidebars, topbar, hero,
// footer, common actions) that appears on every page. Deeper page-specific
// content can be added here incrementally using the same `t("section.key")`
// pattern — the LanguageContext and toggle are already wired everywhere
// that matters, so adding more strings is just adding more dictionary keys.
const translations = {
  en: {
    "nav.home": "Home",
    "nav.exploreCampaigns": "Explore Campaigns",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.dashboard": "Dashboard",
    "nav.logout": "Logout",

    "hero.title": "Every Drop Counts.",
    "hero.titleHighlight": "Be Someone's Lifeline.",
    "hero.subtitle":
      "BloodBridge connects verified blood donors with people in urgent need across Bangladesh — fast, safe, and completely free.",
    "hero.ctaDonor": "Become a Donor",
    "hero.ctaSeeker": "Find a Donor",
    "hero.statDonors": "Registered Donors",
    "hero.statLives": "Lives Touched",
    "hero.statDistricts": "Districts Covered",

    "footer.tagline": "Connecting blood donors with people in need — one request at a time.",
    "footer.quickLinks": "Quick Links",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved.",

    "sidebar.overview": "Overview",
    "sidebar.profile": "Profile",
    "sidebar.availability": "Availability",
    "sidebar.donationHistory": "Donation History",
    "sidebar.incomingRequests": "Incoming Requests",
    "sidebar.nearbyRequests": "Nearby Requests",
    "sidebar.searchDonor": "Search Donor",
    "sidebar.emergencyRequest": "Emergency Request",
    "sidebar.myRequests": "My Requests",
    "sidebar.savedDonors": "Saved Donors",
    "sidebar.organizations": "Organizations",
    "sidebar.requestHistory": "Request History",
    "sidebar.notifications": "Notifications",
    "sidebar.settings": "Settings",

    "admin.dashboard": "Dashboard",
    "admin.manageUsers": "Manage Users",
    "admin.manageDonors": "Manage Donors",
    "admin.manageSeekers": "Manage Seekers",
    "admin.manageRequests": "Manage Blood Requests",
    "admin.approveRequests": "Approve Requests",
    "admin.organizations": "Organizations",
    "admin.analytics": "Reports & Analytics",
    "admin.settings": "Settings",

    "common.currentMode": "Current Mode",
    "common.bloodDonor": "Blood Donor",
    "common.bloodSeeker": "Blood Seeker",
    "common.welcome": "Welcome",
  },
  bn: {
    "nav.home": "হোম",
    "nav.exploreCampaigns": "ক্যাম্পেইন দেখুন",
    "nav.login": "লগইন",
    "nav.register": "রেজিস্টার",
    "nav.dashboard": "ড্যাশবোর্ড",
    "nav.logout": "লগআউট",

    "hero.title": "প্রতিটি ফোঁটাই মূল্যবান।",
    "hero.titleHighlight": "কারো বেঁচে থাকার আশা হোন।",
    "hero.subtitle":
      "BloodBridge সারা বাংলাদেশে ভেরিফায়েড রক্তদাতাদের সাথে জরুরি প্রয়োজনে থাকা মানুষদের সংযুক্ত করে — দ্রুত, নিরাপদ এবং সম্পূর্ণ বিনামূল্যে।",
    "hero.ctaDonor": "ডোনার হোন",
    "hero.ctaSeeker": "ডোনার খুঁজুন",
    "hero.statDonors": "নিবন্ধিত ডোনার",
    "hero.statLives": "জীবন বাঁচানো হয়েছে",
    "hero.statDistricts": "জেলা কভার করা হয়েছে",

    "footer.tagline": "রক্তদাতা ও প্রয়োজনীয়দের মধ্যে সংযোগ — প্রতিটি অনুরোধে।",
    "footer.quickLinks": "দ্রুত লিংক",
    "footer.contact": "যোগাযোগ",
    "footer.rights": "সর্বস্বত্ব সংরক্ষিত।",

    "sidebar.overview": "ওভারভিউ",
    "sidebar.profile": "প্রোফাইল",
    "sidebar.availability": "এভেইলেবিলিটি",
    "sidebar.donationHistory": "ডোনেশন হিস্ট্রি",
    "sidebar.incomingRequests": "ইনকামিং রিকোয়েস্ট",
    "sidebar.nearbyRequests": "কাছাকাছি রিকোয়েস্ট",
    "sidebar.searchDonor": "ডোনার খুঁজুন",
    "sidebar.emergencyRequest": "জরুরি রিকোয়েস্ট",
    "sidebar.myRequests": "আমার রিকোয়েস্ট",
    "sidebar.savedDonors": "সেভড ডোনার",
    "sidebar.organizations": "সংগঠন",
    "sidebar.requestHistory": "রিকোয়েস্ট হিস্ট্রি",
    "sidebar.notifications": "নোটিফিকেশন",
    "sidebar.settings": "সেটিংস",

    "admin.dashboard": "ড্যাশবোর্ড",
    "admin.manageUsers": "ইউজার ম্যানেজ করুন",
    "admin.manageDonors": "ডোনার ম্যানেজ করুন",
    "admin.manageSeekers": "সিকার ম্যানেজ করুন",
    "admin.manageRequests": "ব্লাড রিকোয়েস্ট ম্যানেজ করুন",
    "admin.approveRequests": "রিকোয়েস্ট অনুমোদন করুন",
    "admin.organizations": "সংগঠন",
    "admin.analytics": "রিপোর্ট ও অ্যানালিটিক্স",
    "admin.settings": "সেটিংস",

    "common.currentMode": "বর্তমান মোড",
    "common.bloodDonor": "ব্লাড ডোনার",
    "common.bloodSeeker": "ব্লাড সিকার",
    "common.welcome": "স্বাগতম",
  },
};

export default translations;
