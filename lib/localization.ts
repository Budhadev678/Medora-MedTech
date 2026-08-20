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

    // Clinical Record Core (Phase 4.2)
    "clinical.title": "Clinical Record",
    "clinical.chief_complaint": "Chief Complaint",
    "clinical.symptoms": "Symptoms",
    "clinical.vitals": "Vitals",
    "clinical.observations": "Observations",
    "clinical.notes": "Clinical Notes",
    "clinical.assessment": "Assessment",
    "clinical.diagnosis": "Diagnosis",
    "clinical.treatment_plan": "Treatment Plan",
    "clinical.follow_up": "Follow-up Plan",
    "clinical.draft": "Draft",
    "clinical.completed": "Completed",
    "clinical.amended": "Amended",
    "clinical.save_draft": "Save Draft",
    "clinical.complete_record": "Complete Record",
    "clinical.amend_record": "Amend Record",
    "clinical.no_symptoms": "No symptoms recorded.",
    "clinical.no_vitals": "No vitals recorded.",
    "clinical.no_diagnosis": "No diagnosis recorded.",
    "clinical.no_followup": "No follow-up plan recorded.",
    "clinical.unable_to_save": "Unable to save clinical record.",
    "clinical.try_again": "Try Again",

    // Prescriptions & Lab Orders (Phase 4.3)
    "prescription.title": "Electronic Prescription",
    "prescription.prescribed_by": "Prescribed by",
    "prescription.issued": "Issued",
    "prescription.cancelled": "Cancelled",
    "prescription.expired": "Expired",
    "prescription.draft": "Draft",
    "prescription.medicine": "Medicine",
    "prescription.strength": "Strength",
    "prescription.dosage": "Dosage",
    "prescription.route": "Route",
    "prescription.frequency": "Frequency",
    "prescription.duration": "Duration",
    "prescription.quantity": "Quantity",
    "prescription.instructions": "Instructions",
    "prescription.no_prescriptions": "No prescriptions found.",
    "prescription.issue_btn": "Issue Prescription",
    "prescription.save_draft": "Save Draft",
    "prescription.cancel_btn": "Cancel Prescription",
    "lab.title": "Laboratory Diagnostic Order",
    "lab.ordered_by": "Ordered by",
    "lab.test": "Diagnostic Test",
    "lab.priority": "Priority",
    "lab.routine": "Routine",
    "lab.urgent": "Urgent",
    "lab.ordered": "Ordered",
    "lab.no_orders": "No lab orders found.",
    "lab.place_order": "Place Lab Order",
    "lab.save_draft": "Save Draft",
    "lab.cancel_order": "Cancel Lab Order",
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

    // Clinical Record Core (Phase 4.2)
    "clinical.title": "चिकित्सकीय रिकॉर्ड",
    "clinical.chief_complaint": "मुख्य शिकायत",
    "clinical.symptoms": "लक्षण",
    "clinical.vitals": "शारीरिक माप (वाइटल्स)",
    "clinical.observations": "चिकित्सकीय अवलोकन",
    "clinical.notes": "चिकित्सकीय टिप्पणियां",
    "clinical.assessment": "चिकित्सकीय मूल्यांकन",
    "clinical.diagnosis": "रोग निदान (डायग्नोसिस)",
    "clinical.treatment_plan": "उपचार योजना",
    "clinical.follow_up": "पुनः परामर्श योजना",
    "clinical.draft": "प्रारूप (ड्राफ्ट)",
    "clinical.completed": "पूर्ण",
    "clinical.amended": "संशोधित",
    "clinical.save_draft": "ड्राफ्ट सुरक्षित करें",
    "clinical.complete_record": "रिकॉर्ड पूर्ण करें",
    "clinical.amend_record": "रिकॉर्ड संशोधित करें",
    "clinical.no_symptoms": "कोई लक्षण दर्ज नहीं हैं।",
    "clinical.no_vitals": "कोई शारीरिक माप दर्ज नहीं हैं।",
    "clinical.no_diagnosis": "कोई रोग निदान दर्ज नहीं है।",
    "clinical.no_followup": "कोई पुनः परामर्श योजना दर्ज नहीं है।",
    "clinical.unable_to_save": "क्लिनिकल रिकॉर्ड सुरक्षित करने में असमर्थ।",
    "clinical.try_again": "पुनः प्रयास करें",

    // Prescriptions & Lab Orders (Phase 4.3)
    "prescription.title": "डिजिटल दवा पर्चा (ई-प्रिस्क्रिप्शन)",
    "prescription.prescribed_by": "निर्धारित चिकित्सक",
    "prescription.issued": "जारी किया गया",
    "prescription.cancelled": "रद्द",
    "prescription.expired": "समाप्त",
    "prescription.draft": "प्रारूप",
    "prescription.medicine": "दवा",
    "prescription.strength": "मात्रा / क्षमता",
    "prescription.dosage": "खुराक",
    "prescription.route": "सेवन माध्यम",
    "prescription.frequency": "आवृत्ति / समय",
    "prescription.duration": "अवधि",
    "prescription.quantity": "कुल संख्या",
    "prescription.instructions": "निर्देश",
    "prescription.no_prescriptions": "कोई दवा पर्चा उपलब्ध नहीं है।",
    "prescription.issue_btn": "दवा पर्चा जारी करें",
    "prescription.save_draft": "ड्राफ्ट सुरक्षित करें",
    "prescription.cancel_btn": "दवा पर्चा रद्द करें",
    "lab.title": "नैदानिक प्रयोगशाला आदेश",
    "lab.ordered_by": "आदेशकर्ता चिकित्सक",
    "lab.test": "नैदानिक जांच",
    "lab.priority": "प्राथमिकता",
    "lab.routine": "सामान्य (रूटीन)",
    "lab.urgent": "अति आवश्यक (अर्जेंट)",
    "lab.ordered": "आदेशित",
    "lab.no_orders": "कोई प्रयोगशाला आदेश उपलब्ध नहीं है।",
    "lab.place_order": "जांच आदेश दर्ज करें",
    "lab.save_draft": "ड्राफ्ट सुरक्षित करें",
    "lab.cancel_order": "जांच आदेश रद्द करें",
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

    // Clinical Record Core (Phase 4.2)
    "clinical.title": "ଚିକିତ୍ସା ରେକର୍ଡ",
    "clinical.chief_complaint": "ମୁଖ୍ୟ ଅଭିଯୋଗ",
    "clinical.symptoms": "ଲକ୍ଷଣ",
    "clinical.vitals": "ଶାରୀରିକ ମାପ (ଭାଇଟାଲ୍ସ)",
    "clinical.observations": "ଚିକିତ୍ସା ଅନୁଧ୍ୟାନ",
    "clinical.notes": "ଡାକ୍ତରୀ ଟିପ୍ପଣୀ",
    "clinical.assessment": "ଡାକ୍ତରୀ ମୂଲ୍ୟାଙ୍କନ",
    "clinical.diagnosis": "ରୋଗ ନିର୍ଣ୍ଣୟ",
    "clinical.treatment_plan": "ଚିକିତ୍ସା ଯୋଜନା",
    "clinical.follow_up": "ପୁନଃ ପରାମର୍ଶ ଯୋଜନା",
    "clinical.draft": "ଡ୍ରାଫ୍ଟ",
    "clinical.completed": "ସମ୍ପୂର୍ଣ୍ଣ",
    "clinical.amended": "ସଂଶୋଧିତ",
    "clinical.save_draft": "ଡ୍ରାଫ୍ଟ ସାଇତନ୍ତୁ",
    "clinical.complete_record": "ରେକର୍ଡ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ",
    "clinical.amend_record": "ରେକର୍ଡ ସଂଶୋଧନ କରନ୍ତୁ",
    "clinical.no_symptoms": "କୌଣସି ଲକ୍ଷଣ ଦରଜ ହୋଇନାହିଁ।",
    "clinical.no_vitals": "କୌଣସି ଶାରୀରିକ ମାପ ଦରଜ ହୋଇନାହିଁ।",
    "clinical.no_diagnosis": "କୌଣସି ରୋଗ ନିର୍ଣ୍ଣୟ ଦରଜ ହୋଇନାହିଁ।",
    "clinical.no_followup": "କୌଣସି ପୁନଃ ପରାମର୍ଶ ଯୋଜନା ଦରଜ ହୋଇନାହିଁ।",
    "clinical.unable_to_save": "ଚିକିତ୍ସା ରେକର୍ଡ ସାଇତିବା ସମ୍ଭବ ହେଲାନାହିଁ।",
    "clinical.try_again": "ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ",

    // Prescriptions & Lab Orders (Phase 4.3)
    "prescription.title": "ଔଷଧ ଚିଠା (ଇ-ପ୍ରେସକ୍ରିପସନ୍)",
    "prescription.prescribed_by": "ପରାମର୍ଶଦାତା ଡାକ୍ତର",
    "prescription.issued": "ଜାରି କରାଯାଇଛି",
    "prescription.cancelled": "ବାତିଲ",
    "prescription.expired": "ସମୟ ସୀମା ସମାପ୍ତ",
    "prescription.draft": "ଡ୍ରାଫ୍ଟ",
    "prescription.medicine": "ଔଷଧ",
    "prescription.strength": "ପରିମାଣ / କ୍ଷମତା",
    "prescription.dosage": "ମାତ୍ରା",
    "prescription.route": "ସେବନ ପ୍ରଣାଳୀ",
    "prescription.frequency": "ସମୟ / ଆବୃତ୍ତି",
    "prescription.duration": "ସମୟସୀମା",
    "prescription.quantity": "ସଂଖ୍ୟା",
    "prescription.instructions": "ନିର୍ଦ୍ଦେଶାବଳୀ",
    "prescription.no_prescriptions": "କୌଣସି ଔଷଧ ଚିଠା ଉପଲବ୍ଧ ନାହିଁ।",
    "prescription.issue_btn": "ଔଷଧ ଚିଠା ଜାରି କରନ୍ତୁ",
    "prescription.save_draft": "ଡ୍ରାଫ୍ଟ ସାଇତନ୍ତୁ",
    "prescription.cancel_btn": "ଔଷଧ ଚିଠା ବାତିଲ କରନ୍ତୁ",
    "lab.title": "ଡାକ୍ତରୀ ପରୀକ୍ଷା ଅର୍ଡର",
    "lab.ordered_by": "ଅର୍ଡର ଦେଇଥିବା ଡାକ୍ତର",
    "lab.test": "ନିର୍ଣ୍ଣୟାତ୍ମକ ପରୀକ୍ଷା",
    "lab.priority": "ପ୍ରାଥମିକତା",
    "lab.routine": "ସାଧାରଣ (ରୁଟିନ୍)",
    "lab.urgent": "ଜରୁରୀ (ଅର୍ଜେଣ୍ଟ)",
    "lab.ordered": "ଅର୍ଡର କରାଯାଇଛି",
    "lab.no_orders": "କୌଣସି ପରୀକ୍ଷା ଅର୍ଡର ଉପଲବ୍ଧ ନାହିଁ।",
    "lab.place_order": "ପରୀକ୍ଷା ଅର୍ଡର କରନ୍ତୁ",
    "lab.save_draft": "ଡ୍ରାଫ୍ଟ ସାଇତନ୍ତୁ",
    "lab.cancel_order": "ପରୀକ୍ଷା ଅର୍ଡର ବାତିଲ କରନ୍ତୁ",
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
