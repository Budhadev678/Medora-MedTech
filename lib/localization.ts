"use client";

import { useState, useEffect } from "react";

export type LanguageCode = "en" | "hi" | "or";

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation & Shell
    "nav.home": "Home",
    "nav.appointments": "Appointments",
    "nav.records": "Records",
    "nav.more": "More",
    "nav.emergency": "Emergency",
    "nav.prescriptions": "Prescriptions",
    "nav.reports": "Lab Reports",
    "nav.pharmacy": "Pharmacy",
    "nav.bills": "Bills",
    "nav.profile": "Profile",
    "nav.settings": "Settings",
    "nav.help": "Help",
    "nav.logout": "Sign Out",
    "nav.dashboard": "Dashboard",
    "nav.patients": "Patients",
    "nav.schedule": "Schedule",
    "nav.consultations": "Consultations",
    "nav.lab_orders": "Lab Orders",
    "nav.referrals": "Referrals",
    "nav.departments": "Departments",
    "nav.admissions": "Admissions",
    "nav.staff": "Staff",
    "nav.insurance": "Insurance",
    "nav.policies": "Policies",
    "nav.claims": "Claims",
    "nav.inventory": "Inventory",
    "nav.dispensing": "Dispensing",

    // Common Headings & Actions
    "common.welcome": "Welcome back",
    "common.good_morning": "Good morning",
    "common.quick_actions": "Quick Actions",
    "common.recent_activity": "Recent Healthcare Activity",
    "common.upcoming_schedule": "Upcoming Schedule",
    "common.no_appointments": "No upcoming appointments",
    "common.no_records": "No healthcare records yet",
    "common.view_all": "View All",
    "common.search_placeholder": "Search by ID, name, or keyword...",
    "common.active": "Active",
    "common.confirmed": "Confirmed",
    "common.completed": "Completed",
    "common.verified": "Verified Active",
    "common.why_charged": "Why Was I Charged? (Lineage Breakdown)",
    "common.sos_emergency": "SOS Emergency Assistance",

    // Profile & Identity
    "profile.title": "Patient Health Passport",
    "profile.completeness": "Profile Completeness",
    "profile.personal_info": "Personal Information",
    "profile.contact_info": "Contact Information",
    "profile.address": "Residential Address",
    "profile.health_info": "Basic Health Information",
    "profile.emergency_contact": "Primary Emergency Contact",
    "profile.abha_title": "Ayushman Bharat (ABHA)",
    "profile.aadhaar_verification": "Aadhaar Identity Verification",
    "profile.edit": "Edit",
    "profile.save": "Save Changes",
    "profile.cancel": "Cancel",
    "profile.link_abha": "Link ABHA",
    "profile.manage_abha": "Manage ABHA",
    "profile.blood_group": "Blood Group",
    "profile.conditions": "Existing Conditions",
    "profile.sign_out": "Sign Out of MEDORA",

    // Privacy & Consent
    "privacy.title": "Privacy & Access Control Center",
    "privacy.pending_requests": "Pending Consent Requests",
    "privacy.active_permissions": "Active Medical Access Permissions",
    "privacy.connected_orgs": "Connected Healthcare Facilities",
    "privacy.correction_tracker": "Identity Correction Requests",
    "privacy.audit_trail": "Security & Privacy Audit Ledger",
    "privacy.allow": "Allow Access",
    "privacy.decline": "Decline",
    "privacy.revoke": "Revoke Access",
    "privacy.expired": "Expired",
    "privacy.granted": "Active Access",
    "privacy.purpose": "Purpose",
    "privacy.duration": "Duration",
    "privacy.scopes": "Data Scopes",
  },
  hi: {
    // Navigation & Shell
    "nav.home": "होम",
    "nav.appointments": "अपॉइंटमेंट",
    "nav.records": "स्वास्थ्य रिकॉर्ड",
    "nav.more": "अन्य सेवाएं",
    "nav.emergency": "आपातकालीन",
    "nav.prescriptions": "दवा पर्ची (Rx)",
    "nav.reports": "जांच रिपोर्ट",
    "nav.pharmacy": "दवाखाना (फार्मेसी)",
    "nav.bills": "अस्पताल बिल",
    "nav.profile": "प्रोफ़ाइल",
    "nav.settings": "सेटिंग्स",
    "nav.help": "सहायता",
    "nav.logout": "लॉग आउट",
    "nav.dashboard": "डैशबोर्ड",
    "nav.patients": "मरीज",
    "nav.schedule": "समय सारणी",
    "nav.consultations": "परामर्श",
    "nav.lab_orders": "लैब जांच",
    "nav.referrals": "रेफरल",
    "nav.departments": "विभाग",
    "nav.admissions": "भर्ती (एडमिशन)",
    "nav.staff": "स्टाफ",
    "nav.insurance": "बीमा (इंश्योरेंस)",
    "nav.policies": "पॉलिसी",
    "nav.claims": "दावे (क्लेम्स)",
    "nav.inventory": "दवा स्टॉक",
    "nav.dispensing": "दवा वितरण",

    // Common Headings & Actions
    "common.welcome": "स्वागत है",
    "common.good_morning": "सुप्रभात",
    "common.quick_actions": "त्वरित सेवाएं",
    "common.recent_activity": "हालिया स्वास्थ्य गतिविधियां",
    "common.upcoming_schedule": "आगामी कार्यक्रम",
    "common.no_appointments": "कोई आगामी अपॉइंटमेंट नहीं है",
    "common.no_records": "कोई स्वास्थ्य रिकॉर्ड उपलब्ध नहीं है",
    "common.view_all": "सभी देखें",
    "common.search_placeholder": "आईडी, नाम या शब्द द्वारा खोजें...",
    "common.active": "सक्रिय",
    "common.confirmed": "पुष्ट",
    "common.completed": "पूर्ण",
    "common.cancelled": "रद्द",
    "common.pending": "लंबित",
    "common.verified": "सत्यापित सक्रिय",
    "common.why_charged": "मुझसे यह शुल्क क्यों लिया गया? (विस्तार)",
    "common.sos_emergency": "आपातकालीन एसओएस सहायता",

    // Profile & Identity
    "profile.title": "मरीज स्वास्थ्य पासपोर्ट",
    "profile.completeness": "प्रोफ़ाइल पूर्णता",
    "profile.personal_info": "व्यक्तिगत जानकारी",
    "profile.contact_info": "संपर्क विवरण",
    "profile.address": "आवासीय पता",
    "profile.health_info": "प्राथमिक स्वास्थ्य जानकारी",
    "profile.emergency_contact": "आपातकालीन संपर्क",
    "profile.abha_title": "आयुष्मान भारत (ABHA)",
    "profile.aadhaar_verification": "आधार पहचान सत्यापन",
    "profile.edit": "संशोधन करें",
    "profile.save": "सुरक्षित करें",
    "profile.cancel": "रद्द करें",
    "profile.link_abha": "ABHA लिंक करें",
    "profile.manage_abha": "ABHA प्रबंधित करें",
    "profile.blood_group": "रक्त समूह",
    "profile.allergies": "ज्ञात एलर्जी",
    "profile.conditions": "पुरानी बीमारियां",
    "profile.sign_out": "लॉग आउट करें",

    // Privacy & Consent
    "privacy.title": "गोपनीयता एवं सहमति नियंत्रण केंद्र",
    "privacy.pending_requests": "लंबित सहमति अनुरोध",
    "privacy.active_permissions": "सक्रिय मेडिकल अनुमतियां",
    "privacy.connected_orgs": "जुड़े हुए स्वास्थ्य केंद्र",
    "privacy.correction_tracker": "पहचान सुधार अनुरोध",
    "privacy.audit_trail": "सुरक्षा एवं गोपनीयता ऑडिट लेजर",
    "privacy.allow": "पहुंच की अनुमति दें",
    "privacy.decline": "अस्वीकार करें",
    "privacy.revoke": "अनुमति वापस लें",
    "privacy.expired": "समाप्त",
    "privacy.granted": "सक्रिय पहुंच",
    "privacy.purpose": "उद्देश्य",
    "privacy.duration": "अवधि",
    "privacy.scopes": "डेटा श्रेणियां",
  },
  or: {
    // Navigation & Shell
    "nav.home": "ମୂଳପୃଷ୍ଠା",
    "nav.appointments": "ଡାକ୍ତରୀ ସାକ୍ଷାତ",
    "nav.records": "ସ୍ୱାସ୍ଥ୍ୟ ରେକର୍ଡ",
    "nav.more": "ଅନ୍ୟାନ୍ୟ ସେବା",
    "nav.emergency": "ଜରୁରୀକାଳୀନ",
    "nav.prescriptions": "ଔଷଧ ଚିଠା (Rx)",
    "nav.reports": "ପରୀକ୍ଷା ରିପୋର୍ଟ",
    "nav.pharmacy": "ଔଷଧାଳୟ",
    "nav.bills": "ହସପିଟାଲ ବିଲ୍",
    "nav.profile": "ପ୍ରୋଫାଇଲ୍",
    "nav.settings": "ସେଟିଙ୍ଗ୍ସ",
    "nav.help": "ସାହାଯ୍ୟ",
    "nav.logout": "ଲଗ୍ ଆଉଟ୍",
    "nav.dashboard": "ଡ୍ୟାସବୋର୍ଡ",
    "nav.patients": "ରୋଗୀ ତାଲିକା",
    "nav.schedule": "କାର୍ଯ୍ୟ ନିର୍ଘଣ୍ଟ",
    "nav.consultations": "ପରାମର୍ଶ",
    "nav.lab_orders": "ପରୀକ୍ଷା ଅର୍ଡର",
    "nav.referrals": "ରେଫରାଲ୍",
    "nav.departments": "ବିଭାଗ",
    "nav.admissions": "ଭର୍ତ୍ତି (ଆଡମିଶନ)",
    "nav.staff": "କର୍ମଚାରୀ",
    "nav.insurance": "ବୀମା ସେବା",
    "nav.policies": "ପଲିସି",
    "nav.claims": "କ୍ଲେମ୍",
    "nav.inventory": "ଔଷଧ ମହଜୁଦ",
    "nav.dispensing": "ଔଷଧ ବିତରଣ",

    // Common Headings & Actions
    "common.welcome": "ସ୍ୱାଗତମ୍",
    "common.good_morning": "ଶୁଭ ସକାଳ",
    "common.quick_actions": "ତ୍ୱରିତ ସେବା",
    "common.recent_activity": "ନିକଟ ଅତୀତର ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ",
    "common.upcoming_schedule": "ଆଗାମୀ କାର୍ଯ୍ୟକ୍ରମ",
    "common.no_appointments": "କୌଣସି ଆଗାମୀ ସାକ୍ଷାତ ନାହିଁ",
    "common.no_records": "କୌଣସି ସ୍ୱାସ୍ଥ୍ୟ ରେକର୍ଡ ନାହିଁ",
    "common.view_all": "ସବୁ ଦେଖନ୍ତୁ",
    "common.search_placeholder": "ଆଇଡି, ନାମ ବା ଶବ୍ଦ ଦ୍ୱାରା ଖୋଜନ୍ତୁ...",
    "common.active": "ସକ୍ରିୟ",
    "common.confirmed": "ନିଶ୍ଚିତ",
    "common.completed": "ସମ୍ପୂର୍ଣ୍ଣ",
    "common.cancelled": "ବାତିଲ",
    "common.pending": "ବକେୟା",
    "common.verified": "ପ୍ରମାଣିତ ସକ୍ରିୟ",
    "common.why_charged": "ଏହି ଶୁଳ୍କ କାହିଁକି ନିଆଗଲା? (ବିବରଣୀ)",
    "common.sos_emergency": "ଜରୁରୀକାଳୀନ SOS ସହାୟତା",

    // Profile & Identity
    "profile.title": "ରୋଗୀ ସ୍ୱାସ୍ଥ୍ୟ ପାସପୋର୍ଟ",
    "profile.completeness": "ପ୍ରୋଫାଇଲ୍ ପୂର୍ଣ୍ଣତା",
    "profile.personal_info": "ବ୍ୟକ୍ତିଗତ ବିବରଣୀ",
    "profile.contact_info": "ଯୋଗାଯୋଗ ବିବରଣୀ",
    "profile.address": "ବାସସ୍ଥାନ ଠିକଣା",
    "profile.health_info": "ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ",
    "profile.emergency_contact": "ଜରୁରୀକାଳୀନ ଯୋଗାଯୋଗ",
    "profile.abha_title": "ଆୟୁଷ୍ମାନ ଭାରତ (ABHA)",
    "profile.aadhaar_verification": "ଆଧାର ପରିଚୟ ପ୍ରମାଣୀକରଣ",
    "profile.edit": "ସଂଶୋଧନ କରନ୍ତୁ",
    "profile.save": "ସଂରକ୍ଷଣ କରନ୍ତୁ",
    "profile.cancel": "ବାତିଲ କରନ୍ତୁ",
    "profile.link_abha": "ABHA ସଂଯୋଗ କରନ୍ତୁ",
    "profile.manage_abha": "ABHA ପରିଚାଳନା",
    "profile.blood_group": "ରକ୍ତ ବର୍ଗ",
    "profile.allergies": "ଏଲର୍ଜି",
    "profile.conditions": "ପୁରୁଣା ରୋଗ",
    "profile.sign_out": "ଲଗ୍ ଆଉଟ୍ କରନ୍ତୁ",

    // Privacy & Consent
    "privacy.title": "ଗୋପନୀୟତା ଏବଂ ସମ୍ମତି ନିୟନ୍ତ୍ରଣ କେନ୍ଦ୍ର",
    "privacy.pending_requests": "ବକେୟା ସମ୍ମତି ଅନୁରୋଧ",
    "privacy.active_permissions": "ସକ୍ରିୟ ଚିକିତ୍ସା ଅନୁମତି",
    "privacy.connected_orgs": "ସଂଯୁକ୍ତ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର",
    "privacy.correction_tracker": "ପରିଚୟ ସଂଶୋଧନ ଅନୁରୋଧ",
    "privacy.audit_trail": "ସୁରକ୍ଷା ଓ ଗୋପନୀୟତା ଅଡିଟ୍ ଲେଜର",
    "privacy.allow": "ଅନୁମତି ଦିଅନ୍ତୁ",
    "privacy.decline": "ପ୍ରତ୍ୟାଖ୍ୟାନ କରନ୍ତୁ",
    "privacy.revoke": "ଅନୁମତି ପ୍ରତ୍ୟାହାର କରନ୍ତୁ",
    "privacy.expired": "ସମାପ୍ତ",
    "privacy.granted": "ସକ୍ରିୟ ପହଞ୍ଚ",
    "privacy.purpose": "ଉଦ୍ଦେଶ୍ୟ",
    "privacy.duration": "ସମୟ ସୀମା",
    "privacy.scopes": "ତଥ୍ୟ ବର୍ଗ",
  },
};

const STORAGE_KEY = "medora_preferred_language";

export function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === "en" || saved === "hi" || saved === "or")) {
      return saved as LanguageCode;
    }
  } catch (e) {
    // Local storage access error fallback
  }
  return "en";
}

export function setStoredLanguage(lang: LanguageCode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new Event("medora-language-change"));
  } catch (e) {
    // Local storage write error fallback
  }
}

export function t(key: string, lang: LanguageCode = "en"): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dictionary[key] || TRANSLATIONS.en[key] || key;
}

export function useLocalization() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>("en");

  useEffect(() => {
    setCurrentLang(getStoredLanguage());

    const handleLanguageChange = () => {
      setCurrentLang(getStoredLanguage());
    };

    window.addEventListener("medora-language-change", handleLanguageChange);
    return () => {
      window.removeEventListener("medora-language-change", handleLanguageChange);
    };
  }, []);

  const changeLanguage = (newLang: LanguageCode) => {
    setCurrentLang(newLang);
    setStoredLanguage(newLang);
  };

  const translate = (key: string) => t(key, currentLang);

  return {
    language: currentLang,
    changeLanguage,
    t: translate,
    languages: SUPPORTED_LANGUAGES,
  };
}
