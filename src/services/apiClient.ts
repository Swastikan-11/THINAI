import { getCurrentAuthToken } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getCurrentAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  // Timeout controller: 8 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      let errMsg = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) errMsg = errorData.detail;
      } catch {}
      throw new Error(errMsg);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── API CLIENT METHODS ───────────────────────────────────────────────────────

export const apiClient = {
  // System Health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch("http://localhost:8000/health", { method: "GET" });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth & Profile
  async getProfile() {
    return apiRequest("/auth/me");
  },
  async updateProfile(profileData: any) {
    return apiRequest("/auth/profile", {
      method: "POST",
      body: JSON.stringify(profileData)
    });
  },
  async deleteAccount() {
    return apiRequest("/auth/me", { method: "DELETE" });
  },

  // Farms & Fields
  async getFarms() {
    return apiRequest("/farms");
  },
  async createFarm(farm: any) {
    return apiRequest("/farms", {
      method: "POST",
      body: JSON.stringify(farm)
    });
  },
  async getFields(farmId?: string) {
    const query = farmId ? `?farm_id=${farmId}` : "";
    return apiRequest(`/fields${query}`);
  },
  async createField(farmId: string, field: any) {
    return apiRequest(`/fields?farm_id=${farmId}`, {
      method: "POST",
      body: JSON.stringify(field)
    });
  },

  // Recommendations & ARFI
  async generateRecommendation(fieldId: string) {
    return apiRequest(`/recommendations/generate?field_id=${fieldId}`, {
      method: "POST"
    });
  },
  async getRecommendations(fieldId?: string) {
    const query = fieldId ? `?field_id=${fieldId}` : "";
    return apiRequest(`/recommendations${query}`);
  },

  // What-If Lab
  async simulateWhatIf(payload: any) {
    return apiRequest("/what-if/simulate", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Weather & Market
  async getWeather(lat = 11.0168, lon = 76.9558) {
    return apiRequest(`/weather?latitude=${lat}&longitude=${lon}`);
  },
  async getMarketPrices() {
    return apiRequest("/market");
  },

  // Schemes & Economics
  async getSchemes(state = "Tamil Nadu", farmSize = 2.0) {
    return apiRequest(`/schemes?state=${encodeURIComponent(state)}&farm_size=${farmSize}`);
  },
  async getEconomics(fieldId: string, crop = "Paddy (Rice)", area = 2.0) {
    return apiRequest(`/economics/${fieldId}?crop=${encodeURIComponent(crop)}&area_acres=${area}`);
  },

  // Disease Scans
  async recordScan(scan: any) {
    return apiRequest("/disease/scan", {
      method: "POST",
      body: JSON.stringify(scan)
    });
  },
  async getScanHistory(fieldId?: string) {
    const query = fieldId ? `?field_id=${fieldId}` : "";
    return apiRequest(`/disease/history${query}`);
  },

  // Activities & Feedback
  async getActivities(fieldId?: string) {
    const query = fieldId ? `?field_id=${fieldId}` : "";
    return apiRequest(`/activities${query}`);
  },
  async logActivity(activity: any) {
    return apiRequest("/activities", {
      method: "POST",
      body: JSON.stringify(activity)
    });
  },
  async submitFeedback(feedback: any) {
    return apiRequest("/feedback", {
      method: "POST",
      body: JSON.stringify(feedback)
    });
  },

  // Offline Synchronization Engine
  async pushSync(mutations: any[]) {
    return apiRequest("/sync/push", {
      method: "POST",
      body: JSON.stringify({ mutations })
    });
  },
  async pullSync(lastSyncTimestamp?: string) {
    return apiRequest("/sync/pull", {
      method: "POST",
      body: JSON.stringify({ last_sync_timestamp: lastSyncTimestamp })
    });
  },
  async getSyncStatus() {
    return apiRequest("/sync/status");
  }
};
