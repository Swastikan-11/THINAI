// THINAI Agricultural AI Assistant Service
// Multilingual (6 Languages: English, Tamil, Hindi, Telugu, Kannada, Malayalam)
// Context-Aware Agronomic Decision & Next-Best Action Explainer

import { Recommendation } from "./decisionEngine";
import { AppLanguage } from "./i18n";

export interface FarmerContext {
  name: string;
  location: string;
  district: string;
  state: string;
  farmSize: string;
  primaryCrop: string;
  cropVariety: string;
  cropStage: string;
  soilType: string;
  soilMoisture: number;
  weatherCondition: string;
  rainfallExpected: number;
  temperature: number;
  language: AppLanguage;
  nextBestAction?: Recommendation;
}

export interface AssistantMessage {
  id: string;
  from: "ai" | "user";
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export const SUGGESTED_QUESTIONS_BY_LANG: Record<AppLanguage, string[]> = {
  English: [
    "What should I do today?",
    "Why should I delay irrigation?",
    "Will rain affect my crop?",
    "When should I irrigate next?",
    "Why is my crop turning yellow?",
    "Is today's market price good?",
    "What should I monitor this week?"
  ],
  Tamil: [
    "இன்று நான் என்ன செய்ய வேண்டும்?",
    "பாசனத்தை ஏன் தள்ளிப்போட வேண்டும்?",
    "மழை என் பயிரை பாதிக்குமா?",
    "அடுத்த பாசனம் எப்போது செய்ய வேண்டும்?",
    "இலைகள் ஏன் மஞ்சள் நிறமாகின்றன?",
    "இன்றைய சந்தை விலை சாதகமானதா?",
    "இந்த வாரம் எதை கண்காணிக்க வேண்டும்?"
  ],
  Hindi: [
    "आज मुझे क्या करना चाहिए?",
    "सिंचाई को क्यों टालना चाहिए?",
    "क्या बारिश मेरी फसल को नुकसान पहुंचाएगी?",
    "अगली सिंचाई कब करनी चाहिए?",
    "पत्तियां पीली क्यों पड़ रही हैं?",
    "क्या आज का मंडी भाव अनुकूल है?",
    "इस सप्ताह मुझे किस बात पर ध्यान देना चाहिए?"
  ],
  Telugu: [
    "ఈరోజు నేను ఏమి చేయాలి?",
    "నీటిపారుదల ఎందుకు వాయిదా వేయాలి?",
    "వర్షం నా పంటపై ప్రభావం చూపుతుందా?",
    "తదుపరి నీటిపారుదల ఎప్పుడు చేయాలి?",
    "ఆకులు ఎందుకు పసుపు రంగులోకి మారుతున్నాయి?",
    "ఈరోజు మార్కెట్ ధర అనుకూలంగా ఉందా?",
    "ఈ వారం నేను దేనిపై దృష్టి పెట్టాలి?"
  ],
  Kannada: [
    "ಇಂದು ನಾನು ಏನು ಮಾಡಬೇಕು?",
    "ನೀರಾವರಿಯನ್ನು ಏಕೆ ಮುಂದೂಡಬೇಕು?",
    "ಮಳೆಯು ನನ್ನ ಬೆಳೆಗೆ ಹಾನಿ ಮಾಡುತ್ತದೆಯೇ?",
    "ಮುಂದಿನ ನೀರಾವರಿ ಯಾವಾಗ ಮಾಡಬೇಕು?",
    "ಎಲೆಗಳು ಏಕೆ ಹಳದಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತಿವೆ?",
    "ಇಂದಿನ ಮಾರುಕಟ್ಟೆ ದರ ಅನುಕೂಲಕರವಾಗಿದೆಯೇ?",
    "ಈ ವಾರ ನಾನು ಯಾವುದರ ಬಗ್ಗೆ ಗಮನಹರಿಸಬೇಕು?"
  ],
  Malayalam: [
    "ഇന്ന് ഞാൻ എന്താണ് ചെയ്യേണ്ടത്?",
    "നന എന്തുകൊണ്ട് മാറ്റിവെക്കണം?",
    "മഴ വിളയെ ബാധിക്കുമോ?",
    "അടുത്ത നന എപ്പോഴാണ് നടത്തേണ്ടത്?",
    "ഇലകൾ എന്തുകൊണ്ട് മഞ്ഞനിറമാകുന്നു?",
    "ഇന്നത്തെ വിപണി വില അനുകൂലമാണോ?",
    "ഈ ആഴ്ച ഞാൻ എന്താണ് ശ്രദ്ധിക്കേണ്ടത്?"
  ]
};

/**
 * Formats the Next-Best-Action strictly according to PRIORITY 3 specification
 */
export function formatNextBestActionResponse(action: Recommendation, context: FarmerContext): string {
  const lang = context.language || "English";

  if (lang === "Tamil") {
    return `🌾 **அடுத்த சிறந்த நடவடிக்கை (NEXT BEST ACTION):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**நடவடிக்கை (ACTION):**
${action.action}

**முன்னுரிமை (PRIORITY):** ${action.priority === "High" ? "அதிமுக்கியம் (High)" : action.priority === "Medium" ? "நடுத்தரம் (Medium)" : "குறைவு (Low)"}

**எப்போது செய்ய வேண்டும் (WHEN):**
${action.when}

**ஏன் இந்த நடவடிக்கை (WHY):**
${action.why}

**நம்பகத்தன்மை (CONFIDENCE):**
${action.confidence}% (${action.confidenceLabel})

**ஆதாரக் காரணிகள் (SUPPORTING FACTORS):**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**தவிர்க்கப்படும் ஆபத்து (RISK):**
${action.risk}

**மாற்று நடவடிக்கை (ALTERNATIVE ACTION):**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *பண்ணை பின்னூட்டம்: ${action.feedbackInfluence}*` : ""}
💡 *மதிப்பிடப்பட்ட சேமிப்பு: ${action.impact}*`;
  }

  if (lang === "Hindi") {
    return `🌾 **अगला सर्वोत्तम कदम (NEXT BEST ACTION):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**कार्रवाई (ACTION):**
${action.action}

**प्राथमिकता (PRIORITY):** ${action.priority === "High" ? "उच्च (High)" : action.priority === "Medium" ? "मध्यम (Medium)" : "कम (Low)"}

**कब करें (WHEN):**
${action.when}

**कारण (WHY):**
${action.why}

**विश्वास स्तर (CONFIDENCE):**
${action.confidence}% (${action.confidenceLabel})

**सहायक कारक (SUPPORTING FACTORS):**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**निवारित जोखिम (RISK):**
${action.risk}

**वैकल्पिक कार्रवाई (ALTERNATIVE ACTION):**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *फार्म इतिहास प्रभाव: ${action.feedbackInfluence}*` : ""}
💡 *अनुमानित लाभ: ${action.impact}*`;
  }

