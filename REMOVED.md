# THINAI Dead Code, Pruned Routes & Fabricated Data Audit (`REMOVED.md`)

In strict compliance with **Standing Rule 2** (*"Before deleting any file or feature, list it with the reason, and delete only if nothing references it (show the grep)"*) and **Standing Rule 4** (*"No fabricated or dummy data anywhere. Where real data is unavailable, show an honest empty or 'not available' state, never invented values. Remove every 'Demo', 'Sample', 'Lorem', hard-coded fake listing and test-number hint from production builds"*), this document catalogs all features, routes, and data structures permanently removed or gated from production builds.

---

## 1. Dead Routes & Screens Pruned from `Screen` Union Type

| Screen Route Identifier | Reason for Removal | Grep Proof / Reference Verification | Resolution |
| :--- | :--- | :--- | :--- |
| `"reports"` | Prototype placeholder from early concept. No screen renderer, no component, zero navigation targets in entire codebase. | `Select-String -Pattern 'screen === "reports"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. Verified by `tests/dead_routes_pruned.test.ts`. |
| `"settings"` | Unused route. App settings (language, password, account deletion) are natively built inside `ProfileScreen.tsx`. | `Select-String -Pattern 'screen === "settings"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. Verified by `tests/dead_routes_pruned.test.ts`. |
| `"help"` | Unused route. No component or screen renderer exists. Support guidelines provided via Extension Officer AAO registry. | `Select-String -Pattern 'screen === "help"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. Verified by `tests/dead_routes_pruned.test.ts`. |
| `"voice"` | Voice assistant is implemented as a floating overlay modal (`showVoiceModal` / `VoiceAssistantModal`), not an independent full screen route. | `Select-String -Pattern 'screen === "voice"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. Verified by `tests/dead_routes_pruned.test.ts`. |
| `"weather"` | Standalone weather route was never implemented; comprehensive live weather, spray safety advisory, and irrigation rules are rendered directly in `HomeScreen`. | `Select-String -Pattern 'screen === "weather"' src/` returned 0 matches. | Removed from `Screen` type union in `src/app/App.tsx`. Navigation targets correctly direct to `home`. |

---

## 2. Dead Buttons & Broken Handlers Fixed

| Location in Code | Issue Identified | User Impact | Resolution |
| :--- | :--- | :--- | :--- |
| `src/app/App.tsx` (Top Header Bell Button) | `<button onClick={() => navigate("notifications")}>` navigated to undefined screen `"notifications"`. | Clicking the bell icon on the home header produced a blank screen because no component was rendered for `"notifications"`. | Replaced dead navigation with an Agronomic Advisory Notifications modal displaying live weather alerts, spray advisories, irrigation status, and mandi feed health. |

---

## 3. Fabricated Sample Data Pruned

| File Location | Variable / Object | Contents | Standing Rule Violated | Replacement / Honest State |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/components/FarmServicesScreen.tsx` | `DEFAULT_P2P_EQUIPMENT` | Two hardcoded mock equipment listings (`sample-p2p-1`, `sample-p2p-2`) with "Sample Owner / மாதிரி உரிமையாளர்" and "Demo Reference Only". | Standing Rule 4 (Zero "Demo" / "Sample" / fake listings in production builds). | Deleted `DEFAULT_P2P_EQUIPMENT`. Replaced with honest empty state card in the Local Equipment Board when no local farmer has registered implements in the district. |
| `src/app/components/CommunityScreen.tsx` | `DEFAULT_POSTS` | Hardcoded sample posts attributing fake forum entries to "Sample Farmer / மாதிரி விவசாயி". | Standing Rule 4 (No fabricated data anywhere). | Removed `DEFAULT_POSTS`. Screen displays honest empty state with localized encouragement: *"No discussions yet in this district / இந்த மாவட்டத்தில் இன்னும் கலந்துரையாடல்கள் இல்லை"*. Verified by `tests/community_posts_regression.test.ts`. |
| `src/app/components/AuthScreens.tsx` | Test Credentials | Hardcoded test phone number (`9876543210`) and OTP (`123456`) displayed unconditionally. | Standing Rule 4 & 5 (Production credential exposure). | Wrapped behind `import.meta.env.DEV` conditional. In production builds, hints are completely omitted. |
| `ml/evaluate_protocol.py` | Synthetic Results | Hardcoded simulation numbers (89.4%, 84.7%, 12.40%, 9.82%, 1.90%) presented as empirical accuracy. | Standing Rule 4 (Honest results separation). | Renamed to `ml/simulate_protocol.py`, output labeled `SIMULATION`, and all appearances purged from documentation. |
| `src/services/i18n.ts` | Unreviewed Translations | Partially translated strings for Hindi, Telugu, Kannada, Malayalam. | Standing Rule 4 & Localization Quality. | Restricted active dropdown to English and Tamil. Unreviewed translations moved to `UNREVIEWED_LANGUAGES` until verified by native agronomists. |
| Root & Android Build Tree | Stale Local APKs | Unsigned local build binaries (`thinai-debug.apk`, `THINAI-release.apk`, `THINAI.apk`). | Standing Rule 1 & Keystore Governance. | Deleted from disk and git tracking; release binaries restricted to CI-built artifacts. |
