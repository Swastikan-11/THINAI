// THINAI Farm Activity Tracker / Farm Diary
// Chronological farm journal: Sowing, Irrigation, Fertilizer, Pesticide, Disease, Weather, Harvest, Expense, Yield

export type ActivityType =
  | "Sowing"
  | "Irrigation"
  | "Fertilizer"
  | "Pesticide"
  | "Disease Observation"
  | "Weather Event"
  | "Harvest"
  | "Expense"
  | "Yield Observation"
  | "THINAI Action";

export interface FarmActivity {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  activityType: ActivityType;
  crop: string;
  fieldPlot?: string;
  notes: string;
  quantityOrDose?: string;
  costIncurred?: number; // in INR
  imageUri?: string;
  source: "farmer" | "thinai_recommendation";
}

const DIARY_STORAGE_KEY = "thinai_farm_diary_entries";

const DEFAULT_DIARY_ENTRIES: FarmActivity[] = [
  {
    id: "act-1",
    date: new Date(Date.now() - 32 * 86400000).toISOString().split("T")[0],
    activityType: "Sowing",
    crop: "Paddy (Ponni)",
    fieldPlot: "Main Field (2 Acres)",
    notes: "Nursery sowing completed using certified seed stock from TNAU. Seed treatment with Trichoderma done.",
    costIncurred: 1800,
    source: "farmer"
  },
  {
    id: "act-2",
    date: new Date(Date.now() - 18 * 86400000).toISOString().split("T")[0],
    activityType: "Sowing",
    crop: "Paddy (Ponni)",
    fieldPlot: "Main Field (2 Acres)",
    notes: "Main field transplanting with 20-day-old seedlings. 2-3 seedlings per hill spaced 20x15cm.",
    costIncurred: 4500,
    source: "farmer"
  },
  {
    id: "act-3",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
    activityType: "Irrigation",
    crop: "Paddy (Ponni)",
    fieldPlot: "Main Field (2 Acres)",
    notes: "Standard shallow flooding maintained at 2-3 cm for active tillering initiation.",
    costIncurred: 350,
    source: "farmer"
  },
  {
    id: "act-4",
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    activityType: "THINAI Action",
    crop: "Paddy (Ponni)",
    fieldPlot: "Main Field (2 Acres)",
    notes: "THINAI Recommendation applied: Inspected field bunds and delayed irrigation ahead of heavy rain.",
    costIncurred: 0,
    source: "thinai_recommendation"
  }
];

export function getFarmDiary(): FarmActivity[] {
  try {
    const raw = localStorage.getItem(DIARY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(DEFAULT_DIARY_ENTRIES));
      return DEFAULT_DIARY_ENTRIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DIARY_ENTRIES;
  }
}

export function addFarmActivity(activity: Omit<FarmActivity, "id">): FarmActivity {
  const current = getFarmDiary();
  const newEntry: FarmActivity = {
    ...activity,
    id: `act-${Date.now()}`
  };
  const updated = [newEntry, ...current];
  try {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save diary entry", e);
  }
  return newEntry;
}

export function deleteFarmActivity(id: string): void {
  const current = getFarmDiary();
  const updated = current.filter(a => a.id !== id);
  localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(updated));
}