  if (lang === "Telugu") {
    return `🌾 **తదుపరి ఉత్తమ చర్య (NEXT BEST ACTION):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**చర్య (ACTION):**
${action.action}

**ప్రాధాన్యత (PRIORITY):** ${action.priority === "High" ? "అధిక (High)" : action.priority === "Medium" ? "మధ్యమ (Medium)" : "తక్కువ (Low)"}

**ఎప్పుడు చేయాలి (WHEN):**
${action.when}

**ఎందుకు (WHY):**
${action.why}

**విశ్వసనీయత (CONFIDENCE):**
${action.confidence}% (${action.confidenceLabel})

**సహాయక అంశాలు (SUPPORTING FACTORS):**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**ప్రమాద నివారణ (RISK):**
${action.risk}

**ప్రత్యామ్నాయ చర్య (ALTERNATIVE ACTION):**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *రైతు ఫీడ్‌బ్యాక్ ప్రభావం: ${action.feedbackInfluence}*` : ""}
💡 *ఆశించిన ప్రయోజనం: ${action.impact}*`;
  }

  if (lang === "Kannada") {
    return `🌾 **ಮುಂದಿನ ಅತ್ಯುತ್ತಮ ಕ್ರಮ (NEXT BEST ACTION):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**ಕ್ರಮ (ACTION):**
${action.action}

**ಆದ್ಯತೆ (PRIORITY):** ${action.priority === "High" ? "ಹೆಚ್ಚು (High)" : action.priority === "Medium" ? "ಮಧ್ಯಮ (Medium)" : "ಕಡಿಮೆ (Low)"}

**ಯಾವಾಗ ಮಾಡಬೇಕು (WHEN):**
${action.when}

**ಏಕೆ (WHY):**
${action.why}

**ವಿಶ್ವಾಸಾರ್ಹತೆ (CONFIDENCE):**
${action.confidence}% (${action.confidenceLabel})

**ಪೋಷಕ ಅಂಶಗಳು (SUPPORTING FACTORS):**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**ತಪ್ಪಿಸಿದ ಅಪಾಯ (RISK):**
${action.risk}

**ಪರ್ಯಾಯ ಕ್ರಮ (ALTERNATIVE ACTION):**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *ಹಿಂದಿನ ಪ್ರತಿಕ್ರಿಯೆ ಪ್ರಭಾವ: ${action.feedbackInfluence}*` : ""}
💡 *ನಿರೀಕ್ಷಿತ ಲಾಭ: ${action.impact}*`;
  }

  if (lang === "Malayalam") {
    return `🌾 **അടുത്ത മികച്ച പ്രവർത്തനം (NEXT BEST ACTION):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**നടപടി (ACTION):**
${action.action}

**മുൻഗണന (PRIORITY):** ${action.priority === "High" ? "ഉയർന്നത് (High)" : action.priority === "Medium" ? "ഇടത്തരം (Medium)" : "കുറഞ്ഞത് (Low)"}

**എപ്പോൾ ചെയ്യണം (WHEN):**
${action.when}

**കാരണം (WHY):**
${action.why}

**വിശ്വാസ്യത (CONFIDENCE):**
${action.confidence}% (${action.confidenceLabel})

**സഹായക ഘടകങ്ങൾ (SUPPORTING FACTORS):**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**ഒഴിവാക്കപ്പെട്ട അപകടം (RISK):**
${action.risk}

**ഇതര നടപടി (ALTERNATIVE ACTION):**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *കർഷക ഫീഡ്‌ബാക്ക് സ്വാധീനം: ${action.feedbackInfluence}*` : ""}
💡 *പ്രതീക്ഷിക്കുന്ന പ്രയോജനം: ${action.impact}*`;
  }

  // Default: English
  return `🌾 **NEXT BEST ACTION (THINAI Decision Engine):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**ACTION:**
