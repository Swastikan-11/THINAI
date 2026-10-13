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

export interface SoilObservation {
  id: string;
  userId: string;
  fieldId: string;
  nitrogenKgPerAcre?: number;
  phosphorusKgPerAcre?: number;
  potassiumKgPerAcre?: number;
  soilPh?: number;
  organicCarbonPercent?: number;
  source: "Farmer Provided" | "Soil Health Card" | "Lab Report";
  recordedAt: string;
  synced: boolean;
}

export interface LocalFeedback {
  id: string;
  userId: string;
  recommendationId: string;
  actionTaken: "completed" | "modified" | "rejected";
  rating: number; // 1 to 5
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
  cropName: string;
  diseaseName: string;
  scientificName?: string;
  confidence: number;
  severity: "Low" | "Medium" | "High";
  isReliable: boolean;
  immediateAction?: string;
  preventionAdvice?: string;
  scannedAt: string;
  pendingSync: boolean;
  synced: boolean;
}

export interface CachedWeatherRecord {
  district: string;
  data: any;
  source: string;
  fetched_at: string;
  expires_at: string;
  data_version: string;
  location?: string;
  isOutdated: boolean;
}

export interface CachedMarketRecord {
  commodity: string;
  data: any;
  source: string;
  fetched_at: string;
  expires_at: string;
  data_version: string;
  location?: string;
  isLive: boolean;
}

export interface CachedRecommendationRecord {
  id: string;
  userId: string;
  fieldId: string;
  data: any;
  generatedAt: string;
  isOffline: boolean;
}

export interface CachedARFIAssessment {
  id: string;
  userId: string;
  fieldId: string;
  arfiScore: number;
  fragilityLevel: "STABLE" | "MODERATE" | "FRAGILE";
  components: any;
  evaluatedAt: string;
}

export interface CachedSchemeRecord {
  id: string;
  schemeName: string;
  category: string;
  targetCrops: string[];
  maxSubsidyPercent: number;
  maxSubsidyAmountRs: number;
  eligibilityDescription: string;
  requiredDocuments: string[];
  officialPortalUrl: string;
  lastVerifiedDate: string;
}

export interface SyncQueueItem {
  id?: number;
  userId: string;
  entity: "profile" | "farm" | "field" | "soil" | "feedback" | "scan" | "recommendation";
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
  soilObservations!: Table<SoilObservation, string>;
  feedbacks!: Table<LocalFeedback, string>;
  scans!: Table<LocalScan, string>;
  cachedWeather!: Table<CachedWeatherRecord, string>;
  cachedMarket!: Table<CachedMarketRecord, string>;
  cachedRecommendations!: Table<CachedRecommendationRecord, string>;
  cachedARFI!: Table<CachedARFIAssessment, string>;
  cachedSchemes!: Table<CachedSchemeRecord, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("thinai_offline_db");
    this.version(2).stores({
      profiles: "id, userId, updatedAt",
      farms: "id, userId, district",
      fields: "id, farmId, userId",
      soilObservations: "id, userId, fieldId, recordedAt",
      feedbacks: "id, userId, recommendationId, pendingSync",
      scans: "id, userId, scannedAt, pendingSync",
      cachedWeather: "district, fetched_at, expires_at",
      cachedMarket: "commodity, fetched_at, expires_at",
      cachedRecommendations: "id, userId, fieldId, generatedAt",
      cachedARFI: "id, userId, fieldId, evaluatedAt",
      cachedSchemes: "id, category",
      syncQueue: "++id, userId, entity, clientId, timestamp, status"
    });
  }
}

export const db = new ThinaiDatabase();
