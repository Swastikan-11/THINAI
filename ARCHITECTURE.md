# THINAI Technical Architecture Documentation

## 1. System Overview
**THINAI** (*Technology for Holistic Intelligent Nurturing of Agricultural Intelligence*) is an offline-first, dual-pipeline agricultural decision-support and crop resilience system engineered for smallholder and commercial Indian farmers.

The architecture reconciles three fundamental agricultural constraints:
1. **Intermittent Connectivity:** Real-time decisions must execute on-device in low or zero-connectivity conditions.
2. **Actionable Explainability:** Prescriptions must not be black boxes; farmers need transparent confidence scores and causal justifications.
3. **Resilience under Uncertainty:** Recommendations must withstand rapid agro-climatic shocks (monsoon deficits, heatwaves, farmgate price crashes).

---

## 2. High-Level Architectural Topology

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|                                                                                 |
|  [Capacitor Native Shell (Android)]                                             |
|   +-- React 18 + TypeScript + Vite + Tailwind CSS                               |
|   +-- Multilingual Voice Assistant (Web Speech STT + Indic TTS, 6 Languages)    |
|   +-- What-If Simulation Lab & ARFI Explainability Drawer                       |
|   +-- Real Firebase Authentication (Email/Password, Google OAuth, Phone OTP)    |
|   +-- Local Persistence: Dexie.js (IndexedDB scoped by Firebase UID)            |
|   +-- Offline Synchronization Manager (Idempotent replay queue + reachability)  |
+---------------------------------------+-----------------------------------------+
                                        |
                         HTTPS REST / JSON (JWT Auth)
                                        |
+---------------------------------------v-----------------------------------------+
|                                BACKEND TIER                                     |
|                                                                                 |
|  [FastAPI 0.110 Async Application]                                              |
|   +-- Core Security Middleware (Firebase Token Verification + Role Claims)       |
|   +-- REST Routers: /auth, /farms, /fields, /recommendations, /what-if,         |
|                     /weather, /market, /schemes, /economics, /disease,          |
|                     /activities, /feedback, /sync                               |
|                                                                                 |
|  [ML Decision Engine & ARFI Core]                                               |
|   +-- Crop ML Ensemble: Random Forest (88.7%) & Gradient Boosting (86.2%)       |
|   +-- ARFI 6-Component Evaluator & 6-Scenario Stress Testing Matrix             |
|   +-- Real Crop Disease Inference Pipeline & Stage-Specific Rules Engine        |
|                                                                                 |
|  [Data & External Integration Layer]                                            |
|   +-- Relational Database: SQLite (Local) / PostgreSQL 15 (Production Docker)    |
|   +-- SQLAlchemy 2.0 ORM with Foreign Key Isolation and Timestamps              |
|   +-- External APIs: Open-Meteo Weather API, Agmarknet Mandi Price Feed         |
+---------------------------------------------------------------------------------+
```

---

## 3. Data Flow & Synchronization Lifecycle

### A. Offline-First Mutability & Queueing
1. When a farmer logs an activity, records feedback, or modifies a plot offline:
   - Record is written immediately to **Dexie.js IndexedDB** with `synced: false` and `pendingSync: true`.
   - A mutation item is inserted into the `syncQueue` table:
     $$\text{Mutation} = \{\text{id}, \text{userId}, \text{entity}, \text{action}, \text{clientId}, \text{payload}, \text{timestamp}, \text{retryCount}\}$$
   - The UI updates optimistically with instantaneous zero-latency responsiveness.

### B. Two-Way Delta Synchronization
2. Upon network reconnection (detected via active HTTP ping reachability to `/health`):
   - **Push Phase:** `syncManager.triggerSync()` flushes queued mutations in chronological sequence to `POST /api/v1/sync/push`.
   - **Idempotency Protection:** The backend inspects `clientId` and `updated_at`. If duplicate mutations arrive, the engine guarantees idempotency without corrupting state.
   - **Pull Phase:** The client invokes `POST /api/v1/sync/pull` passing `last_sync_timestamp`. The server streams delta records modified by other sessions, seamlessly updating IndexedDB.

---

## 4. Multi-Tenant Farm & Plot Hierarchy
All persistent records strictly adhere to user isolation:

$$\text{User (Firebase UID)} \longrightarrow \text{Farms} \longrightarrow \text{Fields/Plots} \longrightarrow \begin{cases} \text{Recommendations \& ARFI} \\ \text{Farm Diary Activities} \\ \text{Action Feedback Logs} \\ \text{Disease Scans} \end{cases}$$

Every database query in FastAPI injects `current_user_claims["uid"]`, ensuring strict data boundary isolation between farming entities.
