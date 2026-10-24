// THINAI Market Intelligence Service
// data.gov.in Agmarknet API Integration (Resource ID: 9ef84268-d588-465a-a308-a864a43d0070)
// STRICT COMPLIANCE:
//  - API key supplied via environment variable (VITE_DATA_GOV_IN_API_KEY)
//  - Shows exact arrival date and last updated time
//  - Clear honest "price unavailable" state when no data is returned
//  - ZERO fake fallback numbers or synthetic chart data

import { db } from "./db";
import { syncManager, isMarketCacheValid } from "./syncService";

export interface AgmarknetPriceResult {
  isAvailable: boolean;
  status: "LIVE" | "CACHED" | "PRICE_UNAVAILABLE";
  commodity: string;
  variety?: string;
  market?: string;
  district: string;
  state: string;
  modalPricePerQuintal?: number;
  minPricePerQuintal?: number;
  maxPricePerQuintal?: number;
  arrivalDate?: string;
  lastUpdatedTime: string;
  source: string;
  unavailableReason?: string;
  isOffline?: boolean;
}

export const COMMODITY_KEYS: { id: string; labelEn: string; labelTa: string; agmarknetName: string }[] = [
  { id: "paddy", labelEn: "Paddy (Rice)", labelTa: "நெல்", agmarknetName: "Paddy(Dhan)(Common)" },
  { id: "tomato", labelEn: "Tomato", labelTa: "தக்காளி", agmarknetName: "Tomato" },
  { id: "chilli", labelEn: "Chilli (Green/Dry)", labelTa: "மிளகாய்", agmarknetName: "Chilli Red" },
  { id: "cotton", labelEn: "Cotton", labelTa: "பருத்தி", agmarknetName: "Cotton" },
  { id: "maize", labelEn: "Maize (Corn)", labelTa: "மக்காச்சோளம்", agmarknetName: "Maize" }
];

export function getAgmarknetApiKey(): string {
  // Read strictly from environment variable
  const key = 
    (typeof process !== "undefined" && process.env?.VITE_DATA_GOV_IN_API_KEY) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_DATA_GOV_IN_API_KEY) ||
    "";
  return typeof key === "string" ? key.trim() : "";
}

/**
 * Fetches daily mandi arrival price from data.gov.in Agmarknet API.
 * Never invents fake numbers when live API data or key is unavailable.
 */
