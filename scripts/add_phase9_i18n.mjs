import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, "../locales");

const enAdditions = {
  _translationMeta: {
    status: "HUMAN_VERIFIED",
    reviewer: "THINAI Agronomy Board",
    safetyVerified: "true",
    note: "English source strings verified by agronomic specialists"
  },
  consent: {
    title: "Photo Sharing & Privacy Consent",
    subtitle: "Choose how your photo is shared with the extension officer",
    full: "Share Full Photo",
    cropped: "Share Cropped Leaf Only",
    blurred: "Share Blurred Background",
    metadataOnly: "Share Metadata Only (No Photo)",
    doNotShare: "Do Not Share Photo",
    withdraw: "Withdraw Consent",
    gpsPrompt: "Include field GPS coordinates for local pest mapping?"
  },
  symptom: {
    clarificationTitle: "Symptom Clarification",
    clarificationSubtitle: "Answer up to 3 quick questions to help refine advice",
    submitAnswers: "Confirm Answers",
    skip: "Skip Questions"
  },
  lowLiteracy: {
    audioGuide: "Listen to Audio Advice",
    callOfficer: "Need Help? Call Officer",
    plainLanguageDisclaimer: "Simple pictures and large buttons are provided to help every farmer understand advice safely."
  }
};

const taAdditions = {
  _translationMeta: {
    status: "HUMAN_VERIFIED",
    reviewer: "TNAU Tamil Agronomy Review Board",
    safetyVerified: "true",
    note: "Tamil translation verified by agronomic specialists"
  },
  consent: {
    title: "புகைப்பட பகிர்வு மற்றும் தனியுரிமை ஒப்புதல்",
    subtitle: "வேளாண் அலுவலருடன் புகைப்படம் எவ்வாறு பகிரப்பட வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்",
    full: "முழு புகைப்படத்தைப் பகிரவும்",
    cropped: "செதுக்கப்பட்ட இலை பகுதியை மட்டும் பகிரவும்",
    blurred: "மங்கலாக்கப்பட்ட பின்னணியுடன் பகிரவும்",
    metadataOnly: "விவரங்களை மட்டும் பகிரவும் (புகைப்படம் வேண்டாம்)",
    doNotShare: "புகைப்படத்தைப் பகிர வேண்டாம்",
    withdraw: "ஒப்புதலைத் திரும்பப் பெறுக",
    gpsPrompt: "பூச்சி வரைபடத்திற்காக வயலின் GPS இருப்பிடத்தைச் சேர்க்கவா?"
  },
  symptom: {
    clarificationTitle: "அறிகுறிகள் தெளிவுபடுத்தல்",
    clarificationSubtitle: "ஆலோசனையை மேம்படுத்த 3 எளிய கேள்விகளுக்கு பதிலளிக்கவும்",
    submitAnswers: "பதில்களை உறுதிசெய்",
    skip: "கேள்விகளைத் தவிர்"
  },
  lowLiteracy: {
    audioGuide: "ஆடியோ வழிகாட்டலைக் கேளுங்கள்",
    callOfficer: "உதவி தேவையா? அலுவலரை அழைக்கவும்",
    plainLanguageDisclaimer: "அனைத்து விவசாயிகளும் எளிதில் புரிந்துகொள்ள எளிய படங்களும் பெரிய பொத்தான்களும் வழங்கப்பட்டுள்ளன."
  }
};

const hiAdditions = {
  _translationMeta: {
    status: "MACHINE_DRAFT",
    reviewer: "UNREVIEWED_MACHINE_GENERATED",
    safetyVerified: "false",
    note: "Machine-drafted translation. Chemical advice and dosages are withheld until human expert verification."
  },
  consent: {
    title: "फोटो साझाकरण व गोपनीयता सहमति",
    subtitle: "अधिकारी के साथ फोटो साझा करने का तरीका चुनें",
    full: "पूरी फोटो साझा करें",
    cropped: "केवल पत्ती का भाग साझा करें",
    blurred: "धुंधली पृष्ठभूमि के साथ साझा करें",
    metadataOnly: "केवल विवरण साझा करें (फोटो नहीं)",
    doNotShare: "फोटो साझा न करें",
    withdraw: "सहमति वापस लें",
    gpsPrompt: "कीट मानचित्रण हेतु जीपीएस स्थान शामिल करें?"
  },
  symptom: {
    clarificationTitle: "लक्षण स्पष्टीकरण",
    clarificationSubtitle: "सटीक सलाह के लिए 3 सरल प्रश्नों के उत्तर दें",
    submitAnswers: "उत्तर की पुष्टि करें",
    skip: "प्रश्न छोड़ें"
  },
  lowLiteracy: {
    audioGuide: "ऑडियो सलाह सुनें",
    callOfficer: "मदद चाहिए? अधिकारी को फोन करें",
    plainLanguageDisclaimer: "सभी किसानों की सुविधा हेतु सरल चित्र व बड़े बटन प्रदान किए गए हैं।"
  }
};

