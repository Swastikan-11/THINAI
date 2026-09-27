// THINAI Centralized 6-Language i18n System
// Supporting: English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം)

export type AppLanguage = "English" | "Tamil" | "Hindi" | "Telugu" | "Kannada" | "Malayalam";

export interface LanguageOption {
  code: string;
  name: AppLanguage;
  nativeName: string;
  speechLocale: "en-IN" | "ta-IN" | "hi-IN" | "te-IN" | "kn-IN" | "ml-IN";
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", speechLocale: "en-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechLocale: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechLocale: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechLocale: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechLocale: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechLocale: "ml-IN" }
];

const STORAGE_KEY = "thinai_selected_language";

export function getPersistedLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.name === saved)) {
      return saved as AppLanguage;
    }
  } catch {}
  return "English";
}

export function persistLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

export const I18N_STRINGS: Record<AppLanguage, Record<string, string>> = {
  English: {
    // Nav
    navHome: "Home",
    navDiary: "Diary",
    navAI: "AI Advisor",
    navScan: "Scan Crop",
    navProfile: "Farm Profile",
    navSettings: "Settings",
    navWeather: "Weather",
    navMarket: "Market",
    navSchemes: "Schemes",

    // Dashboard Core Sections
    farmStatus: "FARM STATUS",
    currentConditions: "CURRENT CONDITIONS",
    topRisk: "TOP RISK ALERT",
    nextBestAction: "NEXT BEST ACTION",
    whyThisAction: "WHY THIS ACTION?",
    takeAction: "TAKE ACTION",
    feedbackLoop: "FEEDBACK & FARM HISTORY",
    completed: "Completed",
    markDone: "Mark Done",
    actionTaken: "Action Taken",
    askAIWhy: "Ask AI Why?",
    alternativeAction: "Alternative Action",
    supportingFactors: "Supporting Factors",
    riskMitigated: "Risk Mitigated",
    confidence: "Confidence",
    systemConfidence: "Model & Agronomic Confidence",
    impact: "Estimated Impact",
    whenToAct: "When to Act",

    // Farm Profile
    farmerName: "Farmer Name",
    district: "District",
    state: "State",
    farmSize: "Farm Size",
    acres: "Acres",
    soilType: "Soil Type",
    primaryCrop: "Primary Crop",
    cropVariety: "Crop Variety",
    sowingDate: "Sowing Date",
    cropStage: "Crop Stage",
    irrigationType: "Irrigation Type",
    paddy: "Paddy (Rice)",
    tillering: "Tillering Stage",
    clayLoam: "Clay Loam",
    editProfile: "Edit Farm Profile",
    saveChanges: "Save Profile",

    // Weather
    liveWeather: "Live Micro-Climate Weather",
    temperature: "Temperature",
    humidity: "Humidity",
    rainForecast: "Rainfall Forecast (48h)",
    windSpeed: "Wind Speed",
    soilMoisture: "Soil Moisture Index",
    offlineNotice: "Displaying cached weather data",
    refreshWeather: "Refresh Weather",

    // Market
    marketIntelligence: "Market Price Intelligence",
    commodity: "Commodity",
    currentPrice: "Current Mandi Price",
    priceTrend: "7-Day Price Trend",
    mandiSource: "Regional APMC Benchmark Feed",
    sellHoldSignal: "Recommendation Signal",
    holdRecommendation: "HOLD — Upward Price Momentum",
    sellRecommendation: "SELL — Peak Price Window",
    simulatedDisclaimer: "Benchmark / Historical Mandi Feed (Simulated for Prototype Demo)",

    // Disease Scan
    scanTitle: "Crop Disease Diagnosis",
    takePhoto: "Take Photo",
    uploadImage: "Upload Image",
    analyzingFoliage: "Analyzing leaf pixels & morphology...",
    healthyLeaf: "Healthy Crop - No Pathogen Detected",
    diseaseDetected: "Disease Pathogen Detected",
    severity: "Severity Level",
    symptoms: "Observed Symptoms",
    immediateRemedy: "Immediate Action Required",
    organicSolution: "Organic Treatment",
    chemicalSolution: "Chemical Treatment",
    prevention: "Preventive Measures",
    retakePhoto: "Re-take Photo",
    accuracyNote: "PlantVillage Benchmark: 92.4% test validation accuracy",
    unableToDetermine: "Unable to Determine Reliably",
    poorQualityMsg: "Please take a clear close-up photo of the affected leaf in good daylight.",

    // Farm Diary
    diaryTitle: "Farm Activity Diary",
    addActivity: "Log Activity",
    activityType: "Activity Type",
    notes: "Observations / Notes",
    cost: "Expense (₹)",
    date: "Date",
    saveActivity: "Save to Diary",

    // AI Advisor
    aiAdvisorTitle: "THINAI Agricultural AI Advisor",
    askAnything: "Ask about irrigation, pest control, weather...",
    send: "Send",
    speak: "Speak",
    listening: "Listening...",
    demoPrompt: "What should I do today?",

    // Offline & System
    offlineBanner: "Offline Mode — Using cached farm profile and recommendations. Live feeds paused.",
    onlineRestored: "Network restored. Live data synchronized.",
    demoLogin: "Demo Login (Coimbatore Paddy Farm)",
    signOut: "Sign Out",
    languageSelector: "Change Language"
  },

  Tamil: {
    // Nav
    navHome: "முகப்பு",
    navDiary: "பண்ணை நாட்குறிப்பு",
    navAI: "AI ஆலோசகர்",
    navScan: "பயிர் ஸ்கேன்",
    navProfile: "பண்ணை சுயவிவரம்",
    navSettings: "அமைப்புகள்",
    navWeather: "வானிலை",
    navMarket: "சந்தை விலை",
    navSchemes: "திட்டங்கள்",

    // Dashboard Core Sections
    farmStatus: "பண்ணை நிலைமை",
    currentConditions: "தற்போதைய சூழல்",
    topRisk: "முக்கிய ஆபத்து எச்சரிக்கை",
    nextBestAction: "அடுத்த சிறந்த நடவடிக்கை",
    whyThisAction: "இந்த நடவடிக்கை ஏன்?",
    takeAction: "நடவடிக்கை எடுக்கவும்",
    feedbackLoop: "கருத்து & பண்ணை வரலாறு",
    completed: "நிறைவுற்றது",
    markDone: "செய்து முடித்தேன்",
    actionTaken: "செயல்படுத்தப்பட்டது",
    askAIWhy: "AI-யிடம் காரணம் கேளுங்கள்",
    alternativeAction: "மாற்று நடவடிக்கை",
    supportingFactors: "துணை காரணிகள்",
    riskMitigated: "தவிர்க்கப்படும் ஆபத்து",
    confidence: "நம்பகத்தன்மை",
    systemConfidence: "மாதிரி & வேளாண் அறிவியல் நம்பகத்தன்மை",
    impact: "எதிர்பார்க்கப்படும் பலன்",
    whenToAct: "எப்போது செய்ய வேண்டும்",

    // Farm Profile
    farmerName: "விவசாயி பெயர்",
    district: "மாவட்டம்",
    state: "மாநிலம்",
    farmSize: "பண்ணை அளவு",
    acres: "ஏக்கர்",
    soilType: "மண் வகை",
    primaryCrop: "முதன்மை பயிர்",
    cropVariety: "பயிர் ரகம்",
    sowingDate: "விதைத்த தேதி",
    cropStage: "பயிர் பருவம்",
    irrigationType: "பாசன முறை",
    paddy: "நெல் (Paddy)",
    tillering: "தூர்கட்டும் பருவம்",
    clayLoam: "களிமண் கலந்த வண்டல் மண்",
    editProfile: "விவரங்களை திருத்து",
    saveChanges: "சேமிக்கவும்",

    // Weather
    liveWeather: "நேரடி வேளாண் வானிலை",
    temperature: "வெப்பநிலை",
    humidity: "காற்றின் ஈரப்பதம்",
    rainForecast: "மழை கணிப்பு (48 மணி)",
    windSpeed: "காற்றின் வேகம்",
    soilMoisture: "மண் ஈரப்பத குறியீடு",
    offlineNotice: "சேமிக்கப்பட்ட வானிலை காட்டப்படுகிறது",
    refreshWeather: "வானிலை புதுப்பி",

    // Market
    marketIntelligence: "சந்தை விலை நிலவரம்",
    commodity: "விளைபொருள்",
    currentPrice: "தற்போதைய மண்டி விலை",
    priceTrend: "7 நாள் விலை போக்கு",
    mandiSource: "மண்டல APMC அளவீடு",
    sellHoldSignal: "விற்பனை பரிந்துரை",
    holdRecommendation: "பொறுத்திருங்கள் — விலை உயரும் வாய்ப்பு",
    sellRecommendation: "விற்கலாம் — உச்ச விலை காலம்",
    simulatedDisclaimer: "மாதிரி / வரலாற்று மண்டி தரவு (டெமோவுக்கானது)",

    // Disease Scan
    scanTitle: "பயிர் நோய் கண்டறிதல்",
    takePhoto: "புகைப்படம் எடு",
    uploadImage: "படம் பதிவேற்று",
    analyzingFoliage: "இலையின் நிறம் மற்றும் வடிவத்தை ஆய்வு செய்கிறது...",
    healthyLeaf: "ஆரோக்கியமான பயிர் - நோய் இல்லை",
    diseaseDetected: "பயிர் நோய் கண்டறியப்பட்டுள்ளது",
    severity: "தீவிரத்தன்மை",
    symptoms: "கண்டறியப்பட்ட அறிகுறிகள்",
    immediateRemedy: "உடனடி நடவடிக்கை",
    organicSolution: "இயற்கை மருத்துவம்",
    chemicalSolution: "ரசாயன மருந்து",
    prevention: "தடுப்பு முறைகள்",
    retakePhoto: "மீண்டும் படம் எடுக்க",
    accuracyNote: "PlantVillage ஆய்வுத் தரவு: 92.4% துல்லியம்",
    unableToDetermine: "துல்லியமாக கணிக்க முடியவில்லை",
    poorQualityMsg: "தயவுசெய்து நல்ல வெளிச்சத்தில் பாதிக்கப்பட்ட இலையை தெளிவாக படம் எடுக்கவும்.",

    // Farm Diary
    diaryTitle: "பண்ணை நாட்குறிப்பு",
    addActivity: "பணி பதிவு செய்",
    activityType: "பணி வகை",
    notes: "குறிப்புகள்",
    cost: "செலவு (₹)",
    date: "தேதி",
    saveActivity: "நாட்குறிப்பில் சேமி",

    // AI Advisor
    aiAdvisorTitle: "THINAI வேளாண் AI ஆலோசகர்",
    askAnything: "பாசனம், உரம், பூச்சி தாக்குதல் பற்றி கேளுங்கள்...",
    send: "அனுப்பு",
    speak: "பேசவும்",
    listening: "கேட்கிறது...",
    demoPrompt: "இன்று நான் என்ன செய்ய வேண்டும்?",

    // Offline & System
    offlineBanner: "ஆஃப்லைன் பயன்முறை — சேமிக்கப்பட்ட தரவு பயன்படுத்தப்படுகிறது.",
    onlineRestored: "இணைய இணைப்பு மீண்டும் கிடைத்தது. தரவு புதுப்பிக்கப்பட்டது.",
    demoLogin: "டெமோ உள்நுழைவு (கோயம்புத்தூர் நெல் பண்ணை)",
    signOut: "வெளியேறு",
    languageSelector: "மொழியை மாற்றவும்"
  },

  Hindi: {
    // Nav
    navHome: "होम",
    navDiary: "फार्म डायरी",
    navAI: "AI सलाहकार",
    navScan: "रोग पहचान",
    navProfile: "फार्म प्रोफाइल",
    navSettings: "सेटिंग्स",
    navWeather: "मौसम",
    navMarket: "मंडी भाव",
    navSchemes: "सरकारी योजनाएं",

    // Dashboard Core Sections
    farmStatus: "फार्म की स्थिति",
    currentConditions: "वर्तमान मौसमी स्थिति",
    topRisk: "मुख्य जोखिम चेतावनी",
    nextBestAction: "अगला सर्वोत्तम कदम (NEXT BEST ACTION)",
    whyThisAction: "यह कदम क्यों?",
    takeAction: "कदम उठाएं",
    feedbackLoop: "फीडबैक एवं फार्म इतिहास",
    completed: "पूर्ण हुआ",
    markDone: "कार्य पूरा किया",
    actionTaken: "कार्रवाई की गई",
    askAIWhy: "AI से कारण पूछें",
    alternativeAction: "वैकल्पिक कार्रवाई",
    supportingFactors: "सहायक कारक",
    riskMitigated: "निवारित जोखिम",
    confidence: "विश्वास स्तर",
    systemConfidence: "मॉडल और कृषि वैज्ञानिक विश्वास स्तर",
    impact: "अनुमानित लाभ",
    whenToAct: "कब करना है",

    // Farm Profile
    farmerName: "किसान का नाम",
    district: "ज़िला",
    state: "राज्य",
    farmSize: "खेत का आकार",
    acres: "एकड़",
    soilType: "मिट्टी का प्रकार",
    primaryCrop: "मुख्य फसल",
    cropVariety: "फसल किस्म",
    sowingDate: "बुवाई की तारीख",
    cropStage: "फसल अवस्था",
    irrigationType: "सिंचाई प्रकार",
    paddy: "धान (Paddy)",
    tillering: "कल्ले फूटने की अवस्था (Tillering)",
    clayLoam: "चिकनी दोमट मिट्टी",
    editProfile: "प्रोफ़ाइल बदलें",
    saveChanges: "सहेजें",

    // Weather
    liveWeather: "लाइव कृषि मौसम",
    temperature: "तापमान",
    humidity: "हवा में नमी",
    rainForecast: "वर्षा का अनुमान (48 घंटे)",
    windSpeed: "हवा की गति",
    soilMoisture: "मिट्टी की नमी सूचकांक",
    offlineNotice: "कैश किया गया मौसम डेटा प्रदर्शित हो रहा है",
    refreshWeather: "मौसम ताज़ा करें",

    // Market
    marketIntelligence: "मंडी भाव विश्लेषण",
    commodity: "फसल",
    currentPrice: "वर्तमान मंडी भाव",
    priceTrend: "7-दिवसीय मूल्य रुझान",
    mandiSource: "क्षेत्रीय APMC बेंचमार्क",
    sellHoldSignal: "बिक्री संकेत",
    holdRecommendation: "रोकें (HOLD) — मूल्य वृद्धि की संभावना",
    sellRecommendation: "बेचें (SELL) — उच्च मूल्य अवसर",
    simulatedDisclaimer: "बेंचमार्क / ऐतिहासिक मंडी डेटा (प्रोटोटाइप डेमो)",

    // Disease Scan
    scanTitle: "फसल रोग पहचान",
    takePhoto: "फोटो खींचें",
    uploadImage: "फोटो अपलोड करें",
    analyzingFoliage: "पत्ती और लक्षणों का विश्लेषण हो रहा है...",
    healthyLeaf: "स्वस्थ फसल - कोई रोग नहीं",
    diseaseDetected: "फसल रोग का पता चला",
    severity: "गंभीरता",
    symptoms: "दिखने वाले लक्षण",
    immediateRemedy: "तत्काल उपाय",
    organicSolution: "जैविक उपचार",
    chemicalSolution: "रासायनिक उपचार",
    prevention: "बचाव के उपाय",
    retakePhoto: "पुनः फोटो लें",
    accuracyNote: "PlantVillage परीक्षण मान्यता सटीकता: 92.4%",
    unableToDetermine: "विश्वसनीय रूप से निर्धारण असंभव",
    poorQualityMsg: "कृपया अच्छी रोशनी में प्रभावित पत्ती की स्पष्ट और नज़दीकी फोटो लें।",

    // Farm Diary
    diaryTitle: "फार्म गतिविधि डायरी",
    addActivity: "गतिविधि दर्ज करें",
    activityType: "कार्य प्रकार",
    notes: "टिप्पणी",
    cost: "लागत (₹)",
    date: "दिनांक",
    saveActivity: "डायरी में सहेजें",

    // AI Advisor
    aiAdvisorTitle: "THINAI कृषि AI सलाहकार",
    askAnything: "सिंचाई, उर्वरक, कीट नियंत्रण के बारे में पूछें...",
    send: "भेजें",
    speak: "बोलें",
    listening: "सुन रहे हैं...",
    demoPrompt: "आज मुझे क्या करना चाहिए?",

    // Offline & System
    offlineBanner: "ऑफ़लाइन मोड — कैश किया गया डेटा उपयोग हो रहा है।",
    onlineRestored: "इंटरनेट कनेक्शन बहाल हुआ। डेटा अपडेट हो गया।",
    demoLogin: "डेमो लॉगिन (कोयंबटूर धान फार्म)",
    signOut: "लॉग आउट",
    languageSelector: "भाषा बदलें"
  },

  Telugu: {
    // Nav
    navHome: "హోమ్",
    navDiary: "వ్యవసాయ డైరీ",
    navAI: "AI సలహాదారు",
    navScan: "తెగులు గుర్తింపు",
    navProfile: "రైతు ప్రొఫైల్",
    navSettings: "సెట్టింగులు",
    navWeather: "వాతావరణం",
    navMarket: "మార్కెట్ ధరలు",
    navSchemes: "పథకాలు",

    // Dashboard Core Sections
    farmStatus: "పొలం పరిస్థితి",
    currentConditions: "ప్రస్తుత పరిస్థితులు",
    topRisk: "ప్రధాన ప్రమాద హెచ్చరిక",
    nextBestAction: "తదుపరి ఉత్తమ చర్య (NEXT BEST ACTION)",
    whyThisAction: "ఈ చర్య ఎందుకు?",
    takeAction: "చర్య తీసుకోండి",
    feedbackLoop: "ఫీడ్‌బ్యాక్ & చరిత్ర",
    completed: "పూర్తయింది",
    markDone: "పూర్తయిందిగా గుర్తించు",
    actionTaken: "చర్య తీసుకున్నారు",
    askAIWhy: "AIని కారణం అడగండి",
    alternativeAction: "ప్రత్యామ్నాయ చర్య",
    supportingFactors: "సహాయక అంశాలు",
    riskMitigated: "నివారించబడే ప్రమాదం",
    confidence: "విశ్వసనీయత",
    systemConfidence: "వ్యవసాయ శాస్త్రీయ విశ్వసనీయత",
    impact: "అంచనా వేసిన ప్రయోజనం",
    whenToAct: "ఎప్పుడు చేయాలి",

    // Farm Profile
    farmerName: "రైతు పేరు",
    district: "జిల్లా",
    state: "రాష్ట్రం",
    farmSize: "పొలం విస్తీర్ణం",
    acres: "ఎకరాలు",
    soilType: "నేల రకం",
    primaryCrop: "ప్రధాన పంట",
    cropVariety: "పంట రకం",
    sowingDate: "విత్తిన తేదీ",
    cropStage: "పంట దశ",
    irrigationType: "నీటిపారుదల",
    paddy: "వరి (Paddy)",
    tillering: "పిలకల దశ (Tillering)",
    clayLoam: "బంకమట్టి రేగడి",
    editProfile: "ప్రొఫైల్ మార్చు",
    saveChanges: "భద్రపరచు",

    // Weather
    liveWeather: "ప్రత్యక్ష వాతావరణం",
    temperature: "ఉష్ణోగ్రత",
    humidity: "తేమ",
    rainForecast: "వర్ష సూచన (48 గంటలు)",
    windSpeed: "గాలి వేగం",
    soilMoisture: "నేల తేమ సూచిక",
    offlineNotice: "కాష్ చేసిన వాతావరణం చూపబడుతోంది",
    refreshWeather: "తాజాకరించు",

    // Market
    marketIntelligence: "మార్కెట్ సమాచారం",
    commodity: "దిగుబడి",
    currentPrice: "ప్రస్తుత ధర",
    priceTrend: "7 రోజుల ధరల ధోరణి",
    mandiSource: "ప్రాంతీయ మార్కెట్ రేటు",
    sellHoldSignal: "సిఫార్సు",
    holdRecommendation: "ఆగండి (HOLD) — ధరలు పెరిగే అవకాశం",
    sellRecommendation: "అమ్మండి (SELL) — సరైన సమయం",
    simulatedDisclaimer: "మార్కెట్ నమూనా డేటా (డెమో కోసం)",

    // Disease Scan
    scanTitle: "పంట తెగులు నిర్ధారణ",
    takePhoto: "ఫోటో తీయండి",
    uploadImage: "అప్‌లోడ్ చేయండి",
    analyzingFoliage: "ఆకు లక్షణాలను విశ్లేషిస్తోంది...",
    healthyLeaf: "ఆరోగ్యకరమైన పంట - తెగులు లేదు",
    diseaseDetected: "తెగులు గుర్తించబడింది",
    severity: "తీవ్రత",
    symptoms: "కనిపించే లక్షణాలు",
    immediateRemedy: "తక్షణ చర్య",
    organicSolution: "సేంద్రీయ నివారణ",
    chemicalSolution: "రసాయన మందు",
    prevention: "ముందస్తు జాగ్రత్తలు",
    retakePhoto: "మళ్ళీ ఫోటో తీయండి",
    accuracyNote: "PlantVillage ఖచ్చితత్వం: 92.4%",
    unableToDetermine: "నిర్ధారించడం సాధ్యం కాలేదు",
    poorQualityMsg: "దయచేసి మంచి వెలుతురులో ఆకును దగ్గరగా ఫోటో తీయండి.",

    // Farm Diary
    diaryTitle: "వ్యవసాయ డైరీ",
    addActivity: "పని నమోదు చేయండి",
    activityType: "పని రకం",
    notes: "గమనికలు",
    cost: "ఖర్చు (₹)",
    date: "తేదీ",
    saveActivity: "డైరీలో భద్రపరచు",

    // AI Advisor
    aiAdvisorTitle: "THINAI AI సలహాదారు",
    askAnything: "నీటిపారుదల, ఎరువులు, తెగుళ్ల గురించి అడగండి...",
    send: "పంపు",
    speak: "మాట్లాడండి",
    listening: "వింటోంది...",
    demoPrompt: "ఈరోజు నేను ఏమి చేయాలి?",

    // Offline & System
    offlineBanner: "ఆఫ్‌లైన్ మోడ్ — భద్రపరిచిన సమాచారం వాడుతున్నారు.",
    onlineRestored: "ఇంటర్నెట్ తిరిగి వచ్చింది.",
    demoLogin: "డెమో లాగిన్ (కోయంబత్తూర్ వరి పొలం)",
    signOut: "లాగ్ అవుట్",
    languageSelector: "భాషను మార్చండి"
  },

  Kannada: {
    // Nav
    navHome: "ಮುಖಪುಟ",
    navDiary: "ಕೃಷಿ ದಿನಚರಿ",
    navAI: "AI ಸಲಹೆಗಾರ",
    navScan: "ರೋಗ ಪತ್ತೆ",
    navProfile: "ರೈತ ಪ್ರೊಫೈಲ್",
    navSettings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    navWeather: "ಹವಾಮಾನ",
    navMarket: "ಮಾರುಕಟ್ಟೆ ದರ",
    navSchemes: "ಯೋಜನೆಗಳು",

    // Dashboard Core Sections
    farmStatus: "ಕೃಷಿ ಸ್ಥಿತಿ",
    currentConditions: "ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಗಳು",
    topRisk: "ಮುಖ್ಯ ಅಪಾಯದ ಎಚ್ಚರಿಕೆ",
    nextBestAction: "ಮುಂದಿನ ಅತ್ಯುತ್ತಮ ಕ್ರಮ (NEXT BEST ACTION)",
    whyThisAction: "ಈ ಕ್ರಮ ಏಕೆ?",
    takeAction: "ಕ್ರಮ ಕೈಗೊಳ್ಳಿ",
    feedbackLoop: "ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಇತಿಹಾಸ",
    completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    markDone: "ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ",
    actionTaken: "ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ",
    askAIWhy: "AI ಗೆ ಕಾರಣ ಕೇಳಿ",
    alternativeAction: "ಪರ್ಯಾಯ ಕ್ರಮ",
    supportingFactors: "ಪೋಷಕ ಅಂಶಗಳು",
    riskMitigated: "ತಪ್ಪಿಸಿದ ಅಪಾಯ",
    confidence: "ವಿಶ್ವಾಸಾರ್ಹತೆ",
    systemConfidence: "ಕೃಷಿ ವಿಜ್ಞಾನ ವಿಶ್ವಾಸಾರ್ಹತೆ",
    impact: "ನಿರೀಕ್ಷಿತ ಲಾಭ",
    whenToAct: "ಯಾವಾಗ ಮಾಡಬೇಕು",

    // Farm Profile
    farmerName: "ರೈತನ ಹೆಸರು",
    district: "ಜಿಲ್ಲೆ",
    state: "ರಾಜ್ಯ",
    farmSize: "ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ",
    acres: "ಎಕರೆ",
    soilType: "ಮಣ್ಣಿನ ಮಾದರಿ",
    primaryCrop: "ಮುಖ್ಯ ಬೆಳೆ",
    cropVariety: "ಬೆಳೆ ತಳಿ",
    sowingDate: "ಬಿತ್ತನೆ ದಿನಾಂಕ",
    cropStage: "ಬೆಳೆ ಹಂತ",
    irrigationType: "ನೀರಾವರಿ",
    paddy: "ಭತ್ತ (Paddy)",
    tillering: "ತೆನೆ ಕಟ್ಟುವ ಹಂತ (Tillering)",
    clayLoam: "ಜಿಗುಟು ಮರಳು ಮಣ್ಣು",
    editProfile: "ಪ್ರೊಫೈಲ್ ತಿದ್ದು",
    saveChanges: "ಉಳಿಸಿ",

    // Weather
    liveWeather: "ಪ್ರಸ್ತುತ ಹವಾಮಾನ",
    temperature: "ತಾಪಮಾನ",
    humidity: "ತೇವಾಂಶ",
    rainForecast: "ಮಳೆ ಮುನ್ಸೂಚನೆ (48 ಗಂಟೆ)",
    windSpeed: "ಗಾಳಿಯ ವೇಗ",
    soilMoisture: "ಮಣ್ಣಿನ ತೇವಾಂಶ ಸೂಚ್ಯಂಕ",
    offlineNotice: "ಕ್ಯಾಶ್ ಮಾಡಲಾದ ಹವಾಮಾನ ಡೇಟಾ",
    refreshWeather: "ಹವಾಮಾನ ನವೀಕರಿಸಿ",

    // Market
    marketIntelligence: "ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ",
    commodity: "ಬೆಳೆ",
    currentPrice: "ಪ್ರಸ್ತುತ ಮಂಡಿ ದರ",
    priceTrend: "7 ದಿನಗಳ ಬೆಲೆ ಪ್ರವೃತ್ತಿ",
    mandiSource: "ಪ್ರಾದೇಶಿಕ APMC ದರ",
    sellHoldSignal: "ಶಿಫಾರಸು",
    holdRecommendation: "ಕಾಯಿರಿ (HOLD) — ಬೆಲೆ ಏರಿಕೆಯ ಸಾಧ್ಯತೆ",
    sellRecommendation: "ಮಾರಿ (SELL) — ಸೂಕ್ತ ಸಮಯ",
    simulatedDisclaimer: "ಮಾರುಕಟ್ಟೆ ಮಾದರಿ ಡೇಟಾ (ಡೆಮೊಗಾಗಿ)",

    // Disease Scan
    scanTitle: "ಬೆಳೆ ರೋಗ ಪತ್ತೆ",
    takePhoto: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    uploadImage: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    analyzingFoliage: "ಎಲೆಯ ಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    healthyLeaf: "ಆರೋಗ್ಯಕರ ಬೆಳೆ - ರೋಗವಿಲ್ಲ",
    diseaseDetected: "ರೋಗ ಪತ್ತೆಯಾಗಿದೆ",
    severity: "ತೀವ್ರತೆ",
    symptoms: "ಕಂಡುಬಂದ ಲಕ್ಷಣಗಳು",
    immediateRemedy: "ತಕ್ಷಣದ ಕ್ರಮ",
    organicSolution: "ಸಾವಯವ ಪರಿಹಾರ",
    chemicalSolution: "ರಾಸಾಯನಿಕ ಔಷಧಿ",
    prevention: "ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು",
    retakePhoto: "ಮತ್ತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    accuracyNote: "PlantVillage ನಿಖರತೆ: 92.4%",
    unableToDetermine: "ನಿಖರವಾಗಿ ನಿರ್ಧರಿಸಲು ಅಸಾಧ್ಯ",
    poorQualityMsg: "ದಯವಿಟ್ಟು ಉತ್ತಮ ಬೆಳಕಿನಲ್ಲಿ ಎಲೆಯ ಹತ್ತಿರದ ಸ್ಪಷ್ಟ ಚಿತ್ರವನ್ನು ತೆಗೆಯಿರಿ.",

    // Farm Diary
    diaryTitle: "ಕೃಷಿ ದಿನಚರಿ",
    addActivity: "ಕೆಲಸ ದಾಖಲಿಸಿ",
    activityType: "ಕೆಲಸದ ಮಾದರಿ",
    notes: "ಟಿಪ್ಪಣಿಗಳು",
    cost: "ವೆಚ್ಚ (₹)",
    date: "ದಿನಾಂಕ",
    saveActivity: "ದಿನಚರಿಯಲ್ಲಿ ಉಳಿಸಿ",

    // AI Advisor
    aiAdvisorTitle: "THINAI AI ಸಲಹೆಗಾರ",
    askAnything: "ನೀರಾವರಿ, ರಸಗೊಬ್ಬರ, ಕೀಟಬಾಧೆ ಬಗ್ಗೆ ಕೇಳಿ...",
    send: "ಕಳುಹಿಸಿ",
    speak: "ಮಾತನಾಡಿ",
    listening: "ಆಲಿಸುತ್ತಿದೆ...",
    demoPrompt: "ಇಂದು ನಾನು ಏನು ಮಾಡಬೇಕು?",

    // Offline & System
    offlineBanner: "ಆಫ್‌ಲೈನ್ ಮೋಡ್ — ಉಳಿಸಲಾದ ಮಾಹಿತಿ ಬಳಸಲಾಗುತ್ತಿದೆ.",
    onlineRestored: "ಇಂಟರ್ನೆಟ್ ಮರಳಿ ಬಂದಿದೆ.",
    demoLogin: "ಡೆಮೊ ಲಾಗಿನ್ (ಕೊಯಮತ್ತೂರು ಭತ್ತದ ಜಮೀನು)",
    signOut: "ಲಾಗ್ ಔಟ್",
    languageSelector: "ಭಾಷೆ ಬದಲಾಯಿಸಿ"
  },

  Malayalam: {
    // Nav
    navHome: "ഹോം",
    navDiary: "ഫാം ഡയറി",
    navAI: "AI ഉപദേശകൻ",
    navScan: "രോഗനിർണയം",
    navProfile: "ഫാം പ്രൊഫൈൽ",
    navSettings: "ക്രമീകരണങ്ങൾ",
    navWeather: "കാലാവസ്ഥ",
    navMarket: "വിപണി വില",
    navSchemes: "പദ്ധതികൾ",

    // Dashboard Core Sections
    farmStatus: "ഫാം നില",
    currentConditions: "നിലവിലെ അവസ്ഥ",
    topRisk: "പ്രധാന അപകട മുന്നറിയിപ്പ്",
    nextBestAction: "അടുത്ത മികച്ച പ്രവർത്തനം (NEXT BEST ACTION)",
    whyThisAction: "എന്തുകൊണ്ട് ഈ നടപടി?",
    takeAction: "നടപടി സ്വീകരിക്കുക",
    feedbackLoop: "ഫീഡ്‌ബാക്ക് & ചരിത്രം",
    completed: "പൂർത്തിയായി",
    markDone: "പൂർത്തിയായി എന്ന് രേഖപ്പെടുത്തുക",
    actionTaken: "നടപടി സ്വീകരിച്ചു",
    askAIWhy: "AI-യോട് കാരണം ചോദിക്കുക",
    alternativeAction: "ഇതര നടപടി",
    supportingFactors: "സഹായക ഘടകങ്ങൾ",
    riskMitigated: "ഒഴിവാക്കപ്പെട്ട അപകടം",
    confidence: "വിശ്വാസ്യത",
    systemConfidence: "കാർഷിക ശാസ്ത്രീയ വിശ്വാസ്യത",
    impact: "പ്രതീക്ഷിക്കുന്ന പ്രയോജനം",
    whenToAct: "എപ്പോൾ ചെയ്യണം",

    // Farm Profile
    farmerName: "കർഷകന്റെ പേര്",
    district: "ജില്ല",
    state: "സംസ്ഥാനം",
    farmSize: "സ്ഥലവിസ്തൃതി",
    acres: "ഏക്കർ",
    soilType: "മണ്ണിന്റെ ഇനം",
    primaryCrop: "പ്രധാന വിള",
    cropVariety: "വിള ഇനം",
    sowingDate: "വിളവിറക്കിയ തീയതി",
    cropStage: "വിള ഘട്ടം",
    irrigationType: "നന രീതി",
    paddy: "നെല്ല് (Paddy)",
    tillering: "തൂമ്പ് പൊട്ടുന്ന ഘട്ടം (Tillering)",
    clayLoam: "കളിമണ്ണ് കലർന്ന എക്കൽ",
    editProfile: "വിവരങ്ങൾ തിരുത്തുക",
    saveChanges: "സൂക്ഷിക്കുക",

    // Weather
    liveWeather: "തത്സമയ കാലാവസ്ഥ",
    temperature: "താപനില",
    humidity: "ഈർപ്പം",
    rainForecast: "മഴ സാധ്യത (48 മണിക്കൂർ)",
    windSpeed: "കാറ്റിന്റെ വേഗത",
    soilMoisture: "മണ്ണിലെ ഈർപ്പ സൂചിക",
    offlineNotice: "സംഭരിച്ച കാലാവസ്ഥ ഡാറ്റ കാണിക്കുന്നു",
    refreshWeather: "പുതുക്കുക",

    // Market
    marketIntelligence: "വിപണി വില വിവരങ്ങൾ",
    commodity: "വിള",
    currentPrice: "നിലവിലെ വില",
    priceTrend: "7 ദിവസത്തെ വില നിലവാരം",
    mandiSource: "മേഖലാ APMC വില",
    sellHoldSignal: "നിർദ്ദേശം",
    holdRecommendation: "കാത്തിരിക്കുക (HOLD) — വില ഉയരാൻ സാധ്യത",
    sellRecommendation: "വിൽക്കുക (SELL) — അനുകൂല സമയം",
    simulatedDisclaimer: "വിപണി സാമ്പിൾ ഡാറ്റ (ഡെമോയ്ക്കായി)",

    // Disease Scan
    scanTitle: "വിള രോഗനിർണയം",
    takePhoto: "ഫോട്ടോ എടുക്കുക",
    uploadImage: "അപ്‌ലോഡ് ചെയ്യുക",
    analyzingFoliage: "ഇലയുടെ ലക്ഷണങ്ങൾ പരിശോധിക്കുന്നു...",
    healthyLeaf: "ആരോഗ്യമുള്ള വിള - രോഗബാധയില്ല",
    diseaseDetected: "രോഗബാധ കണ്ടെത്തി",
    severity: "തീവ്രത",
    symptoms: "ലക്ഷണങ്ങൾ",
    immediateRemedy: "ഉടൻ ചെയ്യേണ്ടത്",
    organicSolution: "ജൈവ പ്രതിവിധി",
    chemicalSolution: "കീടനാശിനി പ്രയോഗം",
    prevention: "പ്രതിരോധ മാർഗ്ഗങ്ങൾ",
    retakePhoto: "വീണ്ടും ഫോട്ടോ എടുക്കുക",
    accuracyNote: "PlantVillage കൃത്യത: 92.4%",
    unableToDetermine: "കൃത്യമായി നിർണ്ണയിക്കാനായില്ല",
    poorQualityMsg: "നല്ല വെളിച്ചത്തിൽ രോഗം ബാധിച്ച ഇലയുടെ വ്യക്തമായ ഫോട്ടോ എടുക്കുക.",

    // Farm Diary
    diaryTitle: "ഫാം ഡയറി",
    addActivity: "ജോലി രേഖപ്പെടുത്തുക",
    activityType: "ജോലിയുടെ ഇനം",
    notes: "കുറിപ്പുകൾ",
    cost: "ചെലവ് (₹)",
    date: "തീയതി",
    saveActivity: "ഡയറിയിൽ ചേർക്കുക",

    // AI Advisor
    aiAdvisorTitle: "THINAI AI ഉപദേശകൻ",
    askAnything: "നന, വളം, രോഗനിയന്ത്രണം എന്നിവയെക്കുറിച്ച് ചോദിക്കുക...",
    send: "അയക്കുക",
    speak: "സംസാരിക്കുക",
    listening: "ശ്രദ്ധിക്കുന്നു...",
    demoPrompt: "ഇന്ന് ഞാൻ എന്താണ് ചെയ്യേണ്ടത്?",

    // Offline & System
    offlineBanner: "ഓഫ്‌ലൈൻ മോഡ് — സംഭരിച്ച വിവരങ്ങൾ ലഭ്യമാണ്.",
    onlineRestored: "ഇന്റർനെറ്റ് ബന്ധം പുനഃസ്ഥാപിച്ചു.",
    demoLogin: "ഡെമോ ലോഗിൻ (കോയമ്പത്തൂർ നെൽപാടം)",
    signOut: "പുറത്തിറങ്ങുക",
    languageSelector: "ഭാഷ മാറ്റുക"
  }
};

export function t(key: string, language: AppLanguage = "English"): string {
  const dict = I18N_STRINGS[language] || I18N_STRINGS.English;
  return dict[key] || I18N_STRINGS.English[key] || key;
}
