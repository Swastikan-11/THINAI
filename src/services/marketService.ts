// THINAI Market Intelligence Service
// Agricultural mandi price tracking, 7-day trend analysis, and actionable selling insights

export interface MarketCommodity {
  cropName: string;
  tamilName: string;
  currentPrice: number; // in INR per quintal
  mspPrice: number; // Minimum Support Price benchmark
  weeklyChangePercent: number; // e.g. +2.4%
  trendDirection: "up" | "down" | "stable";
  nearbyMandi: string;
  mandiDistanceKm: number;
  demandStatus: "Very High" | "High" | "Moderate" | "Low";
  sevenDayHistory: { day: string; price: number }[];
  marketInsight: string;
  isDemoData: boolean;
}

export const COMMODITY_MARKETS: Record<string, MarketCommodity> = {
  paddy: {
    cropName: "Paddy (Ponni)",
    tamilName: "நெல் (பொன்னி)",
    currentPrice: 2840,
    mspPrice: 2183,
    weeklyChangePercent: 2.4,
    trendDirection: "up",
    nearbyMandi: "Coimbatore / Thanjavur APMC Mandi",
    mandiDistanceKm: 8.5,
    demandStatus: "High",
    sevenDayHistory: [
      { day: "D-6", price: 2770 },
      { day: "D-5", price: 2790 },
      { day: "D-4", price: 2810 },
      { day: "D-3", price: 2800 },
      { day: "D-2", price: 2825 },
      { day: "D-1", price: 2835 },
      { day: "Today", price: 2840 }
    ],
    marketInsight: "Paddy prices have increased steadily by +2.4% over the last 7 days due to regional procurement demand. Price trajectory is currently favorable compared to the ₹2,183/q MSP benchmark.",
    isDemoData: true
  },
  wheat: {
    cropName: "Wheat (Sharbati)",
    tamilName: "கோதுமை",
    currentPrice: 2150,
    mspPrice: 2275,
    weeklyChangePercent: -1.2,
    trendDirection: "down",
    nearbyMandi: "Madurai Central Mandi",
    mandiDistanceKm: 14.2,
    demandStatus: "Moderate",
    sevenDayHistory: [
      { day: "D-6", price: 2180 },
      { day: "D-5", price: 2175 },
      { day: "D-4", price: 2160 },
      { day: "D-3", price: 2165 },
      { day: "D-2", price: 2155 },
      { day: "D-1", price: 2150 },
      { day: "Today", price: 2150 }
    ],
    marketInsight: "Wheat arrivals have normalized across North-South corridors, softening spot prices slightly (-1.2%). Consider holding buffer stock if you have hermetic bag storage.",
    isDemoData: true
  },
  maize: {
    cropName: "Maize (Hybrid)",
    tamilName: "மக்காச்சோளம்",
    currentPrice: 1940,
    mspPrice: 2090,
    weeklyChangePercent: 3.8,
    trendDirection: "up",
    nearbyMandi: "Udumalpet / Pollachi Mandi",
    mandiDistanceKm: 18.0,
    demandStatus: "High",
    sevenDayHistory: [
      { day: "D-6", price: 1860 },
      { day: "D-5", price: 1880 },
      { day: "D-4", price: 1895 },
      { day: "D-3", price: 1910 },
      { day: "D-2", price: 1925 },
      { day: "D-1", price: 1935 },
      { day: "Today", price: 1940 }
    ],
    marketInsight: "Poultry feed mill demand has surged in western Tamil Nadu, lifting maize prices +3.8% over the past week.",
    isDemoData: true
  },
  tomato: {
    cropName: "Tomato (Hybrid)",
    tamilName: "தக்காளி",
    currentPrice: 1450,
    mspPrice: 900,
    weeklyChangePercent: 12.5,
    trendDirection: "up",
    nearbyMandi: "Hosur / Oddanchatram Mandi",
    mandiDistanceKm: 22.0,
    demandStatus: "Very High",
    sevenDayHistory: [
      { day: "D-6", price: 1220 },
      { day: "D-5", price: 1260 },
      { day: "D-4", price: 1300 },
      { day: "D-3", price: 1350 },
      { day: "D-2", price: 1390 },
      { day: "D-1", price: 1420 },
      { day: "Today", price: 1450 }
    ],
    marketInsight: "Heavy rain in plateau producing belts has disrupted harvest cycles, causing spot wholesale rates to surge +12.5%. Excellent liquidation window for ready produce.",
    isDemoData: true
  }
};

export function getMarketIntelligence(cropName: string = "Paddy"): MarketCommodity {
  const c = cropName.toLowerCase();
  if (c.includes("rice") || c.includes("paddy")) return COMMODITY_MARKETS.paddy;
  if (c.includes("wheat")) return COMMODITY_MARKETS.wheat;
  if (c.includes("maize")) return COMMODITY_MARKETS.maize;
  if (c.includes("tomato")) return COMMODITY_MARKETS.tomato;
  return COMMODITY_MARKETS.paddy;
}
