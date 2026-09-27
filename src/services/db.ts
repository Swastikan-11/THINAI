import Dexie, { Table } from "dexie";

export interface LocalProfile {
  id: string; // e.g. "profile-<userId>"
  userId: string;
  data: {
    name: string;
    phone?: string;
    email?: string;
    village: string;
    district: string;
    stateName: string;
    farmSize: string;
    soilType: string;
    primaryCrop: string;
    cropVariety: string;
    cropStage: string;
    sowingDate: string;
    irrigationType: string;
    farmingMethod: string;
    waterSource: string;
    mainCrops: string;
    language: string;
  };
  updatedAt: string;
  synced: boolean;
}

export interface LocalFarm {
  id: string;
  userId: string;
  name: string;
  totalAreaAcres: number;
  district: string;
  state: string;
  updatedAt: string;
  synced: boolean;
}

export interface LocalField {
  id: string;
  farmId: string;
  userId: string;
  name: string;
  areaAcres: number;
  soilType: string;
  currentCrop: string;
  cropVariety: string;
  cropStage: string;
  updatedAt: string;
  synced: boolean;
}

export interface LocalActivity {
  id: string;
  userId: string;
  fieldId: string;
  activityType: string;
  date: string;
  notes: string;
  costRs?: number;
  source: string;
  updatedAt: string;
  pendingSync: boolean;
  synced: boolean;
}

export interface LocalFeedback {
  id: string;
  userId: string;
  recommendationId: string;
  actionTaken: string;
  rating: number;
  cropObservation: string;
  notes?: string;
  costSavedEstimate?: number;
  recordedAt: string;
  pendingSync: boolean;
  synced: boolean;
}

export interface LocalScan {
  id: string;
  userId: string;
  diseaseName: string;
  scientificName?: string;
  confidence: number;
  severity: string;
  isReliable: boolean;
  immediateAction?: string;
  scannedAt: string;
  pendingSync: boolean;
  synced: boolean;
}

export interface CachedWeatherRecord {
  district: string;
  data: any;
  fetchedAt: string;
  source: string;
  isOutdated: boolean;
}

export interface CachedMarketRecord {
  commodity: string;
  data: any;
  fetchedAt: string;
  source: string;
}

export interface CachedRecommendationRecord {
  id: string;
  userId: string;
  fieldId: string;
  data: any;
  generatedAt: string;
  isOffline: boolean;
}

export interface SyncQueueItem {
  id?: number;
  userId: string;
  entity: "profile" | "farm" | "field" | "activity" | "feedback" | "scan";
  action: "create" | "update" | "delete";
  clientId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
}

export class ThinaiDatabase extends Dexie {
  profiles!: Table<LocalProfile, string>;
  farms!: Table<LocalFarm, string>;
  fields!: Table<LocalField, string>;
  activities!: Table<LocalActivity, string>;
  feedbacks!: Table<LocalFeedback, string>;
  scans!: Table<LocalScan, string>;
  cachedWeather!: Table<CachedWeatherRecord, string>;
  cachedMarket!: Table<CachedMarketRecord, string>;
  cachedRecommendations!: Table<CachedRecommendationRecord, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("thinai_offline_db");
    this.version(1).stores({
      profiles: "id, userId, updatedAt",
      farms: "id, userId, district",
      fields: "id, farmId, userId",
      activities: "id, userId, fieldId, date, pendingSync",
      feedbacks: "id, userId, recommendationId, pendingSync",
      scans: "id, userId, scannedAt, pendingSync",
      cachedWeather: "district, fetchedAt",
      cachedMarket: "commodity, fetchedAt",
      cachedRecommendations: "id, userId, fieldId, generatedAt",
      syncQueue: "++id, userId, entity, clientId, timestamp, status"
    });
  }
}

export const db = new ThinaiDatabase();
