# THINAI Strategic Engineering & Research Roadmap

**Document Target**: Structured Technical Roadmap & Phased Execution Plan  
**Context**: Evaluated on commit `861aaca` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `BUGS.md`, `PILOT_PROTOCOL.md`, `docs/GATE_CHANGE_PROPOSAL.md`, `docs/MODEL_IMPROVEMENT_PLAN.md`  

---

## 1. Section A: Upcoming Updates (Next 1–4 Weeks)

Immediate engineering tasks focused on fixing open defects, restoring clean compilation, and satisfying pilot governance:

| Item ID | Task Description | Governance Label | Effort | Risk Level | Upstream Dependency | Targeted Gate / Metric |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| **A-1** | **Restore Clean Working Tree & Fix TypeScript Compilation**<br>Preserve uncommitted WIP modifications on branch `wip/auth-app-edits` (commit `b0e4cf2`) and restore `main` to green. Completed: 0 errors on `tsc`, 137/137 tests pass. | **COMPLETED** | **S** | Low | None | **G1, G2 (PASS)** |
| **A-2** | **Project Owner Pilot Threshold Sign-Off**<br>Owner reviews ROC risk-coverage curves in `PILOT_PROTOCOL.md` and formally approves $\tau_{\text{high}} = 0.78$ and $\tau_{\text{low}} = 0.45$ in a dedicated commit. | **DEPENDS ON OWNER** | **S** | High | Project Owner decision | **G10** |
| **A-3** | **Formal Sign-Off on Gate Change Proposal**<br>Formally accept or reject Extended Dimensions G11 (Desktop), G12 (Multilingual), and G13 (Crop Registry) in `docs/GATE_CHANGE_PROPOSAL.md`. | **DEPENDS ON OWNER** | **S** | Low | Project Owner decision | Gate Governance |
| **A-4** | **Physical Android Hardware Execution & ADB Logcat Capture**<br>Install `docs/ci_release_apk/app-release.apk` on a physical smartphone (API 24–34), run 12 functional flows, and commit ADB logcat to `evidence/hardware_logcat_physical.txt`. | **DEPENDS ON OWNER** | **M** | Medium | Physical Android device & USB cable | **G7 (Real Phone)** |
| **A-5** | **Field Calibration Re-Estimation (Temperature Scaling on Field Data)**<br>Execute `scripts/field_calibration_analysis.mjs` on 125 PlantDoc field photos to fit an empirical field temperature $T_{\text{field}}^*$ rather than relying on lab $T^*=1.28$. | **COMMITTED** | **S** | Medium | `e2e/field_evaluation.spec.ts` | **G4 (ECE metric)** |
| **A-6** | **Agronomist Review of Tamil Translation (`locales/ta.json`)**<br>Coordinate with a native Tamil agronomist to review 125 translation keys and transition Tamil status from `MACHINE-DRAFT` to `REVIEWED` in `locales/status.json`. | **DEPENDS ON OWNER** | **M** | Medium | Qualified Tamil Agronomist | **G12 / Remedy Safety** |
| **A-7** | **Release Tag & Evidence Resealing**<br>Once G10 and physical device tests pass, update `evidence/*.json` with the new clean HEAD SHA and execute `verify_gates.mjs` to achieve verified READY status. | **COMMITTED** | **S** | Low | Resolution of A-1 and A-2 | **All Gates** |

---

## 2. Section B: Near-Term Upgrades (1–3 Months)

Substantial system enhancements focused on neural accuracy improvement, crop pack expansion, and pilot monitoring:

| Item ID | Task Description | Governance Label | Effort | Risk Level | Upstream Dependency | Targeted Metric / Gate |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| **B-1** | **Field-Centric Model Fine-Tuning (PlantDoc + Paddy Doctor)**<br>Fine-tune MobileNetV2 on combined real-world Indian agricultural datasets with heavy background augmentation (soil, weed, shadow cutouts) to lift field accuracy from 25.6% to $\ge 65\%$. | **PROPOSED** | **L** | High | GPU compute instance; PyTorch/TensorFlow pipeline (`docs/MODEL_IMPROVEMENT_PLAN.md`) | **G4 (Field Accuracy)** |
| **B-2** | **Promotion of Paddy from Status B to Status A via Modular Pack**<br>Integrate the Paddy Doctor model pack (10,407 Tirunelveli field images) into `litertInferenceService.ts`, enabling verified on-device paddy blast and blight detection. | **COMMITTED** | **M** | Medium | Crop pack SHA verification (`cropPackService.ts`) | **G13 (Paddy Coverage)** |
| **B-3** | **Assistant Agricultural Officer (AAO) Ground-Truth Labeling Pipeline**<br>Deploy the Firestore `/expert_labels` collection to 5 field officers in Coimbatore district to label live farmer inconclusive scans. | **COMMITTED** | **M** | Medium | Pilot cohort onboarding (`PILOT_PROTOCOL.md`) | **G10 (Field Pilot)** |
| **B-4** | **Offline Voice Synthesis & Speech Recognition via Local Engine**<br>Replace flaky Web Speech API with an offline lightweight speech recognition engine (e.g., Vosk-WASM or Whisper-Tiny ONNX) for reliable Tamil/Hindi voice commands. | **PROPOSED** | **L** | Medium | WASM memory footprint budget ($< 25\text{ MB}$) | Accessibility / Voice |
| **B-5** | **Privacy-Preserving Edge Analytics Without Personal Data**<br>Log aggregated telemetry (scan count, tier distribution, wash-off alerts acknowledged) without UUIDs, device identifiers, or GPS coordinates to evaluate pilot uptake. | **PROPOSED** | **S** | Low | DPDP Act compliance audit | Operational telemetry |
| **B-6** | **Automated Dependency Vulnerability Remediation**<br>Patch `@grpc/grpc-js`, `react-router`, and `vite` to resolve 7 high-severity npm audit advisories. | **PROPOSED** | **M** | Medium | Regression testing across all 25 Vitest suites | Security / Audit |