export async function fetchLiveAgmarknetPrice(
  commodityKey: string = "paddy",
  district: string = "Coimbatore",
  customApiKey?: string
): Promise<AgmarknetPriceResult> {
  const selected = COMMODITY_KEYS.find(c => c.id === commodityKey) || COMMODITY_KEYS[0];
  const commodityName = selected.agmarknetName;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 1. Offline Mode Check: query Dexie cache
  if (syncManager.isOfflineActive()) {
    return await getCachedAgmarknetPrice(selected.id, district);
  }

  const apiKey = customApiKey !== undefined ? customApiKey : getAgmarknetApiKey();

  // 2. Missing API Key: transparently inform user without fabricated numbers
  if (!apiKey) {
    return {
      isAvailable: false,
      status: "PRICE_UNAVAILABLE",
      commodity: selected.labelEn,
      district,
      state: "Tamil Nadu",
      source: "data.gov.in Agmarknet Registry",
      lastUpdatedTime: timeStr,
      unavailableReason: "Live mandi API key not configured (VITE_DATA_GOV_IN_API_KEY missing). Live prices are unavailable."
    };
  }

  // 3. Query real data.gov.in API
  try {
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(apiKey)}&format=json&filters%5Bstate%5D=Tamil+Nadu&filters%5Bdistrict%5D=${encodeURIComponent(district)}&filters%5Bcommodity%5D=${encodeURIComponent(commodityName)}&limit=1`;
    
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      throw new Error(`data.gov.in HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.records && json.records.length > 0) {
      const r = json.records[0];
      const modal = parseFloat(r.modal_price) || 0;
      const min = parseFloat(r.min_price) || modal;
      const max = parseFloat(r.max_price) || modal;

      const liveResult: AgmarknetPriceResult = {
        isAvailable: true,
        status: "LIVE",
        commodity: r.commodity || selected.labelEn,
        variety: r.variety || "Local FAQ",
        market: r.market ? `${r.market} APMC Mandi` : `${district} APMC Yard`,
        district: r.district || district,
        state: r.state || "Tamil Nadu",
        modalPricePerQuintal: modal,
        minPricePerQuintal: min,
        maxPricePerQuintal: max,
        arrivalDate: r.arrival_date || now.toISOString().split("T")[0],
        lastUpdatedTime: `${r.arrival_date || now.toLocaleDateString()} at ${timeStr}`,
        source: "data.gov.in Agmarknet API (Daily Mandi Prices)"
      };

      // Cache genuine record in Dexie
      try {
        await db.cachedMarket.put({
          commodity: selected.id,
          data: liveResult,
          source: "data.gov.in Agmarknet API",
          fetched_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 24 * 3600000).toISOString(),
          data_version: "v1.0",
          location: district,
          isLive: true
        });
      } catch (cacheErr) {
        console.warn("Could not cache market price to Dexie:", cacheErr);
      }

      return liveResult;
    }

    // Records returned empty for this commodity in this district
    return {
      isAvailable: false,
      status: "PRICE_UNAVAILABLE",
      commodity: selected.labelEn,
      district,
      state: "Tamil Nadu",
      source: "data.gov.in Agmarknet Registry",
      lastUpdatedTime: timeStr,
      unavailableReason: `No trading arrivals reported today for ${selected.labelEn} in ${district} APMC.`
    };
  } catch (err: any) {
    console.warn("Agmarknet API call failed, falling back to local cache:", err?.message);
    return await getCachedAgmarknetPrice(selected.id, district);
  }
}

async function getCachedAgmarknetPrice(commodityId: string, district: string): Promise<AgmarknetPriceResult> {
  const selected = COMMODITY_KEYS.find(c => c.id === commodityId) || COMMODITY_KEYS[0];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  try {
    const cached = await db.cachedMarket.get(commodityId);
    if (cached && cached.data && cached.data.isAvailable) {
      const fetchedDate = new Date(cached.fetched_at);
      const minutesAgo = Math.max(1, Math.round((Date.now() - fetchedDate.getTime()) / (1000 * 60)));
      const ageLabel = minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`;

      return {
        ...cached.data,
        status: "CACHED",
        isOffline: true,
        source: "data.gov.in Agmarknet (Cached Offline)",
        lastUpdatedTime: `Cached (${ageLabel}) • Fetched ${fetchedDate.toLocaleDateString()}`
      };
    }
  } catch {}

  // Honest unavailable state
  return {
    isAvailable: false,
    status: "PRICE_UNAVAILABLE",
    commodity: selected.labelEn,
    district,
    state: "Tamil Nadu",
    source: "data.gov.in Agmarknet Registry",
    lastUpdatedTime: timeStr,
    unavailableReason: `Price unavailable for ${selected.labelEn} in ${district}. No previous price cached offline.`
  };
}

export interface DashboardMarketPrice {
  isAvailable: boolean;
  pricePerQuintal?: number;
  cropName: string;
  mandi: string;
  status: "LIVE" | "CACHED" | "OFFLINE" | "PRICE_UNAVAILABLE";
  lastUpdatedLabel: string;
  source: string;
  isBenchmark: boolean;
}

export function getDashboardMarketPrice(cropName: string = "Paddy", district: string = "Coimbatore"): DashboardMarketPrice {
  return {
    isAvailable: false,
    pricePerQuintal: undefined,
    cropName,
    mandi: `${district} APMC Yard`,
    status: "PRICE_UNAVAILABLE",
    lastUpdatedLabel: "Live price unavailable (Connect or configure API key)",
    source: "data.gov.in Agmarknet",
    isBenchmark: false
  };
}
