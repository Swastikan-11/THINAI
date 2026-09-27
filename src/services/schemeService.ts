// THINAI Government Schemes Assistant Service
// Matches schemes based on farmer land size, location, and primary crop

export interface GovtScheme {
  id: string;
  name: string;
  tamilName: string;
  department: string;
  category: "Income Support" | "Insurance" | "Credit" | "Irrigation & Solar" | "Soil & Inputs" | "Machinery";
  eligibility: string[];
  benefits: string;
  requiredDocuments: string[];
  applicationProcess: string;
  officialSource: string;
  portalUrl: string;
  helpline: string;
  matchingCriteria: {
    maxLandHa?: number; // e.g. 2 hectares for marginal farmer
    states?: string[];
    crops?: string[];
  };
}

export const SCHEMES_DATABASE: GovtScheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    tamilName: "பி.எம் கிசான் திட்டம்",
    department: "Ministry of Agriculture & Farmers Welfare, Govt of India",
    category: "Income Support",
    eligibility: [
      "All landholding farmer families with cultivable landholding in their names",
      "Valid Aadhaar and bank account linked to Aadhaar",
      "Institutional landholders and high-income tax payers excluded"
    ],
    benefits: "Direct financial support of ₹6,000 per year transferred in 3 equal installments of ₹2,000 every 4 months.",
    requiredDocuments: ["Aadhaar Card", "Land Ownership Documents (Chitta / Patta)", "Bank Passbook", "Mobile number linked to Aadhaar"],
    applicationProcess: "Apply online at pmkisan.gov.in or through nearest Common Service Centre (CSC) / Village Administrative Officer (VAO).",
    officialSource: "https://pmkisan.gov.in",
    portalUrl: "https://pmkisan.gov.in",
    helpline: "155261 / 011-24300606",
    matchingCriteria: {
      maxLandHa: 10
    }
  },
  {
    id: "pmfby",
    name: "PM Fasal Bima Yojana (PMFBY)",
    tamilName: "பிரதமர் பயிர் காப்பீட்டுத் திட்டம்",
    department: "Department of Agriculture and Cooperation",
    category: "Insurance",
    eligibility: [
      "All farmers growing notified crops in notified areas",
      "Both loanee and non-loanee farmers eligible",
      "Sharecroppers and tenant farmers with land lease agreements eligible"
    ],
    benefits: "Comprehensive risk insurance for crop loss due to non-preventable natural risks (cyclone, drought, flood, pests). Farmer pays only 1.5% - 2% premium.",
    requiredDocuments: ["Sowing Certificate / Adangal", "Patta / Land Records", "Aadhaar Card", "Bank Account Details", "Cancelled Cheque"],
    applicationProcess: "Enroll through designated bank branches, CSC, or online at pmfby.gov.in before the seasonal cutoff date.",
    officialSource: "https://pmfby.gov.in",
    portalUrl: "https://pmfby.gov.in",
    helpline: "1800-180-1551",
    matchingCriteria: {
      crops: ["Rice", "Paddy", "Wheat", "Maize", "Cotton", "Groundnut", "Sugarcane"]
    }
  },
  {
    id: "kisan-credit-card",
    name: "Kisan Credit Card (KCC) Scheme",
    tamilName: "கிசான் கடன் அட்டை திட்டம்",
    department: "NABARD & Reserve Bank of India",
    category: "Credit",
    eligibility: [
      "Owner cultivators, tenant farmers, oral lessees, and sharecroppers",
      "Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers"
    ],
    benefits: "Flexible credit limit up to ₹3,00,000 at a concessional interest rate of 4% (with 3% prompt repayment incentive). Covers crop cultivation, post-harvest, and farm maintenance expenses.",
    requiredDocuments: ["Land Revenue Record / Patta Chitta", "ID & Address Proof (Aadhaar / Voter ID)", "Recent passport size photos"],
    applicationProcess: "Submit simplified 1-page form at any commercial bank, RRB, or Cooperative bank.",
    officialSource: "https://www.myscheme.gov.in/schemes/kcc",
    portalUrl: "https://www.nabard.org",
    helpline: "1800-11-5555",
    matchingCriteria: {
      maxLandHa: 20
    }
  },
  {
    id: "pm-kusum",
    name: "PM-KUSUM (Solar Agricultural Pumps)",
    tamilName: "பி.எம் குசும் சூரிய சக்தி பம்பு திட்டம்",
    department: "Ministry of New and Renewable Energy (MNRE)",
    category: "Irrigation & Solar",
    eligibility: [
      "Individual farmers, farmer groups, water user associations",
      "Farmers with agricultural land possessing grid or off-grid diesel pumps"
    ],
    benefits: "Up to 90% subsidy on stand-alone solar agricultural pumps (60% Govt subsidy + 30% bank loan; farmer pays only 10%). Eliminates diesel expenditure.",
    requiredDocuments: ["Land Patta", "Aadhaar Card", "Bank Account Details", "Electricity Board No-Objection Certificate"],
    applicationProcess: "Apply through State Renewable Energy Agency portal (e.g. TEDA in Tamil Nadu).",
    officialSource: "https://pmkusum.mnre.gov.in",
    portalUrl: "https://pmkusum.mnre.gov.in",
    helpline: "1800-180-3333",
    matchingCriteria: {
      crops: ["Paddy", "Sugarcane", "Banana", "Cotton", "Vegetables"]
    }
  },
  {
    id: "tn-micro-irrigation",
    name: "Tamil Nadu Micro Irrigation Scheme (Drip / Sprinkler)",
    tamilName: "தமிழ்நாடு சொட்டு நீர் பாசன மானிய திட்டம்",
    department: "Department of Horticulture & Plantation Crops, Govt of Tamil Nadu",
    category: "Irrigation & Solar",
    eligibility: [
      "Small and marginal farmers holding up to 5 acres get 100% subsidy",
      "Other farmers get 75% subsidy",
      "Registered farmland in Tamil Nadu with functional well/borewell"
    ],
    benefits: "100% subsidy for small/marginal farmers for installing precision drip or sprinkler irrigation systems.",
    requiredDocuments: ["Patta / Chitta", "FMB Sketch", "Aadhaar Card", "Water & Soil Test Report", "Ration Card"],
    applicationProcess: "Register at Department of Horticulture office or online through TN Horticulture portal.",
    officialSource: "https://tnhorticulture.tn.gov.in",
    portalUrl: "https://tnhorticulture.tn.gov.in",
    helpline: "044-28592230",
    matchingCriteria: {
      states: ["Tamil Nadu"],
      maxLandHa: 2
    }
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card Scheme",
    tamilName: "மண் வள அட்டை திட்டம்",
    department: "Department of Agriculture & Cooperation",
    category: "Soil & Inputs",
    eligibility: ["All farmers across India possessing agricultural land"],
    benefits: "Free comprehensive laboratory testing of 12 soil parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) issued every 2 years with crop-specific fertilizer recommendations.",
    requiredDocuments: ["Land location coordinates / Survey number", "Aadhaar Card"],
    applicationProcess: "Soil samples collected free by local Agriculture Officer / KVK scientists.",
    officialSource: "https://soilhealth.dac.gov.in",
    portalUrl: "https://soilhealth.dac.gov.in",
    helpline: "011-24305555",
    matchingCriteria: {}
  }
];

export function getRelevantSchemes(farmerState: string, farmSizeHa: number): { relevant: GovtScheme[]; others: GovtScheme[] } {
  const relevant: GovtScheme[] = [];
  const others: GovtScheme[] = [];

  for (const scheme of SCHEMES_DATABASE) {
    const isSmallFarmer = farmSizeHa <= (scheme.matchingCriteria.maxLandHa || 100);
    const matchesState = !scheme.matchingCriteria.states || scheme.matchingCriteria.states.includes(farmerState);

    if (isSmallFarmer && matchesState) {
      relevant.push(scheme);
    } else {
      others.push(scheme);
    }
  }

  return { relevant, others };
}