---

## 3. Section C: Future Potential (3–12 Months)

Strategic and research frontiers for academic publication, institutional scale-up, and advanced agronomic intelligence:

| Item ID | Innovation / Research Direction | Governance Label | Effort | Institutional Dependency | Prior Published Work Overlap |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **C-1** | **Institutional Partnership with TNAU & ICAR KVKs**<br>Formal integration with Tamil Nadu Agricultural University (TNAU) Agritech Portal and Krishi Vigyan Kendra extension networks for official remedy endorsements. | **DEPENDS ON OWNER** | **L** | TNAU Academic Memorandum of Understanding (MoU) | Overlaps with state extension services (TNAU CPPC 2020) |
| **C-2** | **Decision Fragility Index (ARFI) Field Validation**<br>Publish multi-season longitudinal study evaluating whether pre-commitment stress audits reduce smallholder crop switching losses under drought. | **PROPOSED** | **L** | Multi-year agrarian survey in Cauvery Delta | Overlaps with Birthal et al. (2015) and Davis et al. (2019) (*verified in THINAI literature review*) |
| **C-3** | **On-Device Federated Learning for Disease Adaptation**<br>Train client-side disease classifiers locally on farmer devices using federated averaging, updating central weights without centralizing farmer photographs. | **PROPOSED** | **L** | Mobile edge ML runtime support | Published literature exists on federated edge vision (e.g. McMahan et al. 2017 - *verified*); agricultural application not verified locally. |
| **C-4** | **Multi-Spectral Satellite Telemetry Integration**<br>Integrate European Space Agency Sentinel-2 NDVI/NDWI vegetation indices into the ARFI engine to cross-validate farmer-reported soil moisture. | **PROPOSED** | **M** | Copernicus Open Access Hub API integration | Overlaps with remote sensing crop monitoring literature (not verified). |
| **C-5** | **Offline Topographic & Mandi Routing Maps**<br>Bundle vector maps of Tamil Nadu regulated markets (APMCs) with offline shortest-path routing for post-harvest crop transport. | **PROPOSED** | **M** | OpenStreetMap vector tile extracts for Tamil Nadu | Standard GIS routing. |
| **C-6** | **Agricultural Scheme Eligibility & Subsidy Automation**<br>Rule engine matching farmer landholding, caste, and crop parameters to Central/State subsidies (PM-KISAN, PMFBY, Kalaignar Scheme) with offline eligibility checklist. | **PROPOSED** | **S** | Tamil Nadu Department of Agriculture scheme guidelines | Rule-based expert systems (*Pudumalar et al. 2018 verified*). |

---

## 4. "What I Would Do First and Why" (Top 5 Priority Actions)

1. **Revert Working-Tree Discrepancies in `src/app/App.tsx` (Immediate, < 1 hour)**:
   * *Why*: The repository currently has 11 TypeScript compilation errors and 7 failing Vitest suites caused by uncommitted edits. Clean compilation is a prerequisite for any further verified development.
2. **Obtain Project Owner Sign-Off on `PILOT_PROTOCOL.md` Thresholds (1–2 days)**:
   * *Why*: Gate G10 is failing solely because the threshold parameters ($\tau_{\text{high}}=0.78, \tau_{\text{low}}=0.45$) lack owner sign-off. Approving or adjusting these resolves G10 immediately.
3. **Run APK on Physical Phone & Commit Logcat (1 day)**:
   * *Why*: The only missing mobile validation item is a physical phone test log. Installing the CI APK on a real Android device and capturing `adb logcat` closes the hardware verification gap.
4. **Fine-Tune MobileNetV2 on PlantDoc + Background Clutter (1–2 weeks)**:
   * *Why*: 25.60% field accuracy is the single largest technical vulnerability of the system. Fine-tuning with heavy background noise augmentation will lift empirical accuracy and make Tier 1 chemical advice safe to activate.
5. **Engage TNAU Agronomist for Tamil Translation & Remedy Sign-Off (2–3 weeks)**:
   * *Why*: Human verification of Tamil text and the 11 remedy handlers is required to safely provide native chemical guidance to Tamil smallholders.
