// THINAI Farm Record Management Service
// Inspired by farmOS record-keeping principles: plots, crops, sowing dates, spray logs, expense ledger
// Strictly offline-first implementation backed by IndexedDB (Dexie) with sync queue persistence.

import { db, LocalPlot, LocalSprayLog, LocalFarmExpense } from "./db";

export function getDaysAfterSowing(sowingDateStr?: string): number | null {
  if (!sowingDateStr) return null;
  const sowingDate = new Date(sowingDateStr);
  if (isNaN(sowingDate.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - sowingDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// ─── 1. PLOTS & CROPS ─────────────────────────────────────────────────────────

export async function getPlots(userId: string): Promise<LocalPlot[]> {
  try {
    const list = await db.plots.where("userId").equals(userId).toArray();
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error("Failed to get plots from Dexie:", err);
    return [];
  }
}

export async function savePlot(
  plot: Omit<LocalPlot, "id" | "createdAt" | "updatedAt" | "synced"> & { id?: string }
): Promise<LocalPlot> {
  const now = new Date().toISOString();
  const id = plot.id || `plot-${plot.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
  const record: LocalPlot = {
    ...plot,
    id,
    createdAt: now,
    updatedAt: now,
    synced: false
  };

  await db.plots.put(record);

  // Enqueue for offline sync
  try {
    await db.syncQueue.add({
      userId: plot.userId,
      entity: "plot",
      action: plot.id ? "update" : "create",
      clientId: id,
      payload: record,
      timestamp: now,
      retryCount: 0,
      status: "pending"
    });
  } catch (syncErr) {
    console.warn("Could not enqueue plot sync item:", syncErr);
  }

  return record;
}

export async function deletePlot(id: string, userId: string): Promise<boolean> {
  try {
    await db.plots.delete(id);
    await db.syncQueue.add({
      userId,
      entity: "plot",
      action: "delete",
      clientId: id,
      payload: { id },
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
    return true;
  } catch (err) {
    console.error("Failed to delete plot:", err);
    return false;
  }
}

// ─── 2. SPRAY LOGS ───────────────────────────────────────────────────────────

export async function getSprayLogs(userId: string, plotId?: string): Promise<LocalSprayLog[]> {
  try {
    let list: LocalSprayLog[];
    if (plotId) {
      list = await db.sprayLogs.where("plotId").equals(plotId).toArray();
      list = list.filter(item => item.userId === userId);
    } else {
      list = await db.sprayLogs.where("userId").equals(userId).toArray();
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    console.error("Failed to get spray logs from Dexie:", err);
    return [];
  }
}

export async function saveSprayLog(
  log: Omit<LocalSprayLog, "id" | "createdAt" | "synced"> & { id?: string }
): Promise<LocalSprayLog> {
  const now = new Date().toISOString();
  const id = log.id || `spray-${log.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const record: LocalSprayLog = {
    ...log,
    id,
    createdAt: now,
    synced: false
  };

  await db.sprayLogs.put(record);

  try {
    await db.syncQueue.add({
      userId: log.userId,
      entity: "spray_log",
      action: log.id ? "update" : "create",
      clientId: id,
      payload: record,
      timestamp: now,
      retryCount: 0,
      status: "pending"
    });
  } catch (syncErr) {
    console.warn("Could not enqueue spray log sync item:", syncErr);
  }

  return record;
}

export async function deleteSprayLog(id: string, userId: string): Promise<boolean> {
  try {
    await db.sprayLogs.delete(id);
    await db.syncQueue.add({
      userId,
      entity: "spray_log",
      action: "delete",
      clientId: id,
      payload: { id },
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
    return true;
  } catch (err) {
    console.error("Failed to delete spray log:", err);
    return false;
  }
}

// ─── 3. FARM EXPENSES ────────────────────────────────────────────────────────

export async function getFarmExpenses(userId: string, plotId?: string): Promise<LocalFarmExpense[]> {
  try {
    let list: LocalFarmExpense[];
    if (plotId) {
      list = await db.farmExpenses.where("plotId").equals(plotId).toArray();
      list = list.filter(item => item.userId === userId);
    } else {
      list = await db.farmExpenses.where("userId").equals(userId).toArray();
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    console.error("Failed to get farm expenses from Dexie:", err);
    return [];
  }
}

export async function saveFarmExpense(
  expense: Omit<LocalFarmExpense, "id" | "createdAt" | "synced"> & { id?: string }
): Promise<LocalFarmExpense> {
  const now = new Date().toISOString();
  const id = expense.id || `expense-${expense.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const record: LocalFarmExpense = {
    ...expense,
    id,
    createdAt: now,
    synced: false
  };

  await db.farmExpenses.put(record);

  try {
    await db.syncQueue.add({
      userId: expense.userId,
      entity: "expense",
      action: expense.id ? "update" : "create",
      clientId: id,
      payload: record,
      timestamp: now,
      retryCount: 0,
      status: "pending"
    });
  } catch (syncErr) {
    console.warn("Could not enqueue expense sync item:", syncErr);
  }

  return record;
}

export async function deleteFarmExpense(id: string, userId: string): Promise<boolean> {
  try {
    await db.farmExpenses.delete(id);
    await db.syncQueue.add({
      userId,
      entity: "expense",
      action: "delete",
      clientId: id,
      payload: { id },
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
    return true;
  } catch (err) {
    console.error("Failed to delete farm expense:", err);
    return false;
  }
}

// ─── 4. FARM SUMMARY ─────────────────────────────────────────────────────────

export interface FarmSummary {
  totalPlots: number;
  totalAreaAcres: number;
  activePlotsCount: number;
  totalExpensesRs: number;
  expensesByCategory: Record<string, number>;
  recentSprayCount: number;
  cropsList: string[];
}

export async function getFarmSummary(userId: string): Promise<FarmSummary> {
  const [plots, sprays, expenses] = await Promise.all([
    getPlots(userId),
    getSprayLogs(userId),
    getFarmExpenses(userId)
  ]);

  const totalPlots = plots.length;
  const totalAreaAcres = plots.reduce((acc, p) => acc + (p.areaAcres || 0), 0);
  const activePlots = plots.filter(p => p.status === "ACTIVE");
  const activePlotsCount = activePlots.length;
  const cropsList = Array.from(new Set(plots.map(p => p.currentCrop).filter(Boolean)));

  const totalExpensesRs = expenses.reduce((acc, e) => acc + (e.amountRs || 0), 0);
  const expensesByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amountRs;
  }

  return {
    totalPlots,
    totalAreaAcres: parseFloat(totalAreaAcres.toFixed(2)),
    activePlotsCount,
    totalExpensesRs,
    expensesByCategory,
    recentSprayCount: sprays.length,
    cropsList
  };
}

/**
 * Initializes a default plot if farmer has no plots recorded yet.
 */
export async function initializeDefaultPlotIfEmpty(
  userId: string,
  farmerName: string,
  primaryCrop: string,
  cropVariety: string,
  farmSize: string,
  soilType: string,
  sowingDate?: string
): Promise<LocalPlot[]> {
  const existing = await getPlots(userId);
  if (existing.length > 0) return existing;

  const area = parseFloat(farmSize) || 2.0;
  const defaultPlot = await savePlot({
    userId,
    farmId: `farm-${userId}`,
    name: `${farmerName || "Farm"} - Plot 1`,
    areaAcres: area,
    soilType: soilType || "Clay Loam",
    currentCrop: primaryCrop || "Paddy (Rice)",
    cropVariety: cropVariety || "CO 51",
    sowingDate: sowingDate || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    cropStage: "Vegetative / Tillering",
    status: "ACTIVE"
  });

  return [defaultPlot];
}
