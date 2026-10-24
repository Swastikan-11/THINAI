import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/services/db";
import {
  getPlots,
  savePlot,
  deletePlot,
  getSprayLogs,
  saveSprayLog,
  deleteSprayLog,
  getFarmExpenses,
  saveFarmExpense,
  deleteFarmExpense,
  getFarmSummary,
  getDaysAfterSowing,
  initializeDefaultPlotIfEmpty
} from "../src/services/farmRecordService";

describe("Phase 3 - Feature 5: Farm Records (Plots, Crops, Sowing, Spray Log, Expenses) with Dexie Sync", () => {
  const TEST_USER = "farmer-murugan-001";

  beforeEach(async () => {
    await db.plots.clear();
    await db.sprayLogs.clear();
    await db.farmExpenses.clear();
    await db.syncQueue.clear();
  });

  describe("Helper: getDaysAfterSowing", () => {
    it("should calculate exact days elapsed since sowing", () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const das = getDaysAfterSowing(thirtyDaysAgo);
      expect(das).toBe(30);
    });

    it("should return null for undefined or invalid sowing date", () => {
      expect(getDaysAfterSowing(undefined)).toBeNull();
      expect(getDaysAfterSowing("invalid-date-format")).toBeNull();
    });
  });

  describe("Plots & Crops CRUD", () => {
    it("should initialize default plot from farmer profile when empty", async () => {
      const initial = await initializeDefaultPlotIfEmpty(
        TEST_USER,
        "Murugan Farm",
        "Paddy (Rice)",
        "CO 51",
        "3.5",
        "Clay Loam"
      );

      expect(initial.length).toBe(1);
      expect(initial[0].name).toContain("Murugan Farm - Plot 1");
      expect(initial[0].areaAcres).toBe(3.5);
      expect(initial[0].currentCrop).toBe("Paddy (Rice)");
      expect(initial[0].cropVariety).toBe("CO 51");
      expect(initial[0].status).toBe("ACTIVE");

      // Verify Dexie storage
      const inDb = await db.plots.get(initial[0].id);
      expect(inDb).toBeDefined();

      // Verify syncQueue enqueue
      const queueItems = await db.syncQueue.where("userId").equals(TEST_USER).toArray();
      expect(queueItems.length).toBe(1);
      expect(queueItems[0].entity).toBe("plot");
      expect(queueItems[0].action).toBe("create");
    });

    it("should create, read and delete multiple plots", async () => {
      const plot1 = await savePlot({
        userId: TEST_USER,
        farmId: "farm-1",
        name: "North Paddy Field",
        areaAcres: 2.0,
        soilType: "Clay Loam",
        currentCrop: "Paddy",
        cropVariety: "CR 1009",
        sowingDate: "2026-09-01",
        status: "ACTIVE"
      });

      const plot2 = await savePlot({
        userId: TEST_USER,
        farmId: "farm-1",
        name: "South Tomato Garden",
        areaAcres: 1.5,
        soilType: "Red Soil",
        currentCrop: "Tomato",
        cropVariety: "Shivam F1",
        sowingDate: "2026-09-15",
        status: "ACTIVE"
      });

      const allPlots = await getPlots(TEST_USER);
      expect(allPlots.length).toBe(2);

      // Delete plot1
      const deleted = await deletePlot(plot1.id, TEST_USER);
      expect(deleted).toBe(true);

      const remainingPlots = await getPlots(TEST_USER);
      expect(remainingPlots.length).toBe(1);
      expect(remainingPlots[0].id).toBe(plot2.id);

      // Verify syncQueue logged delete action
      const deleteQueueItem = await db.syncQueue
        .where("entity")
        .equals("plot")
        .and(i => i.action === "delete")
        .first();
      expect(deleteQueueItem).toBeDefined();
      expect(deleteQueueItem?.clientId).toBe(plot1.id);
    });
  });

  describe("Spray Log CRUD", () => {
    it("should log spray application with product, dosage, target and enqueue sync", async () => {
      const spray = await saveSprayLog({
        userId: TEST_USER,
        plotId: "plot-101",
        plotName: "North Paddy Field",
        date: "2026-10-20",
        sprayType: "BIO_INPUT",
        productName: "Neem Oil 1500ppm",
        dosage: "3 ml/L of water",
        targetPestDisease: "Brown Planthopper prevention",
        notes: "Sprayed during calm morning conditions"
      });

      expect(spray.id).toBeDefined();
      expect(spray.productName).toBe("Neem Oil 1500ppm");
      expect(spray.synced).toBe(false);

      const logs = await getSprayLogs(TEST_USER);
      expect(logs.length).toBe(1);
      expect(logs[0].dosage).toBe("3 ml/L of water");

      // Verify syncQueue item
      const syncItem = await db.syncQueue
        .where("entity")
        .equals("spray_log")
        .first();
      expect(syncItem).toBeDefined();
      expect(syncItem?.clientId).toBe(spray.id);
    });

    it("should delete spray log record", async () => {
      const spray = await saveSprayLog({
        userId: TEST_USER,
        plotId: "plot-101",
        plotName: "North Paddy Field",
        date: "2026-10-22",
        sprayType: "FERTILIZER",
        productName: "19-19-19 Foliar",
        dosage: "5g/L",
        targetPestDisease: "Nutrient boost"
      });

      const deleted = await deleteSprayLog(spray.id, TEST_USER);
      expect(deleted).toBe(true);

      const logs = await getSprayLogs(TEST_USER);
      expect(logs.length).toBe(0);
    });
  });

  describe("Farm Expenses Ledger CRUD", () => {
    it("should save and retrieve categorized expenses", async () => {
      await saveFarmExpense({
        userId: TEST_USER,
        plotId: "plot-1",
        plotName: "Paddy Field",
        date: "2026-09-01",
        category: "SEEDS",
        amountRs: 2400,
        description: "CR 1009 Certified Seeds 30kg"
      });

      await saveFarmExpense({
        userId: TEST_USER,
        plotId: "plot-1",
        plotName: "Paddy Field",
        date: "2026-09-10",
        category: "LABOR",
        amountRs: 3500,
        description: "Transplanting labor wages"
      });

      await saveFarmExpense({
        userId: TEST_USER,
        plotId: "plot-1",
        plotName: "Paddy Field",
        date: "2026-09-15",
        category: "FERTILIZER",
        amountRs: 1800,
        description: "DAP & Potash basals"
      });

      const expenses = await getFarmExpenses(TEST_USER);
      expect(expenses.length).toBe(3);

      const total = expenses.reduce((acc, e) => acc + e.amountRs, 0);
      expect(total).toBe(7700);

      // Verify sync queue
      const expenseQueue = await db.syncQueue
        .where("entity")
        .equals("expense")
        .toArray();
      expect(expenseQueue.length).toBe(3);
    });

    it("should delete an expense record", async () => {
      const exp = await saveFarmExpense({
        userId: TEST_USER,
        date: "2026-10-01",
        category: "OTHER",
        amountRs: 500,
        description: "Sprayer pump nozzle replacement"
      });

      const deleted = await deleteFarmExpense(exp.id, TEST_USER);
      expect(deleted).toBe(true);

      const remaining = await getFarmExpenses(TEST_USER);
      expect(remaining.length).toBe(0);
    });
  });

  describe("Farm Summary Analytics", () => {
    it("should aggregate total acreage, active plots, expenditure by category and spray count", async () => {
      // 1. Create 2 plots
      await savePlot({
        userId: TEST_USER,
        farmId: "farm-1",
        name: "Paddy Block",
        areaAcres: 2.5,
        soilType: "Clay",
        currentCrop: "Paddy",
        status: "ACTIVE"
      });
      await savePlot({
        userId: TEST_USER,
        farmId: "farm-1",
        name: "Vegetable Block",
        areaAcres: 1.25,
        soilType: "Loam",
        currentCrop: "Tomato",
        status: "ACTIVE"
      });

      // 2. Add spray log
      await saveSprayLog({
        userId: TEST_USER,
        plotId: "p1",
        plotName: "Paddy Block",
        date: "2026-10-15",
        sprayType: "FUNGICIDE",
        productName: "Pseudomonas",
        dosage: "10g/L"
      });

      // 3. Add expenses across categories
      await saveFarmExpense({
        userId: TEST_USER,
        date: "2026-10-01",
        category: "SEEDS",
        amountRs: 2000,
        description: "Seeds"
      });
      await saveFarmExpense({
        userId: TEST_USER,
        date: "2026-10-05",
        category: "FERTILIZER",
        amountRs: 3000,
        description: "Fertilizer"
      });
      await saveFarmExpense({
        userId: TEST_USER,
        date: "2026-10-10",
        category: "LABOR",
        amountRs: 2500,
        description: "Labor"
      });

      const summary = await getFarmSummary(TEST_USER);

      expect(summary.totalPlots).toBe(2);
      expect(summary.totalAreaAcres).toBe(3.75);
      expect(summary.activePlotsCount).toBe(2);
      expect(summary.totalExpensesRs).toBe(7500);
      expect(summary.expensesByCategory.SEEDS).toBe(2000);
      expect(summary.expensesByCategory.FERTILIZER).toBe(3000);
      expect(summary.expensesByCategory.LABOR).toBe(2500);
      expect(summary.recentSprayCount).toBe(1);
      expect(summary.cropsList).toContain("Paddy");
      expect(summary.cropsList).toContain("Tomato");
    });
  });
});
