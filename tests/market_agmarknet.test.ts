import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  fetchLiveAgmarknetPrice,
  getAgmarknetApiKey,
  getDashboardMarketPrice,
  COMMODITY_KEYS
} from "../src/services/marketService";
import { db } from "../src/services/db";
import { syncManager } from "../src/services/syncService";

describe("Phase 3 - Feature 4: data.gov.in Agmarknet Market Intelligence Service", () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true, writable: true });
    await db.cachedMarket.clear();
    syncManager.toggleManualOffline(false);
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    syncManager.toggleManualOffline(false);
    vi.restoreAllMocks();
  });

  it("should return empty string or trimmed string for getAgmarknetApiKey", () => {
    const key = getAgmarknetApiKey();
    expect(typeof key).toBe("string");
  });

  it("should return honest PRICE_UNAVAILABLE status when API key is missing", async () => {
    // Calling with empty custom key
    const result = await fetchLiveAgmarknetPrice("paddy", "Coimbatore", "");

    expect(result.isAvailable).toBe(false);
    expect(result.status).toBe("PRICE_UNAVAILABLE");
    expect(result.modalPricePerQuintal).toBeUndefined();
    expect(result.minPricePerQuintal).toBeUndefined();
    expect(result.unavailableReason).toContain("VITE_DATA_GOV_IN_API_KEY missing");
    expect(result.source).toBe("data.gov.in Agmarknet Registry");
  });

  it("should parse real data.gov.in Agmarknet response and cache to Dexie", async () => {
    const fakeApiResponse = {
      records: [
        {
          state: "Tamil Nadu",
          district: "Coimbatore",
          market: "Coimbatore",
          commodity: "Paddy(Dhan)(Common)",
          variety: "ADT 37",
          arrival_date: "24/10/2026",
          min_price: "2250",
          max_price: "2400",
          modal_price: "2325"
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeApiResponse
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchLiveAgmarknetPrice("paddy", "Coimbatore", "test-mock-api-key-12345");

    expect(result.isAvailable).toBe(true);
    expect(result.status).toBe("LIVE");
    expect(result.modalPricePerQuintal).toBe(2325);
    expect(result.minPricePerQuintal).toBe(2250);
    expect(result.maxPricePerQuintal).toBe(2400);
    expect(result.commodity).toBe("Paddy(Dhan)(Common)");
    expect(result.market).toContain("Coimbatore APMC Mandi");
    expect(result.source).toContain("data.gov.in Agmarknet API");

    // Verify Dexie cached the entry
    const cachedEntry = await db.cachedMarket.get("paddy");
    expect(cachedEntry).toBeDefined();
    expect(cachedEntry?.data.modalPricePerQuintal).toBe(2325);
  });

  it("should return PRICE_UNAVAILABLE when API returns empty records", async () => {
    const fakeEmptyResponse = {
      records: []
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeEmptyResponse
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchLiveAgmarknetPrice("cotton", "Madurai", "valid-api-key");

    expect(result.isAvailable).toBe(false);
    expect(result.status).toBe("PRICE_UNAVAILABLE");
    expect(result.modalPricePerQuintal).toBeUndefined();
    expect(result.unavailableReason).toContain("No trading arrivals reported today for Cotton");
  });

  it("should retrieve cached Agmarknet price with cache age when offline is active", async () => {
    // Populate Dexie cache
    const fetchedTime = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 mins ago
    await db.cachedMarket.put({
      commodity: "paddy",
      data: {
        isAvailable: true,
        status: "LIVE",
        commodity: "Paddy (Rice)",
        district: "Coimbatore",
        state: "Tamil Nadu",
        modalPricePerQuintal: 2350,
        minPricePerQuintal: 2280,
        maxPricePerQuintal: 2420,
        arrivalDate: "2026-10-24",
        lastUpdatedTime: "10:30 AM",
        source: "data.gov.in Agmarknet API"
      },
      source: "data.gov.in Agmarknet API",
      fetched_at: fetchedTime,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      data_version: "v1.0",
      location: "Coimbatore",
      isLive: true
    });

    // Go offline
    syncManager.toggleManualOffline(true);

    const result = await fetchLiveAgmarknetPrice("paddy", "Coimbatore");

    expect(result.isAvailable).toBe(true);
    expect(result.status).toBe("CACHED");
    expect(result.isOffline).toBe(true);
    expect(result.modalPricePerQuintal).toBe(2350);
    expect(result.source).toContain("Cached Offline");
    expect(result.lastUpdatedTime).toContain("15m ago");
  });

  it("should return PRICE_UNAVAILABLE when offline and no cached entry exists", async () => {
    syncManager.toggleManualOffline(true);

    const result = await fetchLiveAgmarknetPrice("tomato", "Salem");

    expect(result.isAvailable).toBe(false);
    expect(result.status).toBe("PRICE_UNAVAILABLE");
    expect(result.unavailableReason).toContain("No previous price cached offline");
  });

  it("getDashboardMarketPrice should return honest unavailable state without fake numbers", () => {
    const dash = getDashboardMarketPrice("Paddy", "Coimbatore");
    expect(dash.isAvailable).toBe(false);
    expect(dash.pricePerQuintal).toBeUndefined();
    expect(dash.status).toBe("PRICE_UNAVAILABLE");
    expect(dash.lastUpdatedLabel).toContain("unavailable");
  });

  it("COMMODITY_KEYS list should contain standard crops with Tamil translations", () => {
    expect(COMMODITY_KEYS.length).toBeGreaterThanOrEqual(4);
    const paddy = COMMODITY_KEYS.find(c => c.id === "paddy");
    expect(paddy?.labelTa).toBe("நெல்");
    expect(paddy?.agmarknetName).toBe("Paddy(Dhan)(Common)");
  });
});
