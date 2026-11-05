# Key Strategic & Architectural Questions for Claude

**Document Target**: Decisions & Unknowns Requiring External Architectural & Agronomic Review  
**Context**: Evaluated on commit `cde89aa` (`C:\Users\cswas\Documents\THINAI`)  

---

### Question 1: How should THINAI handle the severe lab-to-field vision accuracy gap (25.60%) during smallholder pilot trials?
* **Context**: MobileNetV2 trained on laboratory PlantVillage achieves $94.3\%$ accuracy under studio conditions, but collapses to $25.60\%$ accuracy (95% Wilson CI: [18.66%, 34.02%]) on real Indian field photography (PlantDoc, $N=125$).
* **Options**:
  1. *Option A (Current Safe Policy)*: Completely disable automated chemical recommendations in code (`IS_G4_FIELD_VALIDATED = false`), demote all scans to cultural/monitoring advice only, and route ambiguous scans to extension officers.
  2. *Option B (Aggressive Rejection)*: Raise the inconclusive threshold $\tau_{\text{low}}$ to $0.70$, which increases accuracy on accepted scans to $\approx 60\%$, but forces $85\%+$ of farmer scans into Tier 3 Inconclusive ("Cannot Tell").
  3. *Option C (Hybrid Cloud Fallback)*: When online, upload field photos to a larger cloud vision model (e.g., EfficientNet-B4 or ViT), keeping on-device MobileNetV2 purely as an offline triage filter.
* **Our Recommendation**: **Option A in the immediate term, transitioning to fine-tuned edge models (Option B/Edge)**. Maintaining zero chemical advice while accuracy is $25.6\%$ is the only ethically defensible agronomic posture. Smallholders cannot afford pesticide misapplication costs.

---

### Question 2: Should the core gate scorecard strictly preserve G1–G10, or formally adopt Extended Dimensions G11–G13?
* **Context**: `READINESS_CRITERIA.md` defined G1 through G10. Later phases added Windows desktop packaging (Electron), 23-language multilingual support, and crop packs. `docs/GATE_CHANGE_PROPOSAL.md` proposes adding G11, G12, and G13.
* **Options**:
  1. *Option A*: Approve the proposal in `GATE_CHANGE_PROPOSAL.md`, adding G11 (Desktop), G12 (Multilingual), and G13 (Crop Packs) as official non-breaking readiness criteria.
  2. *Option B*: Strictly preserve G1–G10 as the core pilot gate matrix; track desktop and multilingual features in separate auxiliary matrices (`FEATURE_MATRIX.md`).
* **Our Recommendation**: **Option B**. G1–G10 represent core agronomic and mobile safety gates. Conflating desktop packaging or 23-language translation with field deployment safety dilutes the core criteria needed for extension pilot sign-off.

---

### Question 3: What is the optimal architecture for the FastAPI / ARFI backend given smallholder offline constraints?
* **Context**: THINAI is designed as an offline-first mobile app using Dexie.js IndexedDB. A full FastAPI microservice with SQLite/PostgreSQL, scikit-learn models, and ARFI stress simulation exists in `backend/app/`, but smallholders in rural Cauvery Delta often lack reliable connectivity to reach cloud microservices.
* **Options**:
  1. *Option A (Dual-Tier)*: Retain the client-side heuristic decision engine (`src/services/decisionEngine.ts`) for offline-first edge execution, and synchronize telemetry to the FastAPI backend asynchronously for macro-level extension analytics.
  2. *Option B (Full Edge Port)*: Port the scikit-learn Random Forest and Gradient Boosting models directly to ONNX WebAssembly (`onnxruntime-web`), running the entire ARFI six-scenario stress matrix on the farmer's smartphone.
  3. *Option C (Cloud Only)*: Deprecate the client-side decision engine; require internet connectivity for all crop recommendations and ARFI calculations.
* **Our Recommendation**: **Option A**. Option C violates offline-first invariants for rural farmers. Option B introduces substantial bundle size and memory overhead on 2GB RAM phones. Option A cleanly separates on-device operational resilience from cloud analytical aggregation.

---

### Question 4: How should THINAI govern remedy translations in 22 non-English languages without human review?
* **Context**: Translating technical chemical names and dosages via machine translation carries lethal phytotoxicity risks. Currently, all chemical advice is forced to display in English with an alert box (`src/services/i18n.ts`).
* **Options**:
  1. *Option A (Current English Fallback)*: Retain English-only text for chemical pesticide formulations in all 22 non-reviewed languages until a qualified regional agronomist signs off.
  2. *Option B (Complete Chemical Withholding)*: Strip chemical recommendations entirely from the UI in non-reviewed languages, displaying only organic/cultural practices.
  3. *Option C (Phonetic Transliteration)*: Provide phonetic transliteration of active chemical molecules (e.g. "மேன்கோசெப்" for Mancozeb) alongside trade names, without translated instructions.
* **Our Recommendation**: **Option B**. If a farmer cannot read English, presenting a technical chemical formulation in English could lead to misunderstanding or consultation with uncertified agro-chemical retail dealers. Displaying only safe cultural practices in unreviewed languages eliminates phytotoxicity risk.

---

### Question 5: How should the project resolve the uncommitted working-tree modifications in `src/app/App.tsx`?
* **Context**: The working directory currently contains modified versions of `src/app/App.tsx` and `AuthScreens.tsx` that cause 11 TypeScript compilation errors and fail 7 Vitest suites, whereas commit `5c74517` passes cleanly.
* **Options**:
  1. *Option A (Git Restore)*: Discard unstaged changes via `git checkout -- src/app/App.tsx src/app/components/AuthScreens.tsx`, instantly restoring clean compilation and 137 passing tests.
  2. *Option B (Surgical Re-Alignment)*: Preserve newly added UI features in `App.tsx` (such as offline auth buttons and telemetry cards) while adding the missing TypeScript imports and accessibility attributes to satisfy the regression suites.
* **Our Recommendation**: **Option B**. The working-tree modifications add valuable user-requested features (e.g., explicit offline login bypass). A surgical re-alignment satisfies both functional goals and compiler/test invariants.