const teAdditions = {
  _translationMeta: {
    status: "MACHINE_DRAFT",
    reviewer: "UNREVIEWED_MACHINE_GENERATED",
    safetyVerified: "false",
    note: "Machine-drafted translation. Chemical advice and dosages are withheld until human expert verification."
  },
  consent: {
    title: "ఫోటో షేరింగ్ మరియు గోప్యతా సమ్మతి",
    subtitle: "అధికారితో ఫోటోను ఎలా పంచుకోవాలో ఎంచుకోండి",
    full: "పూర్తి ఫోటోను భాగస్వామ్యం చేయండి",
    cropped: "కత్తిరించిన ఆకు భాగాన్ని మాత్రమే పంచుకోండి",
    blurred: "మసకబారిన నేపథ్యంతో పంచుకోండి",
    metadataOnly: "వివరాలను మాత్రమే పంచుకోండి (ఫోటో వద్దు)",
    doNotShare: "ఫోటోను పంచుకోవద్దు",
    withdraw: "సమ్మతిని ఉపసంహరించుకోండి",
    gpsPrompt: "తెగుళ్ల మ్యాపింగ్ కోసం జీపీఎస్ స్థానాన్ని చేర్చాలా?"
  },
  symptom: {
    clarificationTitle: "లక్షణాల స్పష్టత",
    clarificationSubtitle: "సలహాను మెరుగుపరచడానికి 3 ప్రశ్నలకు సమాధానం ఇవ్వండి",
    submitAnswers: "సమాధానాలను నిర్ధారించండి",
    skip: "ప్రశ్నలను దాటవేయి"
  },
  lowLiteracy: {
    audioGuide: "ఆడియో సలహాను వినండి",
    callOfficer: "సహాయం కావాలా? అధికారికి కాల్ చేయండి",
    plainLanguageDisclaimer: "రైతులందరి సౌలభ్యం కోసం సాధారణ చిత్రాలు మరియు పెద్ద బటన్లు అందించబడ్డాయి."
  }
};

const knAdditions = {
  _translationMeta: {
    status: "MACHINE_DRAFT",
    reviewer: "UNREVIEWED_MACHINE_GENERATED",
    safetyVerified: "false",
    note: "Machine-drafted translation. Chemical advice and dosages are withheld until human expert verification."
  },
  consent: {
    title: "ಫೋಟೋ ಹಂಚಿಕೆ ಮತ್ತು ಗೌಪ್ಯತೆ ಸಮ್ಮತಿ",
    subtitle: "ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಫೋಟೋವನ್ನು ಹೇಗೆ ಹಂಚಿಕೊಳ್ಳಬೇಕೆಂದು ಆಯ್ಕೆಮಾಡಿ",
    full: "ಸಂಪೂರ್ಣ ಫೋಟೋ ಹಂಚಿಕೊಳ್ಳಿ",
    cropped: "ಕತ್ತರಿಸಿದ ಎಲೆಯ ಭಾಗವನ್ನು ಮಾತ್ರ ಹಂಚಿಕೊಳ್ಳಿ",
    blurred: "ಮಸುಕಾದ ಹಿನ್ನೆಲೆಯೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ",
    metadataOnly: "ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ಹಂಚಿಕೊಳ್ಳಿ (ಫೋಟೋ ಬೇಡ)",
    doNotShare: "ಫೋಟೋ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ",
    withdraw: "ಸಮ್ಮತಿಯನ್ನು ಹಿಂಪಡೆಯಿರಿ",
    gpsPrompt: "ಕೀಟ ಮ್ಯಾಪಿಂಗ್‌ಗಾಗಿ ಜಿಪಿಎಸ್ ಸ್ಥಳವನ್ನು ಸೇರಿಸಬೇಕೆ?"
  },
  symptom: {
    clarificationTitle: "ರೋಗಲಕ್ಷಣಗಳ ಸ್ಪಷ್ಟನೆ",
    clarificationSubtitle: "ಸಲಹೆಯನ್ನು ಸುಧಾರಿಸಲು 3 ಸರಳ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ",
    submitAnswers: "ಉತ್ತರಗಳನ್ನು ದೃಢೀಕರಿಸಿ",
    skip: "ಪ್ರಶ್ನೆಗಳನ್ನು ಬಿಟ್ಟುಬಿಡಿ"
  },
  lowLiteracy: {
    audioGuide: "ಆಡಿಯೋ ಸಲಹೆಯನ್ನು ಆಲಿಸಿ",
    callOfficer: "ಸಹಾಯ ಬೇಕೇ? ಅಧಿಕಾರಿಗೆ ಕರೆ ಮಾಡಿ",
    plainLanguageDisclaimer: "ಎಲ್ಲಾ ರೈತರ ಅನುಕೂಲಕ್ಕಾಗಿ ಸರಳ ಚಿತ್ರಗಳು ಮತ್ತು ದೊಡ್ಡ ಗುಂಡಿಗಳನ್ನು ಒದಗಿಸಲಾಗಿದೆ."
  }
};

