# THINAI Security, Privacy & Legal Due Diligence

**Document Target**: Secrets Audit, Vulnerability Scans, DPDP Act Measures & Licensing Manifest  
**Context**: Evaluated on commit `cde89aa` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `firestore.rules`, `THIRD_PARTY_LICENSES.md`, `DATASETS.md`, `docs/DATASET_DUE_DILIGENCE.md`  

---

## 1. Secrets & Keystore Security History

### 1.1 Historical Incident & Remediation
* **Historical Vulnerability**: In commit `d774219`, a debug/staging Android keystore file (`android/thinai-release.keystore`) was inadvertently committed to git history with plaintext password references in `build.gradle`.
* **Action Taken**:
  1. The compromised key was purged from HEAD.
  2. The key was permanently retired; verified that it was never used to sign any distributed production artifact.
  3. A new production release keystore was generated locally by project owner SWASTIKAN C (`CN=THINAI Production Release`, SHA-256 fingerprint: `5a5b2ea2cbe3e4ab7c6dff0267b3e2b78115836419c367965915fcb50a201cc4`).
  4. The production keystore binary was stored securely offline at `C:\Users\cswas\.thinai_keys\thinai-prod-release.keystore` and encoded as base64 into GitHub Actions repository secret `ANDROID_KEYSTORE_BASE64`.
  5. Keystore passwords were encrypted into GitHub Secrets (`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).

### 1.2 Current Exposure Audit (Gitleaks Scan)
Executed `gitleaks detect --no-git` across the repository root (scanned $570.18\text{ MB}$):
* **Committed Git History**: Zero `.env` files or private keys exist in git history (`git log --all --full-history -- "**.env*"` returns 0 results).
* **Local Working Directory**: 16 pattern matches detected in untracked/ignored local files:
  * `.env` and `.env.local` (git-ignored): Contain Firebase web client identifiers.
  * `src/firebase.ts`: Contains public Firebase web configuration (`apiKey`, `authDomain`, `projectId`, `appId`).
  * `dist/` and `android/app/build/`: Bundled web JavaScript assets containing the public Firebase config.
  * `dist-electron/win-unpacked/resources/app.asar`: Bundled Electron desktop archive.
* **Risk Evaluation**: In Google Firebase's security model, web client API keys identify the Firebase project and are designed to be client-visible. Security is enforced by **Cloud Firestore Security Rules** and Google Cloud Console API domain restrictions, not by keeping the client API key hidden.

---

## 2. npm Dependency Vulnerability Audit (`npm audit`)

Command: `npm audit --json`  
Total Dependencies Scanned: 2,706 modules.  
Vulnerabilities Found: 22 total (0 Critical, 7 High, 15 Moderate, 0 Low).

### High-Severity Vulnerabilities & Advisory IDs

| Package Name | Severity | Title / Nature of Advisory | Advisory ID / URL | Dependency Path |
| :--- | :---: | :--- | :--- | :--- |
| `@grpc/grpc-js` | **High** | In certain configurations, `getAuthContext` can return unauthorized certificates | [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) | `firebase -> @firebase/firestore -> @grpc/grpc-js` |
| `react-router` | **High** | Vendored turbo-stream allows arbitrary constructor invocation via TYPE_ERROR deserialization | [GHSA-49rj-9fvp-4h2h](https://github.com/advisories/GHSA-49rj-9fvp-4h2h) | Direct dependency |
| `react-router` | **High** | Unbounded path expansion DoS in `__manifest` endpoint | [GHSA-8x6r-g9mw-2r78](https://github.com/advisories/GHSA-8x6r-g9mw-2r78) | Direct dependency |
| `react-router` | **High** | Reflected user input DoS in single-fetch | [GHSA-rxv8-25v2-qmq8](https://github.com/advisories/GHSA-rxv8-25v2-qmq8) | Direct dependency |
| `react-router` | **High** | CSRF bypass allows action execution before 400 response | [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) | Direct dependency |
| `vite` | **High** | Arbitrary file read via Vite Dev Server WebSocket | [GHSA-p9ff-h696-f583](https://github.com/advisories/GHSA-p9ff-h696-f583) | Dev dependency (`vite@6.3.5`) |
| `vite` | **High** | `launch-editor` `fs.existsSync()` existence check bypass on Windows | [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | Dev dependency (`launch-editor`) |

* **Impact Analysis**: The `vite` dev server vulnerabilities affect local development environments only and do not impact the compiled static bundle. The `react-router` advisories relate to SSR/RSC and single-fetch server features; THINAI runs as a purely client-side SPA (`react-router-dom` in hash/browser mode). The `@grpc/grpc-js` advisory resides inside the Firebase client SDK and requires a patch release of `@firebase/firestore`.

---

## 3. Authentication & Cloud Quota Management

* **Authentication Methods**: Firebase Authentication supporting Email/Password and Google OAuth.
* **SMS Authentication Policy**: Disabled for production pilot due to Firebase Spark free tier limitations (capped at 10 SMS verification messages per day). The UI advises farmers: *"SMS quota reached. Please sign in using Email or Google OAuth."*
* **Role-Based Access Control (RBAC)**:
  * Extension officers are identified by their `uid` existing in the `/officers` collection in Firestore.
  * Direct writes to `/officers` are permanently denied from all client SDKs (`allow write: if false;`). Officers can only be enrolled by administrators via the Firebase Admin Console.

---

## 4. Privacy, Data Retention & DPDP Act Measures

> [!NOTE]
> The measures below represent engineering safeguards implemented in code to support data minimization and user agency under the principles of the **Digital Personal Data Protection Act, 2023 (DPDP Act)**. They do NOT constitute a formal legal compliance certification.

1. **Unbundled Consent Checkboxes**:
   * Registration requires explicit, separate consent for: (a) Agronomic decision processing, (b) Leaf photography upload, and (c) Telephone contact sharing for equipment rental.
2. **Personal Data Collected & Storage Locations**:
   * **Phone Number**: Optional. Stored in `/profiles/{uid}` and IndexedDB. Shared in `/equipment_listings` ONLY when `phoneConsent == true`.
   * **Farm Geolocation**: GPS coordinates stored in local IndexedDB. Sent to Open-Meteo for weather lookup; coordinates are truncated to 2 decimal places ($\approx 1.1\text{ km}$ precision) before storage to prevent precise smallholder landholding de-anonymization.
   * **Leaf Photographs**: Compressed client-side to $\le 300\times 300$ pixels JPEG ($\le 45\text{ KB}$ binary / $\le 60\text{ KB}$ base64 string). Raw full-resolution photos remain on the farmer's device and are NEVER transmitted to cloud storage.
3. **Right to Erasure ("Delete All My Data")**:
   * `src/app/App.tsx (ProfileScreen component)` provides a prominent "Delete All My Data" button.
   * Execution triggers `authService.deleteAccount()`, which:
     1. Calls `dexieDb.delete()` to wipe all local IndexedDB tables (`profiles`, `diagnoses`, `plots`, `crops`, `expenses`, `syncQueue`).
     2. Deletes the farmer's Firestore document at `/profiles/{uid}`.
     3. Calls `user.delete()` on Firebase Auth to invalidate credentials.

---

## 5. Dataset Licenses & Provenance Due Diligence

Audited from `DATASETS.md` and `data/crop_registry.json`:

| Dataset Name | Authors & Year | License | Commercial Reuse Permitted? | Attribution Required? | Used In THINAI For |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PlantVillage** | Hughes & Salathé (2015) | CC BY-SA 4.0 | YES | YES | Base MobileNetV2 laboratory training (54,306 images) |
| **PlantDoc** | Singh et al. (2020) | CC BY 4.0 | YES | YES | Held-out empirical field evaluation ($N=125$ images) |
| **Paddy Doctor** | Selvaraj et al. (2022) | CC BY 4.0 | YES | YES | Paddy disease classification crop pack (10,407 images) |
| **Sugarcane Leaf Dataset**| Mendeley Data (2021) | CC BY 4.0 | YES | YES | Sugarcane Status B crop pack (2,569 images) |
| **Groundnut Leaf Pathology**| Mendeley Data (2022) | CC BY 4.0 | YES | YES | Groundnut Status B crop pack (10,560 images) |

---

## 6. Third-Party Software Licenses (`THIRD_PARTY_LICENSES.md`)

| Component | Upstream Author / Project | License Type | License Notice & Restrictions |
| :--- | :--- | :--- | :--- |
| **React** | Meta Platforms, Inc. | MIT | Permissive; attribution preserved |
| **Vite** | Yuxi (Evan) You & Vite Contributors | MIT | Permissive; build tool |
| **LiteRT.js** | Google LLC | Apache-2.0 | Permissive; patent grant included |
| **Dexie.js** | David Fahlander | Apache-2.0 | Permissive; offline storage |
| **Capacitor** | Ionic / Drifty Co. | MIT | Permissive; Android bridge |
| **Tailwind CSS** | Tailwind Labs, Inc. | MIT | Permissive; styling engine |
| **Lucide Icons** | Lucide Contributors | ISC / MIT | Permissive; iconography |
| **Electron** | OpenJS Foundation | MIT | Permissive; desktop wrapper |
| **Noto Fonts** | Google LLC | SIL OFL 1.1 | Free distribution with software; font sale prohibited |