${action.action}

**PRIORITY:** ${action.priority.toUpperCase()}

**WHEN:**
${action.when}

**WHY:**
${action.why}

**CONFIDENCE:**
${action.confidence}% (${action.confidenceLabel})

**SUPPORTING FACTORS:**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**RISK:**
${action.risk}

**ALTERNATIVE ACTION:**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *Adaptive Farm History: ${action.feedbackInfluence}*` : ""}
💡 *Estimated Impact: ${action.impact}*`;
}

/**
 * Generates an agricultural response incorporating farm context and language
 */
export function generateContextualResponse(query: string, context: FarmerContext): string {
  const q = query.toLowerCase().trim();
  const lang = context.language || "English";

  // Check 1: "What should I do today?" or Next Best Action request
  if (
    q.includes("today") || q.includes("what should i do") ||
    q.includes("செயல்") || q.includes("இன்று") ||
    q.includes("आज") || q.includes("करना चाहिए") ||
    q.includes("ఈరోజు") || q.includes("చేయాలి") ||
    q.includes("ಇಂದು") || q.includes("ಮಾಡಬೇಕು") ||
    q.includes("ഇന്ന്") || q.includes("ചെയ്യേണ്ടത്")
  ) {
    if (context.nextBestAction) {
      return formatNextBestActionResponse(context.nextBestAction, context);
    }
  }

  // Check 2: "Why should I delay irrigation?" or Ask AI Why
  if (
    q.includes("delay") || q.includes("irrigation") || q.includes("why") ||
    q.includes("பாசனம்") || q.includes("தள்ளி") || q.includes("ஏன்") ||
    q.includes("सिंचाई") || q.includes("टालना") || q.includes("क्यों") ||
    q.includes("నీటిపారుదల") || q.includes("వాయిదా") || q.includes("ఎందుకు") ||
    q.includes("ನೀರಾವರಿ") || q.includes("ಮುಂದೂಡಿಕೆ") ||
    q.includes("നന") || q.includes("മാറ്റിവെക്കണം")
  ) {
    if (context.nextBestAction) {
      return formatNextBestActionResponse(context.nextBestAction, context);
    }

    if (lang === "Tamil") {
      return `💧 **பாசனத்தை ஏன் தள்ளிப்போட வேண்டும்? (THINAI முடிவு விளக்கம்):**

வணக்கம் ${context.name}! உங்கள் பண்ணை விவரங்களை ஆய்வு செய்ததின் அடிப்படையில்:

1. **காரணம் (Why):** உங்கள் ${context.district} பகுதியில் அடுத்த 24-48 மணி நேரத்தில் **${context.rainfallExpected || 85}mm பலத்த மழை** பெய்ய வாய்ப்புள்ளது. மேலும் மண்ணின் ஈரப்பதம் ஏற்கனவே **${context.soilMoisture || 68}%** அளவில் உள்ளது.
2. **பயிர் பருவம் (Stage):** உங்கள் ${context.primaryCrop} பயிர் தற்போது **${context.cropStage} (தூர்கட்டும் பருவம்)** பருவத்தில் உள்ளது. இச்சூழலில் கூடுதல் நீர் தேங்கினால் வேர் அழுகல் மற்றும் இலை கருகல் (Blast) பூஞ்சை பரவும் அபாயம் அதிகம்.
3. **பரிந்துரைக்கப்படும் நடவடிக்கை (Action):** இப்போதைக்கு பாசனத்தை நிறுத்துங்கள். வயல் வடிகால் மதகுகளை தூர்வாரி வையுங்கள்.
4. **மறுஆய்வு:** மழை நின்ற 24 மணி நேரத்திற்குப் பிறகு மண்ணை சரிபார்த்து முடிவு செய்யவும்.

💡 *மதிப்பிடப்பட்ட சேமிப்பு: ஏக்கருக்கு ₹1,200 டீசல்/மின்சார செலவு மிச்சம்.*`;
    }

    if (lang === "Hindi") {
      return `💧 **सिंचाई क्यों टालनी चाहिए? (THINAI निर्णय विश्लेषण):**

नमस्ते ${context.name}! आपके खेत के संदर्भ अनुसार:

1. **कारण (Why):** आपके ${context.district} क्षेत्र में अगले 24-48 घंटों में **${context.rainfallExpected || 85}mm वर्षा** का पूर्वानुमान है। खेत की मिट्टी में नमी पहले से **${context.soilMoisture || 68}%** है।
2. **फसल जोखिम:** आपकी **${context.primaryCrop}** फसल अभी **${context.cropStage}** अवस्था में है। अधिक जलभराव से जड़ें सड़ सकती हैं और झुलसा (Blast) रोग का प्रकोप बढ़ सकता है।
3. **कार्रवाई (Action):** तत्काल सिंचाई रोकें और मेड़ों के जल निकासी निकास साफ रखें।
4. **पुनः परीक्षण:** बारिश थमने के 24 घंटे बाद मिट्टी की जांच करें।

💡 *अनुमानित बचत: ₹1,200 प्रति एकड़ पंपिंग लागत की बचत।*`;
    }

    // Default English
    return `💧 **Why you should delay irrigation (THINAI Decision Context):**

Hello ${context.name}! Based on your active farm parameters:

1. **Environmental Fact:** Upcoming rainfall of **${context.rainfallExpected || 85}mm** is forecasted for ${context.district}. Your **${context.soilType}** soil currently holds **${context.soilMoisture || 68}% moisture**.
2. **Agronomic Risk:** Your **${context.primaryCrop}** is in the critical **${context.cropStage} stage**. Excessive standing water combined with high humidity (${context.weatherCondition}) creates favorable microclimate conditions for fungal blast (*Magnaporthe oryzae*).
3. **Action:** Immediately delay planned irrigation for 24-48 hours. Ensure field drainage channels are clear of debris.
4. **When to recheck:** Friday morning after rainfall recedes.

⚠️ *AI-assisted recommendation: Saves pump electricity/diesel while protecting productive tillers.*`;
  }

  // Check 3: Disease / Yellowing Query
  if (
    q.includes("yellow") || q.includes("disease") || q.includes("blast") ||
    q.includes("மஞ்சள்") || q.includes("நோய்") ||
    q.includes("पीली") || q.includes("रोग") ||
    q.includes("పసుపు") || q.includes("తెగులు") ||
    q.includes("ಹಳದಿ") || q.includes("ರೋಗ") ||
    q.includes("മഞ്ഞ") || q.includes("രോഗം")
  ) {
    if (lang === "Tamil") {
      return `🍃 **இலைகள் மஞ்சள் நிறமாதல் & நோய் பாதுகாப்பு ஆலோசனை:**

1. **காரணம்:** அதிக மண்ணின் ஈரப்பதம் (${context.soilMoisture || 68}%) மற்றும் காற்றில் 75% ஈரப்பதம் நிலவும்போது, நைட்ரஜன் சத்து வேர்களால் கிரகிக்கப்படாமல் மந்தமாகும் அல்லது பாக்டீரியா இலைக்கருகல் (BLB) பூஞ்சை ஆரம்பிக்கலாம்.
2. **நடவடிக்கை:**
   • வயலில் தேங்கியுள்ள நீரை உடனடியாக வெளியேற்றவும்.
   • பயிர் ஸ்கேன் தாவலை பயன்படுத்தி இலை படத்தை பதிவேற்றி ஆய்வு செய்யவும்.
   • மழை நின்ற பிறகு 25 கிலோ/ஏக்கர் யூரியா + 5 கிலோ ஜிங்க் சல்பேட் இடவும்.`;
    }

    if (lang === "Hindi") {
      return `🍃 **पत्तियों का पीलापन एवं फसल सुरक्षा सलाह:**

1. **कारण:** मिट्टी में अत्यधिक नमी (${context.soilMoisture || 68}%) और 75% आर्द्रता के कारण जड़ों को ऑक्सीजन नहीं मिलती, जिससे नाइट्रोजन अवशोषण रुक जाता है या झुलसा रोग पनप सकता है।
2. **कदम उठाएं:**
   • खेत से अतिरिक्त पानी तुरंत निकालें।
   • 'रोग पहचान' टैब से प्रभावित पत्ती की फोटो स्कैन करें।
   • बारिश के बाद 25 किग्रा/एकड़ यूरिया + 5 किग्रा जिंक सल्फेट डालें।`;
    }

    return `🍃 **Leaf Yellowing & Disease Management Advisory:**

1. **Probable Causes:** In the ${context.cropStage} stage of ${context.primaryCrop}, saturated soil (${context.soilMoisture || 68}%) inhibits root aeration, leading to temporary nitrogen chlorosis or early onset of bacterial blight.
2. **Immediate Steps:**
   • Drain stagnant surface water from the plots immediately.
   • Use the **Scan Crop** feature to run our PlantVillage-trained diagnostic classifier on affected leaves.
   • Avoid applying raw chemical nitrogen until drainage is restored.`;
  }

  // Check 4: Market / Price query
  if (
    q.includes("market") || q.includes("price") || q.includes("rate") ||
    q.includes("சந்தை") || q.includes("விலை") ||
    q.includes("मंडी") || q.includes("भाव") ||
    q.includes("ధర") || q.includes("ಮಾರುಕಟ್ಟೆ") || q.includes("വില")
  ) {
    if (lang === "Tamil") {
      return `📈 **சந்தை விலை நிலவரம் (${context.primaryCrop}):**

• தற்போதைய APMC மண்டி விலை: **₹2,840/குவிண்டால்** (கடந்த 7 நாட்களில் +2.4% உயர்வு).
• THINAI பரிந்துரை: **பொறுத்திருங்கள் (HOLD)**.
• காரணம்: அண்டை மாவட்டங்களில் மழை காரணமாக வரத்து குறைந்துள்ளதால், விலை ₹2,920 வரை உயர வாய்ப்புள்ளது. ஈரப்பதம் 14%-க்கு குறைவாக இருப்பதை உறுதிசெய்து பாதுகாக்கவும்.`;
    }

    if (lang === "Hindi") {
      return `📈 **मंडी भाव विश्लेषण (${context.primaryCrop}):**

• वर्तमान APMC मंडी भाव: **₹2,840/क्विंटल** (पिछले 7 दिनों में +2.4% वृद्धि)।
• THINAI अनुशंसा: **रोकें (HOLD)**।
• कारण: पड़ोसी जिलों में बारिश के कारण आवक धीमी है, जिससे भाव ₹2,920 तक जाने की संभावना है। सुरक्षित भंडारण सुनिश्चित करें।`;
    }

    return `📈 **Market Price Advisory for ${context.primaryCrop}:**

• Current APMC Benchmark: **₹2,840/quintal** (+2.4% over 7 days).
• Strategic Recommendation: **HOLD Buffer Stock**.
• Rationale: Inflow at regional mandis has decreased by 14% due to wet harvesting conditions, sustaining firm prices with a target of ₹2,920/quintal.`;
  }

  // Fallback General Agronomic Advice in selected language
  if (lang === "Tamil") {
    return `🌾 **வணக்கம் ${context.name}!**
உங்கள் பண்ணை (${context.district}, ${context.farmSize} ஏக்கர் ${context.primaryCrop} - ${context.cropStage}) விவரங்களை THINAI கண்காணித்து வருகிறது.
தற்போதைய முக்கிய பணி: மழைக்கு முன் வடிகால் வசதிகளை சரிசெய்து பாசனத்தை தள்ளிப்போடுங்கள். ஏதேனும் குறிப்பிட்ட கேள்விகள் இருந்தால் கேளுங்கள்!`;
  }

  if (lang === "Hindi") {
    return `🌾 **नमस्ते ${context.name}!**
THINAI आपके फार्म (${context.district}, ${context.farmSize} एकड़ ${context.primaryCrop} - ${context.cropStage}) की निगरानी कर रहा है।
आज का मुख्य निर्देश: बारिश को देखते हुए सिंचाई रोकें और जल निकासी सुनिश्चित करें।`;
  }

  if (lang === "Telugu") {
    return `🌾 **నమస్కారం ${context.name}!**
మీ వ్యవసాయ సమాచారాన్ని (${context.district}, ${context.farmSize} ఎకరాలు ${context.primaryCrop} - ${context.cropStage}) THINAI విశ్లేషిస్తోంది.
ఈరోజు ముఖ్య సూచన: వర్షాన్ని దృష్టిలో ఉంచుకుని నీటిపారుదల వాయిదా వేయండి మరియు మురుగు కాలువలను సిద్ధం చేయండి.`;
  }

  if (lang === "Kannada") {
    return `🌾 **ನಮಸ್ಕಾರ ${context.name}!**
ನಿಮ್ಮ ಕೃಷಿ ಮಾಹಿತಿಯನ್ನು (${context.district}, ${context.farmSize} ಎಕರೆ ${context.primaryCrop} - ${context.cropStage}) THINAI ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ.
ಇಂದಿನ ಮುಖ್ಯ ಕ್ರಮ: ಮಳೆಯ ಮುನ್ಸೂಚನೆ ಇರುವುದರಿಂದ ನೀರಾವರಿಯನ್ನು ಮುಂದೂಡಿ.`;
  }

  if (lang === "Malayalam") {
    return `🌾 **നമസ്കാരം ${context.name}!**
നിങ്ങളുടെ ഫാം വിവരങ്ങൾ (${context.district}, ${context.farmSize} ഏക്കർ ${context.primaryCrop} - ${context.cropStage}) THINAI നിരീക്ഷിക്കുന്നു.
ഇന്നത്തെ പ്രധാന നിർദ്ദേശം: മഴ സാധ്യതയുള്ളതിനാൽ നന മാറ്റിവെക്കുക.`;
  }

  return `🌾 **Hello ${context.name}!**
THINAI is actively monitoring your ${context.farmSize}-acre ${context.primaryCrop} plot (${context.cropStage}) in ${context.district}.
Current top priority: Delay planned irrigation ahead of forecasted ${context.rainfallExpected || 85}mm rainfall and verify drainage bunds.`;
}
