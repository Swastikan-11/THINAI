# THINAI Dead Routes, Buttons & Fabricated Data Audit (Phase 3 Feature 6)

In compliance with **Standing Rule 2** ("Before deleting any file or feature, list it with the reason, and delete only if nothing references it (show the grep)") and **Standing Rule 4** ("No fabricated or dummy data anywhere. Where real data is unavailable, show an honest empty or 'not available' state, never invented values. Remove every 'Demo', 'Sample', 'Lorem', hard-coded fake listing and test-number hint from production builds"), this document catalogs every pruned dead route, dead button, and fabricated data structure.

---

## 1. Dead Screens & Routes in `Screen` Union Type

| Screen Route Identifier | Reason for Removal | Grep Proof / Reference Verification | Resolution |
| :--- | :--- | :--- | :--- |
| `"reports"` | Prototype placeholder from early concept. No screen renderer, no component, zero navigation targets in entire codebase. | `Select-String -Pattern 'screen === "reports"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. |
| `"settings"` | Unused route. App settings (language, password, account deletion) are natively built inside `ProfileScreen.tsx`. | `Select-String -Pattern 'screen === "settings"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. |
| `"help"` | Unused route. No component or screen renderer exists. Support guidelines provided via Extension Officer AAO registry. | `Select-String -Pattern 'screen === "help"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. |
| `"voice"` | Voice assistant is implemented as a floating overlay modal (`showVoiceModal` / `VoiceAssistantModal`), not an independent full screen route. | `Select-String -Pattern 'screen === "voice"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. |
| `"weather"` | Standalone weather route was never implemented; comprehensive live weather, spray safety advisory, and irrigation rules are rendered directly in `HomeScreen`. | `Select-String -Pattern 'screen === "weather"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. Navigation targets correctly direct to `home`. |

---

## 2. Dead Buttons Fixed

| Location in Code | Issue Identified | User Impact | Resolution |
| :--- | :--- | :--- | :--- |
| `src/app/App.tsx` (Top Nav Header Bell Icon) | `<button onClick={() => navigate("notifications")}>` navigated to undefined screen `"notifications"`. | Clicking the bell icon on the home header produced a blank screen because no component was rendered for `"notifications"`. | Replaced dead navigation with an Agronomic Advisory Notifications modal displaying live weather alerts, spray advisories, irrigation status, and mandi feed health. |

---

## 3. Fabricated Sample Data Pruned

| File Location | Variable / Object | Contents | Standing Rule Violated | Replacement / Honest State |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/components/FarmServicesScreen.tsx` | `DEFAULT_P2P_EQUIPMENT` | Two hardcoded mock equipment listings (`sample-p2p-1`, `sample-p2p-2`) with "Sample Owner / மாதிரி உரிமையாளர்" and "Demo Reference Only". | Standing Rule 4 (Zero "Demo" / "Sample" / fake listings in production builds). | Deleted `DEFAULT_P2P_EQUIPMENT`. Replaced with honest empty state card in the Local Equipment Board when no local farmer has registered implements in the district. |

---

## 4. Verification Check
- TypeScript compilation: `npx tsc --noEmit` exits with 0 errors.
- Unit test suite: `npx vitest run` passes across all test suites.
- End-to-end suite: `npx playwright test` captures clean mobile layouts at 360x800.