const mlAdditions = {
  _translationMeta: {
    status: "MACHINE_DRAFT",
    reviewer: "UNREVIEWED_MACHINE_GENERATED",
    safetyVerified: "false",
    note: "Machine-drafted translation. Chemical advice and dosages are withheld until human expert verification."
  },
  consent: {
    title: "ഫോട്ടോ പങ്കിടലും സ്വകാര്യതാ സമ്മതവും",
    subtitle: "ഓഫീസറുമായി ഫോട്ടോ എങ്ങനെ പങ്കിടണമെന്ന് തിരഞ്ഞെടുക്കുക",
    full: "മുഴുവൻ ഫോട്ടോയും പങ്കിടുക",
    cropped: "മുറിച്ച ഇലയുടെ ഭാഗം മാത്രം പങ്കിടുക",
    blurred: "മങ്ങിയ പശ്ചാത്തലത്തോടെ പങ്കിടുക",
    metadataOnly: "വിവരങ്ങൾ മാത്രം പങ്കിടുക (ഫോട്ടോ വേണ്ട)",
    doNotShare: "ഫോട്ടോ പങ്കിടരുത്",
    withdraw: "സമ്മതം പിൻവലിക്കുക",
    gpsPrompt: "കീടനിയന്ത്രണ മാപ്പിംഗിനായി ജിപിഎസ് ലൊക്കേഷൻ ഉൾപ്പെടുത്തണോ?"
  },
  symptom: {
    clarificationTitle: "രോഗലക്ഷണ വ്യക്തത",
    clarificationSubtitle: "ഉപദേശം മെച്ചപ്പെടുത്താൻ 3 ലളിതമായ ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക",
    submitAnswers: "ഉത്തരങ്ങൾ സ്ഥിരീകരിക്കുക",
    skip: "ചോദ്യങ്ങൾ ഒഴിവാക്കുക"
  },
  lowLiteracy: {
    audioGuide: "ഓഡിയോ നിർദ്ദേശം കേൾക്കുക",
    callOfficer: "സഹായം വേണോ? ഓഫീസറെ വിളിക്കുക",
    plainLanguageDisclaimer: "കർഷകർക്ക് എളുപ്പത്തിൽ മനസ്സിലാക്കാൻ ലളിതമായ ചിത്രങ്ങളും വലിയ ബട്ടണുകളും നൽകിയിരിക്കുന്നു."
  }
};

const langSpecific = {
  en: enAdditions,
  ta: taAdditions,
  hi: hiAdditions,
  te: teAdditions,
  kn: knAdditions,
  ml: mlAdditions
};

const safetyExtra = {
  safetyVerifiedBadge: {
    en: "Safety Verified",
    ta: "பாதுகாப்பு சரிபார்க்கப்பட்டது",
    default: "Safety Verified"
  },
  unverifiedSafetyNotice: {
    en: "Safety-critical instructions are available in English/Tamil. Please contact an extension officer before using any pesticide.",
    ta: "பாதுகாப்பான மருந்தளவு வழிமுறைகள் ஆங்கிலம்/தமிழில் உள்ளன. பூச்சிக்கொல்லிகளைப் பயன்படுத்தும் முன் வேளாண் அலுவலரை அணுகவும்.",
    default: "Safety-critical instructions are available in English/Tamil. Please contact an extension officer before using any pesticide."
  }
};

const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json") && f !== "status.json" && f !== "glossary.json");

for (const file of files) {
  const code = file.replace(".json", "");
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const additions = langSpecific[code] || {
    _translationMeta: {
      status: "MACHINE_DRAFT",
      reviewer: "UNREVIEWED_MACHINE_GENERATED",
      safetyVerified: "false",
      note: `Machine-drafted translation for ${code}. Chemical advice withheld until human verification.`
    },
    consent: { ...enAdditions.consent },
    symptom: { ...enAdditions.symptom },
    lowLiteracy: { ...enAdditions.lowLiteracy }
  };

  data._translationMeta = additions._translationMeta;
  data.consent = additions.consent;
  data.symptom = additions.symptom;
  data.lowLiteracy = additions.lowLiteracy;

  data.safety = data.safety || {};
  data.safety.safetyVerifiedBadge = safetyExtra.safetyVerifiedBadge[code] || safetyExtra.safetyVerifiedBadge.default;
  data.safety.unverifiedSafetyNotice = safetyExtra.unverifiedSafetyNotice[code] || safetyExtra.unverifiedSafetyNotice.default;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Updated locale file: ${file}`);
}

console.log("All locale files successfully updated with Phase 9 keys!");
