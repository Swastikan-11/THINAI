# THINAI Field Pilot Protocol & Evaluation Preregistration (`PILOT_PROTOCOL.md`)
**Protocol Version**: 1.0.0-PREREGISTERED  
**Date of Preregistration**: October 18, 2026  
**Commit SHA**: `a804fea1d6e5c9bceb819fbc79a785d681df7097`  
**Target Agronomic Tract**: Western & Cauvery Delta Agro-Climatic Zones of Tamil Nadu  
**Principal Investigators / Project Lead**: THINAI Agronomic AI Research Team  
**Institutional Ethics / DPDP Compliance Note**: The lead student / project owner must confirm research ethics approval and institutional data governance clearance with their academic institution (e.g. college research committee) prior to participant recruitment. This document provides technical and protocol safeguards and does not constitute formal legal counsel.

---

## 1. Pilot Cohort & Sampling Plan

### 1.1 Target Sample Size & Farming Profile
* **Target Cohort**: 60 to 90 smallholder farmers (operational landholdings between 1.0 and 5.0 acres).
* **Target Agrarian Districts in Tamil Nadu**:
  1. **Coimbatore District** (Thondamuthur & Pollachi blocks): Vegetable cluster (Tomato, Chilli/Pepper).
  2. **Dindigul District** (Oddanchatram & Kodaikanal foothills): Vegetable market belt (Tomato, Potato).
  3. **Thanjavur District** (Kumbakonam & Thiruvaiyaru blocks): Delta paddy tract (Paddy monitored strictly in Tier 3 expert referral).
* **Monitored Crops**:
  - **Calibrated Vision Crops (Tier 1 & Tier 2 Active)**: Tomato, Potato, Pepper Bell.
  - **Expert Referral Crops (Tier 3 Only)**: Paddy (Rice), Cotton, Maize.

### 1.2 What is Measured (Primary & Secondary Endpoints)
1. **Primary Diagnostic Safety Endpoint**:
   - **Harmful Advice Rate (HAR)**: The proportion of total diagnoses where chemical pesticide recommendations are emitted for an incorrect disease class.
   - **Pre-registered Success Threshold**: $\text{HAR} \le 2.10\%$ under Tier 1 gating.
2. **Secondary Agronomic Endpoints**:
   - **Verdict Concordance**: Agreement rate between crowdsourced farmer Yes/No verdicts and independent dual-agronomist ground truth.
   - **Selective Coverage**: Percentage of farmer leaf scans meeting Tier 1 ($\ge \tau_{\text{high}}$) vs Tier 2 vs Tier 3.
   - **Spray Advisory Adherence**: Farmer compliance with wash-off and spray drift alerts (preventing chemical spraying when rain $\ge 40\%$).
   - **Offline Utility**: Fraction of scans and queries executed offline in cellular dead zones and subsequently synced via Dexie FIFO queue.

---

## 2. Threshold Architecture & Governance Separation

To prevent conflating normative deployment criteria with model-specific empirical tuning, thresholds in THINAI are strictly partitioned into two independent tiers:

### 2.1 Acceptance Thresholds (OWNER-GOVERNED ACCEPTANCE CRITERIA)

> [!IMPORTANT]
> **GOVERNANCE STATUS: PENDING OWNER SPECIFICATION (TEMPLATE)**
> These are the minimum statistical quality criteria that the project owner and agronomic advisors require before any crop model is promoted to active field service. These thresholds are defined normatively by the owner—NOT by the agent or model.
>
> Fill out and commit these thresholds prior to initiating field deployment:

| Criterion | Metric / Mathematical Definition | Owner-Approved Value | Rationale & Regulatory Minimum | Sign-off Status |
|---|:---:|:---:|---|:---:|
| **Minimum Overall Field Accuracy** | $\text{Acc}_{\text{overall}} \ge X\%$ | `[ OWNER TO FILL: e.g. 70% ]` | Field viability floor | `PENDING_OWNER_SIGN_OFF` |
| **Minimum Per-Crop Accuracy** | $\min_{c \in \text{Crops}} \text{Acc}_c \ge X\%$ | `[ OWNER TO FILL: e.g. 60% ]` | Prevents uneven crop performance | `PENDING_OWNER_SIGN_OFF` |
| **Wilson 95% Score Lower Bound** | $W_{\text{lower}}(\text{Acc}) \ge X\%$ | `[ OWNER TO FILL: e.g. 55% ]` | Conservative finite-sample floor | `PENDING_OWNER_SIGN_OFF` |
| **Maximum Permissible Field ECE** | $\text{ECE}_{\text{field}} \le X\%$ | `[ OWNER TO FILL: e.g. 15% ]` | Maximum allowed confidence distortion | `PENDING_OWNER_SIGN_OFF` |
| **Minimum Labelled Field Images** | $N_{\text{eval}} \ge X$ images/crop | `[ OWNER TO FILL: e.g. 50 ]` | Statistical sample size requirement | `PENDING_OWNER_SIGN_OFF` |
| **Per-Class Sensitivity Floor** | $\min_{k} \text{Recall}_k \ge X\%$ | `[ OWNER TO FILL: e.g. 40% ]` | Avoids zero-detection blindspots | `PENDING_OWNER_SIGN_OFF` |
| **Maximum Permissible Harmful Advice Rate** | $\text{HAR}_{\max} \le X\%$ | `[ OWNER TO FILL: e.g. 2.0% ]` | Agronomic safety ceiling for Tier 1 | `PENDING_OWNER_SIGN_OFF` |

---

### 2.2 Operational Gating Cut-offs (EMPIRICAL STATISTICAL TUNING)

> [!WARNING]
> **GOVERNANCE STATUS: TECHNICAL RE-ESTIMATION REQUIRED (CURRENT FIELD ECE = 40.49%)**
> The operational cut-offs below ($\tau_{\text{high}}, \tau_{\text{low}}, T^*$) govern the runtime 3-tier routing:
> - $\tau_{\text{high}}$: High-confidence threshold for Tier 1 (chemical treatments unlocked).
> - $\tau_{\text{low}}$: Moderate-confidence floor for Tier 2 (cultural/organic remedies only; chemical sprays withheld).
> - Below $\tau_{\text{low}}$: Routed strictly to Tier 3 (inconclusive; expert referral only).
>
> **Mandatory Invariant**: The repository owner must NOT be asked to approve these cut-offs while empirical field calibration error remains at 40.49%. These cut-offs were fitted on laboratory PlantVillage data ($T^* = 1.28$). Under genuine field domain shift, they must be mathematically refitted on an independent, held-out field calibration split that is strictly disjoint from the 125 field evaluation images. Until such refitting occurs on held-out field data, Tier 1 chemical recommendations remain disabled by default in production.

| Operational Parameter | Symbol | Laboratory Provisional Value | Status on Field Data | Technical Requirement for Freezing |
|---|:---:|:---:|---|---|
| **Temperature Scaling Parameter** | $T^*$ | $1.28$ | **UNALIGNED** (ECE = 40.49%) | Fit NLL minimization on held-out field calibration split ($N \ge 150$) |
| **Tier 1 Selective High Cut-off** | $\tau_{\text{high}}$ | $0.78$ | **PROVISIONAL** | Derive from empirical field risk-coverage curve targeting $\text{HAR} \le \text{HAR}_{\max}$ |
| **Tier 2 Selective Moderate Cut-off** | $\tau_{\text{low}}$ | $0.45$ | **PROVISIONAL** | Boundary ensuring Tier 3 captures unconfident and out-of-domain scans |
| **Minimum Sample Guard for Wilson Interval** | $N_{\min}$ | $10$ | **ACTIVE** | Prevents displaying uncalibrated percentage estimates for small cohorts |

---

## 3. Strict Pilot Stop Rules (Safety Tripwires)

Smallholder livelihood and environmental safety take absolute precedence over data collection:

1. **Immediate Pilot Pause Rule (Harmful Advice Tripwire)**:
   - If an extension officer or participating farmer reports a **confirmed severe diagnostic error** where a chemical spray was applied based on a false Tier 1 diagnosis, the entire diagnostic advisory module is immediately paused.
   - The app automatically rolls back all Tier 1 chemical outputs to Tier 2 (cultural advice only) until root-cause analysis is completed.
2. **Cluster Outbreak Misclassification Rule**:
   - If $\ge 3$ consecutive misdiagnoses of a quarantined or high-impact pathogen (e.g. Late Blight misclassified as Early Blight) occur in the same block within 48 hours, automated vision diagnosis for that crop is suspended in that block.
3. **Data Loss / Sync Failure Tripwire**:
   - If unhandled IndexedDB storage corruption or sync loss affects $> 5\%$ of recorded pilot entries, mutation queuing is halted until the client Dexie database is verified.

---

## 4. Consent, Privacy & DPDP Act 2023 Compliance

### 4.1 Notice and Consent Framework
In accordance with India's **Digital Personal Data Protection Act, 2023 (DPDP Act)**:
1. **Bilingual Consent Screen**: Every participant is presented with a clear, unbundled consent agreement in native Tamil (*ஒப்புதல் படிவம்*) and English prior to account creation or first diagnosis.
2. **Explicit Data Items Collected**:
   - **Phone Number**: Optional; used solely for account authentication and PACS equipment sharing. Phone numbers are hidden from other farmers and extension officers unless the farmer explicitly checks the affirmative consent box (`consent: true`).
   - **Leaf Specimen Photos**: Compressed thumbnails ($\le 50\text{ KB}$) uploaded solely for agronomic diagnosis verification by designated extension officers.
   - **Geographic Coordinates (GPS)**: Block-level coordinates (truncated to 2 decimal places, $\approx 1.1\text{ km}$ resolution) used solely to query local Open-Meteo weather grids. Exact farm homestead coordinates are never published.
   - **Diagnostic Feedback Verdicts**: Farmer Yes/No feedback recorded as weak calibration tripwires.
3. **Storage & Retention Period**:
   - Diagnostic records and compressed thumbnails are stored in Firebase Firestore (Frankfurt/Mumbai region) for a maximum period of **6 months** post-pilot completion.
4. **Farmer Right to Erasure / Revocation**:
   - Farmers may withdraw consent or request complete deletion of their profile, uploaded photos, and diagnostic logs at any time via the in-app *"சுயவிவரம் / Profile $\rightarrow$ Delete Account & Data"* button.

---

## 5. Agronomist Remedy Sign-Off Registry

Under no circumstances may a synthetic chemical recommendation enter Tier 1 without documented agronomist sign-off. Until signed, all remedies remain **UNVERIFIED**:

| Disease Class | Approved Chemical Formulation | Prescribed Dosage | Signing Agronomist / Expert | Date of Review | Verification Status | Authoritative Reference Document |
|---|---|---|---|:---:|:---:|---|
| **Tomato Early Blight** | Mancozeb 75% WP or Chlorothalonil 75% WP | $2.0\text{ g/L}$ water | *(Pending Sign-Off)* | *(Pending)* | **UNVERIFIED** | TNAU Agritech Portal: Tomato Crop Protection |
| **Potato Early Blight** | Mancozeb 75% WP | $2.0\text{ g/L}$ water | *(Pending Sign-Off)* | *(Pending)* | **UNVERIFIED** | TNAU Crop Production Guide (Horticulture) |
| **Tomato Late Blight** | Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) | $2.5\text{ g/L}$ water | *(Pending Sign-Off)* | *(Pending)* | **UNVERIFIED** | TNAU Agritech Portal: Vegetables; CIBRC |
| **Potato Late Blight** | Metalaxyl 8% + Mancozeb 64% WP | $2.5\text{ g/L}$ water | *(Pending Sign-Off)* | *(Pending)* | **UNVERIFIED** | TNAU CPPC Potato Late Blight Guide |
| **Bacterial Leaf Spot (Chilli & Tomato)** | Copper Oxychloride 50% WP + Streptocycline | $2.5\text{ g/L} + 0.1\text{ g/L}$ (100 ppm) | *(Pending Sign-Off)* | *(Pending)* | **UNVERIFIED** | TNAU Crop Protection Guide; ICAR-IIHR Bulletin |
| **All Other Classes** | *Chemicals Withheld* | N/A | Extension Safety Board | *(Pending)* | **SAFE / WITHHELD** | Zero unverified chemical molecules permitted |

