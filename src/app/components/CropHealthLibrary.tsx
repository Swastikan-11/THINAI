import React, { useState } from "react";
import { BookOpen, Search, ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight, Globe, ExternalLink, Shield } from "lucide-react";
import { DataBadge } from "./DataBadge";
import { AppLanguage } from "../../services/i18n";

export interface CropHealthEntry {
  id: string;
  name: string;
  nameTa: string;
  scientificName: string;
  type: "disease" | "pest" | "deficiency";
  crops: string[];
  pathogenType?: "Fungal" | "Bacterial" | "Viral" | "Insect" | "Nutrient";
  affectedStages: string[];
  severity: "High" | "Moderate" | "Critical";
  symptoms: string[];
  symptomsTa: string[];
  causes: string[];
  causesTa: string[];
  identification: string;
  identificationTa: string;
  prevention: string[];
  preventionTa: string[];
  treatment: string;
  treatmentTa: string;
  remedySource: string;
  remedySourceUrl: string;
  remedyStatus: "VERIFIED" | "UNVERIFIED";
  verificationNote: string;
  safetyGuidance: string;
  safetyGuidanceTa: string;
  reference: string;
}

export const HEALTH_LIBRARY: CropHealthEntry[] = [
  {
    id: "rice-blast",
    name: "Rice Blast (Leaf / Neck Blast)",
    nameTa: "நெல் குலை நோய் (இலை / கழுத்து குலை நோய்)",
    scientificName: "Pyricularia oryzae (Magnaporthe oryzae)",
    type: "disease",
    crops: ["Paddy"],
    pathogenType: "Fungal",
    affectedStages: ["Tillering", "Panicle Initiation", "Flowering"],
    severity: "Critical",
    symptoms: [
      "Spindle-shaped diamond lesions with gray/white center and brown/reddish-brown margin on leaf blades.",
      "Neck rot causing broken panicles and completely unfilled, chaffy white grains.",
      "Rapid coalescing of leaf spots leading to total foliar scorching under cloudy conditions."
    ],
    symptomsTa: [
      "இலைகளில் சாம்பல் அல்லது வெள்ளை நிற மையப்பகுதியும் பழுப்பு நிற விளிம்பும் கொண்ட கதிர் வடிவப் புள்ளிகள்.",
      "கதிர் கழுத்துப் பகுதி கருப்பாகி உடைந்து, பதர் தானியங்கள் உருவாகுதல்.",
      "மேகமூட்டமான வானிலையில் புள்ளிகள் ஒன்றிணைந்து இலைகள் கருகிப்போதல்."
    ],
    causes: [
      "Prolonged leaf wetness (> 10-12 hours) due to dew or light rain.",
      "High relative humidity (> 85%) and ambient temperature around 20-26°C.",
      "Excessive nitrogenous fertilizer (Urea) application without adequate potash."
    ],
    causesTa: [
      "பனி அல்லது லேசான மழையால் 10-12 மணி நேரத்திற்கும் மேலாக இலைகளில் ஈரப்பதம் நீடித்தல்.",
      "அதிகக் காற்றின் ஈரப்பதம் (> 85%) மற்றும் 20-26°C வெப்ப நிலை.",
      "பொட்டாஷ் உரம் இன்றி அதிகப்படியான தழைச்சத்து (யுரியா) இடுதல்."
    ],
    identification: "Classic eye-shaped diamond spots with tapered points along leaf veins.",
    identificationTa: "இலை நரம்புகளில் கண் வடிவ கதிர் புள்ளிகள் தோன்றுதல்.",
    prevention: [
      "Cultivate blast-resistant varieties (e.g., ADT-45, CO-51, CR-1009 Sub-1).",
      "Avoid excess nitrogen top-dressing; split urea into 3-4 applications.",
      "Seed treatment with Pseudomonas fluorescens @ 10 g/kg seed."
    ],
    preventionTa: [
      "நோய் எதிர்ப்பு ரகங்களான ADT-45, CO-51, CR-1009 Sub-1 பயிரிடுதல்.",
      "அதிகப்படியான யுரியாவைத் தவிர்த்து, 3-4 தவணைகளாகப் பிரித்து இடுதல்.",
      "சூடோமோனாஸ் ஃபுளோரசன்ஸ் 10 கிராம்/கிலோ விதைக்கு என்ற அளவில் விதை நேர்த்தி செய்தல்."
    ],
    treatment: "Foliar spray of Tricyclazole 75% WP @ 120 g/acre or Isoprothiolane 40% EC @ 300 ml/acre in 200 liters of water at early lesion onset.",
    treatmentTa: "நோய் ஆரம்ப நிலையில் ட்ரைசைக்ளசோல் 75% WP 120 கிராம்/ஏக்கர் அல்லது ஐசோபுரோதியோலேன் 40% EC 300 மி.லி/ஏக்கர் 200 லிட்டர் நீரில் கலந்து தெளிக்கவும்.",
    remedySource: "TNAU Agritech Portal - Crop Protection Manual (Rice Pathology)",
    remedySourceUrl: "https://agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_cereals_paddy_1.html",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Wear protective respirator and gloves. Observe mandatory 14-day pre-harvest interval (PHI) before grain harvesting.",
    safetyGuidanceTa: "பாதுகாப்பு முகக்கவசம் மற்றும் கையுறைகள் அணியவும். அறுவடைக்கு முன் 14 நாட்கள் இடைவெளி விடவும்.",
    reference: "ICAR-National Rice Research Institute (NRRI) Disease Compendium"
  },
  {
    id: "bacterial-leaf-blight",
    name: "Bacterial Leaf Blight (BLB)",
    nameTa: "நெல் பாக்டீரியா இலைக்கருகல் நோய்",
    scientificName: "Xanthomonas oryzae pv. oryzae",
    type: "disease",
    crops: ["Paddy"],
    pathogenType: "Bacterial",
    affectedStages: ["Tillering", "Flowering"],
    severity: "High",
    symptoms: [
      "Water-soaked translucent stripes along leaf margins expanding into wavy yellowish lesions.",
      "Infected leaves turn straw-yellow and roll inward (Kresek phase in young plants causes wilting).",
      "Milky bacterial ooze drops visible on young lesions in humid morning hours."
    ],
    symptomsTa: [
      "இலை விளிம்புகளில் நீரில் நனைந்த கோடுகள் தோன்றி அலை அலையான மஞ்சள் கருகலாக மாறுதல்.",
      "இலைகள் வைக்கோல் நிறமாக மாறி உள்நோக்கி சுருளுதல் (கிரெசெக் நிலையில் நாற்றுகள் வாடுதல்).",
      "காலை வேளையில் இளம் புள்ளிகளில் பால் போன்ற பாக்டீரியா கசிவு துளிகள் காணப்படுதல்."
    ],
    causes: [
      "Bacterial ingress through natural hydathodes or wind wounds.",
      "Warm temperatures (25-34°C) with continuous rainy/stormy weather.",
      "Submergence in flood water carrying inoculum from adjacent infected fields."
    ],
    causesTa: [
      "இலைத் துவாரங்கள் மற்றும் காற்று சேதங்கள் வழியாக பாக்டீரியா உட்செல்லுதல்.",
      "25-34°C வெப்பம் மற்றும் தொடர் மழை வானிலை.",
      "வெள்ள நீரில் நோய் கிருமிகள் அடித்து வரப்படுதல்."
    ],
    identification: "Wavy margin chlorosis starting from leaf tip progressing downward; bacterial ooze test positive.",
    identificationTa: "இலை நுனியிலிருந்து கீழ்நோக்கி அலையலையாகக் கருகும் விளிம்புகள்.",
    prevention: [
      "Clip seedling leaf tips before transplanting to prevent pathogen transmission.",
      "Drain excess standing water during storm periods.",
      "Apply Bleaching Powder @ 2 kg/acre mixed in irrigation water."
    ],
    preventionTa: [
      "நாற்று நடும் முன் நுனிப்பகுதியை நறுக்கி நடுதல்.",
      "மழைக் காலங்களில் வயலில் தேங்கும் அதிகப்படியான நீரை வடித்தல்.",
      "பாசன நீரில் பிளீச்சிங் பவுடர் 2 கிலோ/ஏக்கர் கலந்து விடுதல்."
    ],
    treatment: "Spray Streptomycin sulphate + Tetracycline combination (Plantomycin) @ 120 g + Copper Oxychloride 50% WP @ 500 g in 200 liters water/acre.",
    treatmentTa: "ஸ்ட்ரெப்டோமைசின் சல்பேட் + டெட்ராசைக்ளின் 120 கிராம் + காப்பர் ஆக்சிகுளோரைடு 500 கிராம் 200 லிட்டர் நீரில் கலந்து தெளிக்கவும்.",
    remedySource: "TNAU Agritech Portal Plant Protection Manual",
    remedySourceUrl: "https://agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_cereals_paddy_2.html",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Do not spray against the wind. Wash spray equipment thoroughly after application.",
    safetyGuidanceTa: "எதிர் காற்றில் தெளிக்க வேண்டாம். தெளித்த பின் கருவிகளை நன்கு கழுவவும்.",
    reference: "TNAU Department of Plant Pathology"
  },
  {
    id: "yellow-stem-borer",
    name: "Yellow Stem Borer",
    nameTa: "நெல் மஞ்சள் தண்டு துளைப்பான்",
    scientificName: "Scirpophaga incertulas",
    type: "pest",
    crops: ["Paddy"],
    pathogenType: "Insect",
    affectedStages: ["Vegetative", "Panicle Initiation", "Flowering"],
    severity: "High",
    symptoms: [
      "Dead Heart symptom: Central drying and death of the emerging shoot in tillering stage; easily pulls out.",
      "White Earhead symptom: Empty, erect white panicles devoid of grain during reproductive stage.",
      "Tiny entry pin-holes visible near the base of the rice culm."
    ],
    symptomsTa: [
      "குருத்து காய்ந்து எளிதில் இழுத்தால் கழன்று வரும் 'வெண் குருத்து' அறிகுறி.",
      "மணிகள் இல்லாத வெள்ளை நிறக் கதிர்கள் நிற்கும் 'வெண் கதிர்' நிலை.",
      "தண்டின் அடிப்பகுதியில் புழு நுழைந்த சிறிய துளைகள் காணப்படுதல்."
    ],
    causes: [
      "Nocturnal moths laying egg masses covered with buff-colored hairs on upper leaf tips.",
      "Continuous non-synchronized planting in neighboring fields.",
      "Dense canopy with high plant population sheltering larvae."
    ],
    causesTa: [
      "இரவு நேர அந்துப்பூச்சிகள் இலை நுனிகளில் பழுப்பு நிற முட்டைக் குவியல்களை இடுதல்.",
      "அருகிலுள்ள வயல்களில் தொடர்ச்சியாக மாறுபட்ட தேதிகளில் நடுதல்.",
      "அடர்த்தியான பயிர் வளர்ச்சி புழுக்களுக்கு தஞ்சம் அளித்தல்."
    ],
    identification: "Dry central shoot pulls out effortlessly with chewed frayed base smelling putrid.",
    identificationTa: "காய்ந்த நடுக்குருத்து எளிதில் பிடுங்கப்பட்டு அழுகிய வாசனை வீசுதல்.",
    prevention: [
      "Install sex pheromone traps (Scirpo-lure) @ 4 traps/acre for adult moth monitoring.",
      "Release egg parasitoid Trichogramma japonicum @ 40,000/acre at weekly intervals.",
      "Maintain 30 cm alleyways every 2 meters for light penetration."
    ],
    preventionTa: [
      "இனக்கவர்ச்சிப் பொறி ஏக்கருக்கு 4 என்ற எண்ணிக்கையில் அமைத்தல்.",
      "ட்ரைக்கோகிரம்மா ஜப்பானிக்கம் ஒட்டுண்ணி அட்டை ஏக்கருக்கு 40,000 வாரம் ஒருமுறை விடுதல்.",
      "2 மீட்டருக்கு ஒரு முறை 30 செ.மீ இடைவெளிப் பாதை (பயிர் வரிசை) விடுதல்."
    ],
    treatment: "Apply Chlorantraniliprole 18.5% SC @ 60 ml/acre or Cartap hydrochloride 4G @ 7.5 kg/acre when ETL (1 egg mass/sq.m or 5% dead hearts) is reached.",
    treatmentTa: "பொருளாதார சேத நிலை (5% குருத்து காய்தல்) எட்டும்போது குளோரான்ட்ரனிலிப்ரோல் 18.5% SC 60 மி.லி/ஏக்கர் அல்லது கார்டாப் ஹைட்ரோகுளோரைடு 7.5 கிலோ/ஏக்கர் இடவும்.",
    remedySource: "Directorate of Rice Development / CIBRC Registered Label Claims",
    remedySourceUrl: "http://ppqs.gov.in/divisions/cib-rc/registered-products",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Do not apply during active honeybee foraging hours (08:00 - 11:00 AM). Store chemicals away from domestic cattle.",
    safetyGuidanceTa: "தேனீக்கள் உலாவு காலை நேரங்களில் (8:00-11:00 AM) தெளிக்கக் கூடாது. கால்நடைகளுக்கு எட்டாதவாறு பூச்சிக்கொல்லிகளை வைக்கவும்.",
    reference: "Directorate of Rice Development, Ministry of Agriculture"
  },
  {
    id: "tomato-early-blight",
    name: "Early Blight of Tomato",
    nameTa: "தக்காளி ஆரம்பக்கால இலைக் கருகல் நோய்",
    scientificName: "Alternaria solani",
    type: "disease",
    crops: ["Tomato"],
    pathogenType: "Fungal",
    affectedStages: ["Vegetative", "Flowering", "Fruiting"],
    severity: "High",
    symptoms: [
      "Concentric circular target-board ring spots on older lower leaves.",
      "Yellow chlorotic halo surrounding brown leathery lesions.",
      "Defoliation starting from base moving upward; dark sunken spots on fruit stem end."
    ],
    symptomsTa: [
      "அடி இலைகளில் வளைய வடிவக் குறி பலகை போன்ற வட்டப் புள்ளிகள் தோன்றுதல்.",
      "பழுப்பு நிறப் புள்ளிகளைச் சுற்றி மஞ்சள் நிற வளையம் அமைதல்.",
      "கீழிருந்து மேல்நோக்கி இலைகள் உதிர்தல்; காய்களின் காம்புப் பகுதியில் கருமை நிறப் பள்ளங்கள்."
    ],
    causes: [
      "Splashing rain or overhead sprinkler irrigation carrying soil-borne spores to foliage.",
      "Warm temperatures (24-29°C) with alternating wet and dry periods.",
      "Stressed plants due to poor nutrition or heavy fruit load."
    ],
    causesTa: [
      "மழைத்துளி தெறித்தல் அல்லது தெளிப்பு நீர் பாசனம் மூலம் மண்ணிலுள்ள பூஞ்சை வித்துக்கள் பரவுதல்.",
      "24-29°C வெப்பம் மற்றும் ஈரப்பதம் மாறுபடுதல்.",
      "ஊட்டச்சத்து குறைபாடு உள்ள செடிகளில் நோய் விரைவாகப் பரவுதல்."
    ],
    identification: "Concentric target-board rings visible clearly inside dark brown circular spots.",
    identificationTa: "பழுப்பு நிறப் புள்ளிகளுக்குள் வளைய வளையக் கோடுகள் தோன்றுதல்.",
    prevention: [
      "Drip irrigation to avoid wetting foliage.",
      "Mulch soil surface with 25-micron silver-black plastic mulch.",
      "Crop rotation with non-solanaceous crops (Paddy, Maize, Pulses) for 2 years."
    ],
    preventionTa: [
      "இலைகள் நனையாமல் இருக்க சொட்டு நீர்ப் பாசனம் அமைத்தல்.",
      "25 மைக்ரான் வெள்ளி-கருப்பு நெகிழி மூடாக்கு அமைத்தல்.",
      "தக்காளி அல்லாத மாற்றுப் பயிர்களுடன் (நெல், மக்காச்சோளம், பயறு) 2 ஆண்டுகள் பயிர் சுழற்சி செய்தல்."
    ],
    treatment: "Spray Mancozeb 75% WP @ 400 g/acre or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 200 ml/acre at initial symptom appearance.",
    treatmentTa: "ஆரம்ப அறிகுறிகளில் மேன்கோசெப் 75% WP 400 கிராம்/ஏக்கர் அல்லது அசோக்சிஸ்ட்ரோபின் + டைபினோகொனசோல் 200 மி.லி/ஏக்கர் தெளிக்கவும்.",
    remedySource: "ICAR-Indian Institute of Horticultural Research (IIHR) Disease Guidelines",
    remedySourceUrl: "https://www.iihr.res.in/tomato-disease-management",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Maintain 7-day pre-harvest interval for table tomatoes. Do not consume unwashed fruits.",
    safetyGuidanceTa: "அறுவடைக்கு முன் 7 நாட்கள் கட்டாய இடைவெளி தேவை. பழங்களை கழுவாமல் உண்ணக் கூடாது.",
    reference: "ICAR-Indian Institute of Horticultural Research (IIHR)"
  },
  {
    id: "tomato-late-blight",
    name: "Late Blight of Tomato / Potato",
    nameTa: "தக்காளி / உருளைக்கிழங்கு பின் பருவக் கருகல் நோய்",
    scientificName: "Phytophthora infestans",
    type: "disease",
    crops: ["Tomato", "Potato"],
    pathogenType: "Fungal",
    affectedStages: ["Vegetative", "Flowering", "Fruiting"],
    severity: "Critical",
    symptoms: [
      "Large, irregular water-soaked spots on leaves rapidly turning purplish-brown and papery.",
      "White fuzzy downy mildew growth visible on the undersides of leaves during humid mornings.",
      "Dark brown firm rot on green and ripe fruits and tubers."
    ],
    symptomsTa: [
      "இலைகளில் ஒழுங்கற்ற நீரில் நனைந்த பெரிய புள்ளிகள் தோன்றி விரைவாக பழுப்பு நிறமாக மாறுதல்.",
      "காலை ஈரப்பதத்தில் இலைகளின் அடிப்பகுதியில் வெள்ளை நிறப் பூஞ்சை வளர்ச்சி தோன்றுதல்.",
      "பச்சை மற்றும் பழுத்த காய்களில் கருமை நிற அழுகல் ஏற்படுதல்."
    ],
    causes: [
      "Cool temperatures (15-22°C) combined with prolonged high relative humidity (>90%).",
      "Continuous overcast skies and dew condensation."
    ],
    causesTa: [
      "குளிர்ந்த வெப்பநிலை (15-22°C) மற்றும் தொடர்ச்சியான அதிக ஈரப்பதம் (>90%).",
      "தொடர் மேகமூட்டம் மற்றும் பனிப்பொழிவு."
    ],
    identification: "Rapid foliar collapse with white mildew underside during cold humid mornings.",
    identificationTa: "இலையின் அடிப்பகுதியில் வெள்ளை நிறப் பூஞ்சை படலத்துடன் கூடிய விரைவான கருகல்.",
    prevention: [
      "Provide wide plant spacing for aeration.",
      "Avoid overhead irrigation.",
      "Plant certified disease-free seeds/tubers."
    ],
    preventionTa: [
      "காற்றோட்டம் கிடைக்க அதிக நடவு இடைவெளி விடுதல்.",
      "தெளிப்பு நீர் பாசனத்தைத் தவிர்த்தல்.",
      "சான்றளிக்கப்பட்ட விதைக்கிழங்குகளை நடுதல்."
    ],
    treatment: "Spray Cymoxanil 8% + Mancozeb 64% WP @ 600 g/acre or Metalaxyl-M 4% + Mancozeb 64% WP @ 500 g/acre upon first symptom.",
    treatmentTa: "சைமோக்சனில் 8% + மேன்கோசெப் 64% WP 600 கிராம்/ஏக்கர் அல்லது மெட்டலாக்சில் 500 கிராம்/ஏக்கர் தெளிக்கவும்.",
    remedySource: "ICAR-Central Potato Research Institute (CPRI) Guidelines",
    remedySourceUrl: "https://cpri.icar.gov.in/plant-protection",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Wear protective face shield. Observe mandatory 10-day pre-harvest interval.",
    safetyGuidanceTa: "முகக்கவசம் அணியவும். அறுவடைக்கு முன் 10 நாட்கள் இடைவெளி விடவும்.",
    reference: "ICAR-Central Potato Research Institute (CPRI)"
  },
  {
    id: "chilli-anthracnose",
    name: "Chilli Anthracnose / Fruit Rot",
    nameTa: "மிளகாய் அந்த்ராக்னோஸ் / பழ அழுகல் நோய்",
    scientificName: "Colletotrichum capsici",
    type: "disease",
    crops: ["Pepper (Chilli)"],
    pathogenType: "Fungal",
    affectedStages: ["Flowering", "Fruiting"],
    severity: "High",
    symptoms: [
      "Circular sunken necrotic spots with black concentric rings (acervuli) on ripe red fruits.",
      "Die-back of twigs starting from tip downward, turning straw-colored.",
      "Premature drop of infected flowers and small developing fruits."
    ],
    symptomsTa: [
      "பழுத்த சிவப்பு மிளகாய்களில் பள்ளமான வட்டப் புள்ளிகளில் கருமை நிற வளையங்கள் தோன்றுதல்.",
      "கிளைகள் நுனியிலிருந்து கீழ்நோக்கி காய்ந்து வைக்கோல் நிறமாவது.",
      "பூக்கள் மற்றும் பிஞ்சுகள் உதிர்ந்து விடுதல்."
    ],
    causes: [
      "Warm humid rainy weather (28-30°C and >80% RH).",
      "Infected seeds and harvest debris in soil."
    ],
    causesTa: [
      "வெப்பமும் ஈரப்பதமும் கலந்த வானிலை (28-30°C).",
      "நோயுற்ற விதைகள் மற்றும் மண்ணில் தங்கிய பழைய பயிர்க்கழிவுகள்."
    ],
    identification: "Sunken black ringed spots on ripening fruits resembling concentric targets.",
    identificationTa: "பழுத்த மிளகாய்களில் கருப்பு வளையப் புள்ளிகளுடன் கூடிய அழுகல்.",
    prevention: [
      "Seed treatment with Trichoderma viride @ 4 g/kg seed.",
      "Collect and destroy diseased fruits and twigs.",
      "Use certified disease-free seeds."
    ],
    preventionTa: [
      "ட்ரைக்கோடெர்மா விரிடி 4 கிராம்/கிலோ விதை நேர்த்தி செய்தல்.",
      "தாக்கப்பட்ட காய்கள் மற்றும் கிளைகளை அகற்றி எரித்தல்.",
      "சான்றளிக்கப்பட்ட விதைகளைப் பயன்படுத்துதல்."
    ],
    treatment: "Spray Azoxystrobin 23% SC @ 200 ml/acre or Copper Oxychloride 50% WP @ 500 g/acre at flowering and fruit set.",
    treatmentTa: "பூக்கும் மற்றும் காய் பிடிக்கும் பருவத்தில் அசோக்சிஸ்ட்ரோபின் 200 மி.லி/ஏக்கர் அல்லது காப்பர் ஆக்சிகுளோரைடு 500 கிராம்/ஏக்கர் தெளிக்கவும்.",
    remedySource: "TNAU Agritech Portal Vegetable Pathology",
    remedySourceUrl: "https://agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_veg_chillies.html",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Wash skin immediately after contact. Maintain 7-day PHI.",
    safetyGuidanceTa: "தோலில் பட்டால் உடனே சோப்பு போட்டு கழுவவும். 7 நாட்கள் அறுவடை இடைவெளி தேவை.",
    reference: "TNAU Vegetable Pathology Division"
  },
  {
    id: "maize-fall-armyworm",
    name: "Fall Armyworm (FAW)",
    nameTa: "மக்காச்சோள படைப்புழு",
    scientificName: "Spodoptera frugiperda",
    type: "pest",
    crops: ["Corn (Maize)"],
    pathogenType: "Insect",
    affectedStages: ["Vegetative", "Whorl Stage", "Tasseling"],
    severity: "Critical",
    symptoms: [
      "Elongated window-pane pinholes and large ragged feeding holes in whorl leaves.",
      "Heavy sawdust-like larval fecal frass packed inside the central leaf whorl.",
      "Larva has inverted 'Y' on head and 4 raised dots forming a square on the 8th abdominal segment."
    ],
    symptomsTa: [
      "இலைகளில் ஒழுங்கற்ற துளைகள் மற்றும் சல்லடை போன்ற சேதங்கள்.",
      "குருத்துகளுக்குள் மரத்தூள் போன்ற புழுவின் கழிவுகள் காணப்படுதல்.",
      "புழுவின் தலையில் தலைகீழ் 'Y' வடிவக் குறியும், 8வது பகுதியில் 4 கரும்புள்ளிகளும் இருத்தல்."
    ],
    causes: [
      "Strong wind-assisted flight of adult moths across regions.",
      "Continuous mono-cropping of maize without border crops."
    ],
    causesTa: [
      "காற்று வீசும் திசையில் அந்துப்பூச்சிகள் வெகுதூரம் பறந்து வந்து முட்டையிடுதல்.",
      "ஊடுபயிர் இன்றி தொடர்ச்சியாக மக்காச்சோளம் மட்டுமே பயிரிடுதல்."
    ],
    identification: "Inverted Y marking on head capsule with square of four black spots on 8th segment.",
    identificationTa: "தலையில் தலைகீழ் Y குறியீடு மற்றும் உடலின் 8வது வளையத்தில் சதுர வடிவ 4 புள்ளிகள்.",
    prevention: [
      "Deep summer ploughing to expose pupae to predatory birds.",
      "Plant cowpea / pulses as border crop (2:1 ratio).",
      "Install FAW pheromone traps @ 5 traps/acre."
    ],
    preventionTa: [
      "கோடை உழவு செய்து புழுக்களின் கூட்டுப்புழுக்களை அழித்தல்.",
      "விளிம்பு பயிராக தட்டைப்பயறு நடுதல்.",
      "படைப்புழு இனக்கவர்ச்சிப் பொறிகளை ஏக்கருக்கு 5 வீதம் வைத்தல்."
    ],
    treatment: "Whol application of Chlorantraniliprole 18.5% SC @ 80 ml/acre or Spinetoram 11.7% SC @ 100 ml/acre directed into the leaf whorl at early instar stage.",
    treatmentTa: "இளம் புழு பருவத்தில் குளோரான்ட்ரனிலிப்ரோல் 80 மி.லி/ஏக்கர் அல்லது ஸ்பைனெட்டோரம் 100 மி.லி/ஏக்கர் குருத்தில் படும்படி தெளிக்கவும்.",
    remedySource: "ICAR-Indian Institute of Maize Research (IIMR) Advisory",
    remedySourceUrl: "https://iimr.icar.gov.in/fall-armyworm-management",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Direct spray nozzle directly into whorls. Wear personal protective equipment.",
    safetyGuidanceTa: "தெளிப்பு முனையை நேரடியாக குருத்தில் செலுத்தவும். முழு உடல் பாதுகாப்பு கவசம் அணியவும்.",
    reference: "ICAR-IIMR & TNAU Entomology Department"
  },
  {
    id: "zinc-deficiency",
    name: "Zinc Deficiency (Khaira Disease)",
    nameTa: "துத்தநாக ஊட்டச்சத்துக் குறைபாடு (கைரா நோய்)",
    scientificName: "Micro-Nutrient Stress (Zn)",
    type: "deficiency",
    crops: ["Paddy", "Corn (Maize)"],
    pathogenType: "Nutrient",
    affectedStages: ["Tillering", "Vegetative"],
    severity: "Moderate",
    symptoms: [
      "Rusty bronze or reddish-brown pigmentation between veins on lower third leaves.",
      "Stunted uneven plant growth with delayed tillering.",
      "Interveinal chlorosis near the base of young leaves."
    ],
    symptomsTa: [
      "அடி இலைகளில் நரம்புகளுக்கு இடையில் துருப்பிடித்த செம்பழுப்பு நிறப் புள்ளிகள் தோன்றுதல்.",
      "செடிகள் குட்டையாகி வளர்ச்சி குன்றி தூர்கள் உருவாக தாமதமாதல்.",
      "இளம் இலைகளின் அடிப்பகுதியில் நரம்பிடை வெளிர்தல்."
    ],
    causes: [
      "High soil pH (> 7.8) or calcareous soils precipitating zinc.",
      "Prolonged anaerobic submergence reducing zinc availability.",
      "Heavy application of phosphatic fertilizers (DAP) causing Zn-P antagonism."
    ],
    causesTa: [
      "மண்ணின் காரத்தன்மை (> 7.8) அல்லது சுண்ணாம்புத் தன்மை அதிகம் இருத்தல்.",
      "தொடர் நீர் தேக்கத்தால் வேர்களுக்கு துத்தநாகம் கிடைக்காமல் போதல்.",
      "அதிகப்படியான டி.ஏ.பி (DAP) பயன்பாடு."
    ],
    identification: "Bronze discoloration appearing 2-3 weeks after transplanting in patches across field.",
    identificationTa: "நடவு செய்த 2-3 வாரங்களில் வயலில் திட்டுத் திட்டாக செம்பழுப்பு நிறக் கருகல் தோன்றுதல்.",
    prevention: [
      "Soil application of Zinc Sulphate (Heptahydrate 21%) @ 10 kg/acre as basal dressing.",
      "Allow periodic soil aeration (alternate wetting and drying)."
    ],
    preventionTa: [
      "அடி உரமாக துத்தநாக சல்பேட் 10 கிலோ/ஏக்கர் இடவும்.",
      "காய்ச்சலும் பாய்ச்சலுமாக நீர் பாசனம் செய்து மண்ணிற்கு காற்றோட்டம் அளித்தல்."
    ],
    treatment: "Foliar spray of 0.5% Zinc Sulphate (5 g/L) + 0.25% Lime (2.5 g/L) or Chelated Zinc EDTA (12%) @ 1 g/L water twice at 10-day intervals.",
    treatmentTa: "0.5% துத்தநாக சல்பேட் (5 கிராம்/லிட்டர்) + 0.25% சுண்ணாம்பு (2.5 கிராம்/லிட்டர்) கலந்து 10 நாட்கள் இடைவெளியில் இரண்டு முறை தெளிக்கவும்.",
    remedySource: "TNAU Department of Soil Science & Agricultural Chemistry",
    remedySourceUrl: "https://agritech.tnau.ac.in/agriculture/agri_nutrientmgt_micronutrients.html",
    remedyStatus: "UNVERIFIED",
    verificationNote: "Marked UNVERIFIED pending formal review by designated agronomist.",
    safetyGuidance: "Always neutralize Zinc Sulphate with unslaked lime to prevent acidic foliar burn.",
    safetyGuidanceTa: "இலைகள் கருகாமல் இருக்க துத்தநாக சல்பேட்டுடன் சுண்ணாம்மை தவறாமல் சேர்க்கவும்.",
    reference: "TNAU Department of Soil Science & Agricultural Chemistry"
  }
];