---

## 6. Zero-Cost Distribution & Sign-In Architecture

### 6.1 Distribution Channels (Free Tiers Only)
* **Google Play Store Policy**: A paid Google Play Console developer account ($25 USD) is out of scope under zero-cost guidelines.
* **Pilot Distribution Method 1 (Native Android APK)**: Distributed via **Firebase App Distribution** directly to pre-registered tester email addresses. Testers install the cryptographically signed release APK (`THINAI-app-release-apk`).
* **Pilot Distribution Method 2 (Progressive Web App)**: Hosted on **Firebase Hosting** with full Service Worker precaching. Farmers can install the app directly to their Android home screen via the native browser "Install App" prompt.
* **Prohibition on Premature Publication**: Distribution links will not be published publicly. Only the repository owner initiates pilot distribution when field preparations are complete.

### 6.2 Zero-Cost Pilot Authentication
To navigate Firebase Spark's 10 SMS/day limit without incurring cloud costs:
1. **Primary Pilot Sign-In**: Email/Password and Google OAuth.
2. **Phone Number Testing**: Pre-configured test phone numbers registered privately in the Firebase Console for developer testing.
3. **Daily SMS Exceeded Warning**: If a user attempts real SMS verification and the daily Spark quota is exhausted, the UI displays a clear bilingual message:
   *"SMS OTP quota reached for today. Please sign in with Email, Google, or use the pre-configured pilot test number."*

---

## 7. Extension-Officer Dashboard & Cloud Cost Containment

### 7.1 Architecture Without Cloud Functions
Because Firebase Cloud Functions requires the paid Blaze plan, role-based access control is implemented directly within Firestore Security Rules:
* An `officers` collection exists in Firestore where each document ID corresponds to the extension officer's Firebase Auth `uid`.
* Only the project owner edits this collection directly via the Firebase Console (`allow write: if false;`).
* Extension officers have read access to farmers' diagnoses and can create records in `expert_labels`.

### 7.2 Read-Cost Containment (Staying Within 50,000 Reads/Day)
* Unbounded queries and real-time listeners across the entire database are strictly prohibited.
* The dashboard uses `query(collection(firestoreDb, "diagnoses"), orderBy("timestamp", "desc"), limit(25))`.
* **Pilot Read-Cost Projection**:
  - 5 extension officers checking the dashboard 4 times daily.
  - Each check loads 1 page of 25 diagnoses = 100 reads per officer per day.
  - Total daily dashboard reads = $5 \times 100 = 500\text{ reads/day}$ ($\approx 1.0\%$ of the free 50,000 daily Spark limit).

### 7.3 Photo Storage Containment (Staying Within 1 GiB Free Firestore Quota)
* Full-resolution camera photos (2–5 MB each) are never uploaded to Cloud Storage (which has bandwidth download limits).
* The client compresses the diagnosed leaf image to a maximum dimension of $300 \times 300$ pixels (JPEG quality 0.6), producing a base64 thumbnail of $\approx 15\text{ to }30\text{ KB}$.
* Firestore security rules enforce `thumbnailBase64.size() <= 65536` (64 KB cap) and require `photoConsent == true`.
* **Storage Projection for 1,000 Diagnoses**:
  $$1,000\text{ records} \times 30\text{ KB} = 30\text{ MB} \quad (\approx 2.9\%\text{ of the 1 GiB free tier}).$$