interface CropHealthLibraryProps {
  language?: AppLanguage;
  onBack?: () => void;
}

export function CropHealthLibrary({ language = "English", onBack }: CropHealthLibraryProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<CropHealthEntry | null>(null);
  const [activeLang, setActiveLang] = useState<"en" | "ta">(language === "Tamil" ? "ta" : "en");

  const isTa = activeLang === "ta";

  const filtered = HEALTH_LIBRARY.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = 
      item.name.toLowerCase().includes(q) ||
      item.nameTa.toLowerCase().includes(q) ||
      item.scientificName.toLowerCase().includes(q) ||
      item.crops.some(c => c.toLowerCase().includes(q));
    const matchType = selectedType === "all" || item.type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isTa ? "பயிர் நலன் & நோய் களஞ்சியம்" : "Crop Health & Diagnostic Library"}
              </h2>
              <p className="text-xs text-emerald-200">
                {isTa ? "அங்கீகரிக்கப்பட்ட ICAR & TNAU அறிவியல் தகவல் களஞ்சியம்" : "Verified ICAR & TNAU Scientific Agronomic Compendium"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="bg-white/15 p-1 rounded-lg flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => setActiveLang("en")}
                className={`px-2 py-0.5 rounded transition-colors ${!isTa ? "bg-white text-emerald-900 shadow-xs" : "text-white/80 hover:text-white"}`}
              >
                EN
              </button>
              <button
                onClick={() => setActiveLang("ta")}
                className={`px-2 py-0.5 rounded transition-colors ${isTa ? "bg-white text-emerald-900 shadow-xs" : "text-white/80 hover:text-white"}`}
              >
                தமிழ்
              </button>
            </div>
            <DataBadge status="STATIC REFERENCE" detail="ICAR / TNAU Registry" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder={isTa ? "நோய், புழு, பயிர் அல்லது அறிகுறி மூலம் தேடுங்கள்..." : "Search by pest, disease, symptom, or crop (e.g. Blast, Stem borer, Paddy)..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/95 text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {[
          { id: "all", labelEn: "All Diagnoses", labelTa: "அனைத்தும்" },
          { id: "disease", labelEn: "Diseases", labelTa: "நோய்கள்" },
          { id: "pest", labelEn: "Insect Pests", labelTa: "பூச்சிகள்" },
          { id: "deficiency", labelEn: "Nutrient Deficiencies", labelTa: "ஊட்டச்சத்துக் குறைபாடுகள்" }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedType(cat.id)}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors border ${
              selectedType === cat.id
                ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {isTa ? cat.labelTa : cat.labelEn}
          </button>
        ))}
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(entry => (
          <div
            key={entry.id}
            onClick={() => setSelectedEntry(entry)}
            className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs hover:border-emerald-500 transition-all cursor-pointer space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mb-1 ${
                  entry.type === "disease"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : entry.type === "pest"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {entry.pathogenType || entry.type.toUpperCase()} • {entry.crops.join(", ")}
                </span>
                <h3 className="font-bold text-sm text-zinc-900 leading-snug">
                  {isTa ? entry.nameTa : entry.name}
                </h3>
                <p className="text-[11px] text-zinc-500 italic">{entry.scientificName}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  entry.severity === "Critical" 
                    ? "bg-rose-100 text-rose-800" 
                    : entry.severity === "High" 
                      ? "bg-amber-100 text-amber-800" 
                      : "bg-blue-100 text-blue-800"
                }`}>
                  {entry.severity}
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {entry.remedyStatus}
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 text-xs text-zinc-700 space-y-1">
              <strong className="text-zinc-900 block text-[11px]">
                {isTa ? "முக்கிய அடையாளம்:" : "Primary Identification:"}
              </strong>
              <p className="line-clamp-2 text-[11px] leading-relaxed">
                {isTa ? entry.identificationTa : entry.identification}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
              <span className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                {entry.remedySource}
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                {isTa ? "விவரம் பார்க்க" : "View Protocol"} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedEntry.type.toUpperCase()} • {selectedEntry.crops.join(", ")}
                </span>
                <h3 className="font-extrabold text-base text-zinc-900 mt-1">
                  {isTa ? selectedEntry.nameTa : selectedEntry.name}
                </h3>
                <p className="text-zinc-500 italic">{selectedEntry.scientificName}</p>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Symptoms */}
            <div className="space-y-1.5">
              <strong className="text-zinc-800 uppercase tracking-wide block flex items-center gap-1.5 text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                {isTa ? "அறிகுறிகள் & கள சேத அடையாளங்கள்" : "Symptoms & Field Damage Indicators"}
              </strong>
              <ul className="space-y-1 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                {(isTa ? selectedEntry.symptomsTa : selectedEntry.symptoms).map((sym, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{sym}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Causes */}
            <div className="space-y-1.5">
              <strong className="text-zinc-800 uppercase tracking-wide block text-xs">
                {isTa ? "நோய் பரவ சாதகமான காரணிகள்:" : "Predisposing Environmental Conditions:"}
              </strong>
              <ul className="space-y-1 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                {(isTa ? selectedEntry.causesTa : selectedEntry.causes).map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preventive & Treatment */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-emerald-950 uppercase tracking-wide flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isTa ? "பரிந்துரைக்கப்படும் சிகிச்சை & அளவு" : "Scientific Treatment & Dosage"}
                </strong>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  {selectedEntry.remedyStatus}
                </span>
              </div>

              <p className="text-zinc-800 leading-relaxed font-medium bg-white p-2 rounded-lg border border-emerald-100">
                {isTa ? selectedEntry.treatmentTa : selectedEntry.treatment}
              </p>

              {/* Source & Verification Status Disclaimer */}
              <div className="p-2 rounded bg-amber-50/90 border border-amber-200 text-[10px] text-amber-950 space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-700" />
                  {isTa ? "ஆதார வெளியீடு:" : "Verified Agronomic Source:"} {selectedEntry.remedySource}
                </div>
                <div className="text-amber-800 italic">
                  {selectedEntry.verificationNote}
                </div>
                {selectedEntry.remedySourceUrl && (
                  <a
                    href={selectedEntry.remedySourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-semibold flex items-center gap-1 mt-0.5"
                  >
                    {isTa ? "அரசாங்க மூல இணைப்பு பார்க்க" : "View Official Registry"} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="pt-1">
                <strong className="text-emerald-900 block text-[11px] mb-1">
                  {isTa ? "தடுப்பு மேலாண்மை முறைகள்:" : "Preventive Agronomic Measures:"}
                </strong>
                <ul className="space-y-1 text-zinc-700">
                  {(isTa ? selectedEntry.preventionTa : selectedEntry.prevention).map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chemical Safety Guidance */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {isTa ? "மருந்து தெளிப்பு பாதுகாப்பு & அறுவடை இடைவெளி (PHI)" : "Chemical Safety & Pre-Harvest Interval (PHI)"}
              </div>
              <p>{isTa ? selectedEntry.safetyGuidanceTa : selectedEntry.safetyGuidance}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[10px] text-zinc-500">
              <span>Ref: {selectedEntry.reference}</span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white font-semibold text-xs"
              >
                {isTa ? "மூடுக" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
