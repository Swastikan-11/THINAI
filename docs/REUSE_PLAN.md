# THINAI Phase 2: Open-Source Project Study & Reuse Plan

**Document Version:** 1.0.0  
**Git Branch:** `rework/phase-2`  
**Base Commit SHA:** `2eb37dbab00586e025b07e325f4ec2a468f4d66f` (tag: `pre-rework-2`)  
**Status:** PROPOSED — Awaiting User Approval (No code changes committed)

---

## 1. Executive Summary & Methodology

In compliance with Phase 2 requirements and Standing Rules 1, 3, 5, and 6, this study examines six external agricultural and disease-detection codebases. Every repository was cloned into an isolated scratch environment (`.gemini/antigravity/brain/.../scratch/clones/`) and inspected directly. Real `LICENSE` files, git logs, directory trees, model inference pipelines, and UI implementations were evaluated.

### Core Standing Constraints Applied
1. **Licence Integrity (Rule 6):** Code reuse is strictly restricted to repositories with verified MIT or Apache-2.0 licenses. Code from GPL-2.0 projects (`farmOS`) and repositories with no formal license file (`mouathayed/Plant-Disease-Detection`, `MinSiThu/Podoco`, `abdallahalidev/plant-planet`) is **never copied**; architectural and UX concepts are evaluated strictly for clean-room reimplementation or skipped.
2. **Attribution:** Any reused MIT/Apache assets will be formally attributed in `THIRD_PARTY_LICENSES.md` prior to incorporation.
3. **Evidence-Based Reporting (Rule 3):** All commit hashes, dates, and file paths quoted below are derived directly from git inspection commands.
4. **Zero Fabrication & Redundancy Prevention (Rule 4):** THINAI's existing capabilities (LiteRT WASM on-device inference, calibrated confidence gating $\tau_{\text{high}}=0.78, \tau_{\text{low}}=0.45$, IndexedDB offline FIFO sync, 6-language Indian localization) were cross-checked to avoid duplicating functional code.

---

## 2. Detailed Project Analysis

---

### Project 1: LeafLife
* **Repository URL:** `https://github.com/aliyigittas/LeafLife`
* **Head Commit:** `ef4647894dd899e930885ece8d8c363fd3374441` (Committed: `2023-07-08T14:10:00+03:00` by Ali Yiğit Taş)
* **License File:** `LICENSE`
* **License Name & Type:** `MIT License`
* **License File Commit:** `ead4d4b85d2fc7889648a354007d43a818874c37` (Committed: `2023-03-28T18:22:42Z` by Ali Yiğit Taş)
* **License Header Quote:**
  ```text
  MIT License

  Copyright (c) 2023 Ali Taş

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  ```
* **Tech Stack:** Flutter 3, Dart, Firebase Auth (`firebase_auth`), Cloud Firestore (`cloud_firestore`), Firebase Storage (`firebase_storage`), Flutter TFLite (`tflite: ^1.1.2`).

#### Features Identified
1. **On-Device TFLite Classification (`lib/NewPost.dart`):** Runs `Tflite.runModelOnImage` using Teachable Machine model (`assets/model_unquant.tflite`). Normalizes top-2 confidences by summing them.
2. **Camera & Gallery Picker (`lib/NewPost.dart`):** Captures leaf image via `image_picker`.
3. **Community Social Feed (`lib/HomeScreen.dart`):** Farmers upload diagnosed images to Firebase Storage; posts are saved in Firestore `Users/{uid}/Posts` and displayed in a global feed with comments and likes.
4. **Static Disease Encyclopedia (`lib/SearchScreen.dart`):** Two-column card grid showing Late Blight and other diseases with hardcoded descriptions and chemical sprays.
5. **User Profile (`lib/ProfileScreen.dart`):** Shows user avatar, display name, and post count.

#### Comparative Evaluation
* **What THINAI Does Better:**
  * THINAI runs on-device LiteRT WASM with calibrated INT8/FP16 models directly in browser and Android WebView without deprecated Flutter wrapper packages (`tflite ^1.1.2`).
  * THINAI enforces selective confidence gating ($\tau_{\text{high}}=0.78, \tau_{\text{low}}=0.45$, Temperature $T=1.28$) and 100% out-of-domain rejection to Tier 3. LeafLife has zero gating and simply divides top-1 score by the sum of top-2 scores.
  * THINAI works completely offline with Dexie IndexedDB sync and conflict resolution; LeafLife fails without active internet connection to Firebase Storage.
  * THINAI has full localization in 6 Indian languages; LeafLife is hardcoded in English.
* **What LeafLife Does Better:**
  * Community peer discussion feed allowing farmers to share observations with fellow growers.
* **Feature Actions:**
  * `TFLite Inference Pipeline`: **SKIP** (Inferior to THINAI's LiteRT WASM gating engine).
  * `Community Social Feed`: **SKIP** (Out of scope for THINAI's offline clinical diagnostic tool; introduces content moderation overhead and unverified agronomic advice risks).
  * `Disease Encyclopedia Cards`: **REIMPLEMENT** (Clean-room TypeScript React implementation of an offline disease library backed by IndexedDB).

---

### Project 2: FarmerChat (Digital Green)
* **IADB Digital Public Good Listing:** `https://knowledge.iadb.org/en/code-development/open-source-solutions/farmerchat`
  * **Listed License:** `Apache License, Version 2.0`
  * **Listed Code Link:** `https://github.com/digitalgreenorg/farmstack-backend`
* **Underlying Repositories Identified & Inspected:**
  1. **`digitalgreenorg/farmerchat-prompts`** (`https://github.com/digitalgreenorg/farmerchat-prompts`):
     * **Head Commit:** `7154ef3d751c1986081c981343e5126fa3a37ad9` (Committed: `2025-12-18T16:27:11+05:30` by aakashdg)
     * **License File:** `LICENSE` (MIT License)
     * **License File Commit:** `579796ee40ad208f12a04a23026322286cfaf38f` (Committed: `2025-12-18T08:05:44Z` by aakashdg)
     * **License Header Quote:**
       ```text
       MIT License

       Copyright (c) 2025 Digital Green Private Limited

       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       ```
  2. **`digitalgreenorg/farmstack-open`** (`https://github.com/digitalgreenorg/farmstack-open`):
     * **Head Commit:** `b3fa2f1a981e7e6bbc67720bf329d627824dfa43` (Committed: `2022-05-06T22:12:45+05:30` by Amanuel Negash)
     * **License File:** `LICENSE` (Apache-2.0)
     * **License File Commit:** `b3fa2f1a981e7e6bbc67720bf329d627824dfa43` (Committed: `2022-05-06T22:12:45+05:30` by Amanuel Negash)
     * **License Header Quote:**
       ```text
                                        Apache License
                                  Version 2.0, January 2004
                               http://www.apache.org/licenses/

          TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION
       ```
  3. **`digitalgreenorg/farmstack-backend`** (`https://github.com/digitalgreenorg/farmstack-backend`):
     * **Head Commit:** `84bc87cad88c6cfd1d6e65bb52bdbce6b9fe7b5d` (Committed: `2025-02-04T15:59:09+05:30` by i-am-waseem)
     * **License File:** No formal `LICENSE` file in repository root (the open-source core is distributed under `farmstack-open`).
* **Tech Stack:** Python 3, Django, Pydantic, OpenAI API / Google Gemma / Meta Llama, PostgreSQL.

#### Features Identified
1. **Multi-Domain Agricultural Prompt Architecture (`farmerchat_prompts/prompts/crop_advisory/`):** Domain-specific system prompts for Indian agricultural contexts covering `crop_recommendation`, `pest_management`, `soil_analysis`, `weather_advisory`, and `market_insights`.
2. **Agronomic Specificity & Fact Verification (`farmerchat_prompts/prompts/prompt_evals/`):** Evaluator prompts that verify whether agricultural advice contains required contextual anchors (soil type, season, crop stage, irrigation) and flags ungrounded generalities.
3. **Contradiction & Hallucination Guardrails (`farmerchat_prompts/prompts/prompt_evals/openai.py`):** Multi-stage validation checking retrieved advisory against known facts and detecting conflicting advice.
4. **FarmStack Data Federation (`farmstack-open`):** Multi-tenant data exchange network for agricultural institutions and extension programs.

#### Comparative Evaluation
* **What THINAI Does Better:**
  * THINAI functions entirely on-device and offline with zero recurring LLM token fees or cloud API latency, crucial for smallholders in remote fields.
  * THINAI provides calibrated computer-vision diagnostics on real leaves, whereas FarmerChat operates primarily as a conversational text/voice RAG agent.
  * THINAI's UI is localized in 6 Indian languages with client-side reactive switching.
* **What FarmerChat Does Better:**
  * Highly structured agronomic prompt taxonomy specifically crafted for Indian farming contexts (seasonality, soil moisture, localized agronomic terminology).
  * Automated specificity verification to avoid dangerously generic chemical recommendations.
* **Feature Actions:**
  * `Agricultural Prompt Templates`: **REUSE** (Files: `farmerchat_prompts/prompts/crop_advisory/openai.py` and `gemma.py`, MIT licensed. Adapt prompt structures into THINAI's advisory assistant configuration with attribution in `THIRD_PARTY_LICENSES.md`).
  * `Agronomic Specificity Validation Logic`: **REIMPLEMENT** (Idea only: implement client-side validation ensuring remedy recommendations require crop stage and weather checks before display).
  * `FarmStack Multi-Tenant Backend`: **SKIP** (Excessive infrastructure overhead; out of scope for THINAI client).

---

### Project 3: farmOS
* **Repository URL:** `https://github.com/farmOS/farmOS`
* **Head Commit:** `441ea6a45f893bd807c42b31fd7fdc6119f5058b` (Committed: `2026-10-21T14:32:02-04:00` by Michael Stenta)
* **License File:** `LICENSE.txt` / `COPYRIGHT.txt`
* **License Name & Type:** `GNU General Public License v2.0 (GPL-2.0)`
* **License File Commit:** `883436b28cf91cc6fbb989736e8d7a7767b8725d` (Committed: `2017-08-21T20:38:49Z` by Michael Stenta)
* **License Header Quote:**
  ```text
  All farmOS code is Copyright 2013 - 2026 by the original authors.

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or (at
  your option) any later version.
  ```
* **Tech Stack:** Drupal 11, PHP 8.3, PostgreSQL / MySQL, OpenLayers / Leaflet mapping.

#### Features Identified
1. **Asset Management (`modules/asset/`):** Tracks physical farm entities including `Plant`, `Land` (fields, beds), `Equipment`, `Water`, and `Sensor`.
2. **Standardized Event Logging (`modules/log/`):**
   * `Observation` Log (`modules/log/observation/`): Records field scouting, pest/pathogen sightings, geolocations, and photos.
   * `Input` Log (`modules/log/input/`): Records spray applications, fertilizers, dosages, materials, and target crops.
   * `Activity` Log (`modules/log/activity/`): General field operations (irrigation, tilling, weeding).
   * `Harvest` Log (`modules/log/harvest/`): Crop yield and harvest dates.
3. **Quantity & Units System (`modules/core/quantity/`):** Standardized decimal measurement tracking for agricultural inputs and outputs.
4. **Geographic Mapping (`modules/core/map/`):** Field boundary polygons and location points.

#### Comparative Evaluation
* **What THINAI Does Better:**
  * THINAI is a lightweight, mobile-first PWA designed for handheld smartphone operation in fields; farmOS is a complex desktop-centric Drupal web server requiring PHP, database servers, and heavy administrative workflows.
  * THINAI provides instant on-device AI visual disease diagnosis (523ms inference); farmOS has no computer-vision or automated plant pathology diagnostic capabilities.
* **What farmOS Does Better:**
  * Industry-standardized agricultural record keeping schema (separation of Assets, Logs, and Quantities) allowing farmers to track chemical inputs, treatment efficacy, and field history over seasons.
* **Feature Actions:**
  * **Licence Rule 6 Strict Compliance:** Under GPL-2.0, **ZERO CODE** can be copied or reused.
  * `Asset & Log Schema Architecture`: **REIMPLEMENT** (Idea only: Create a clean-room TypeScript data model in Dexie IndexedDB with `ObservationLog` for scan results and `InputLog` for recorded spray/treatment applications).
  * `Drupal Core & PHP Backend Modules`: **SKIP** (Incompatible runtime architecture).

---

### Project 4: Plant-Disease-Detection (LeafGuard)
* **Repository URL:** `https://github.com/mouathayed/Plant-Disease-Detection`
* **Head Commit:** `5ab86934e65c4f9cdf821aac80ea014c379cbfa8` (Committed: `2024-06-09T19:26:42+01:00` by mouathayed)
* **License File:** **NONE FOUND** (HTTP 404 on GitHub license API; no license file in repository root or subfolders).
* **Licence Rule Status:** Reference only; copy nothing.
* **Tech Stack:** Flutter (mobile client), Python Flask (`modelApi/predict.py`), TensorFlow Keras (`myModel.h5`), static CSV (`p4.csv`).

#### Features Identified
1. **Flask REST API Diagnostic Pipeline (`modelApi/predict.py`):** Flask backend accepts multipart image uploads, resizes to $224\times 224$, runs Keras `.predict()`, and returns top-3 classes. Contains hardcoded Windows developer paths (`C:/Users/mouat/Desktop/...`).
2. **Top-3 Prediction Differential Display (`leafguard/lib/prediction_details_page.dart`):** Presents the top predictions side-by-side with reference sample photos, descriptions, and prevention steps fetched from `p4.csv`.
3. **Camera & Gallery Capture (`leafguard/lib/predict.dart`):** Image picker input.

#### Comparative Evaluation
* **What THINAI Does Better:**
  * THINAI executes 100% on-device via LiteRT WASM without requiring a remote Python Flask server.
  * THINAI has calibrated confidence gating and out-of-domain rejection; LeafGuard unconditionally returns predictions even for non-plant images.
  * THINAI has zero hardcoded developer paths and full offline support.
* **What LeafGuard Does Better:**
  * Visual verification UX: Displays a canonical reference photograph of the diagnosed disease alongside the diagnosis, allowing the farmer to visually confirm symptoms before applying treatments.
* **Feature Actions:**
  * `Visual Reference Photo Verification UX`: **REIMPLEMENT** (Idea only: In THINAI's Tier 2 review state, show a reference photo of the suspect disease for farmer visual confirmation. Clean-room TypeScript React implementation).
  * `Flask Backend & Flutter Source Code`: **SKIP** (No license; architectural regressions).

---

### Project 5: Podoco
* **Repository URL:** `https://github.com/MinSiThu/Podoco`
* **Head Commit:** `c3d533e0ca13085ad14c89ad9ac4e85a68947203` (Committed: `2023-05-28T17:10:01+06:30` by Min Si Thu)
* **License File:** **NONE FOUND** (Informal text in `lib/translations/languages.dart` claims "can be used freely according to MIT Lisence", but no formal `LICENSE` file exists in the repository).
* **Licence Rule Status:** Reference only; copy nothing.
* **Tech Stack:** Flutter, Dart, `tflite_flutter`, `tflite_flutter_helper`, Google CropNet Cassava model (`cropnet.tflite`).

#### Features Identified
1. **Cassava CropNet Classifier (`lib/classifier/classifier.dart`):** On-device inference across 6 cassava classes (Bacterial Blight, Brown Streak Disease, Green Mite, Mosaic Disease, Healthy, Unknown).
2. **Dedicated "Unknown" Model Class:** The model includes an explicit "Unknown" class to capture out-of-distribution inputs.
3. **Bilingual Localization (`lib/translations/languages.dart`):** Translations for English (`en_US`) and Burmese (`my_MM`) using GetX.
4. **Simple Results Card (`lib/components/ResultTextBox.dart`):** Displays top label and raw score.

#### Comparative Evaluation
* **What THINAI Does Better:**
  * THINAI covers 39 classes across 14 crops with crop gating prior; Podoco is strictly limited to Cassava.
  * THINAI employs calibrated temperature scaling ($T=1.28$) and selective dual-threshold triage ($\tau_{\text{high}}=0.78, \tau_{\text{low}}=0.45$). Podoco relies on raw argmax output with no thresholding.
  * THINAI supports 6 Indian regional languages with complete coverage.
* **What Podoco Does Better:**
  * Incorporates an explicit "Unknown" class in the model output taxonomy.
* **Feature Actions:**
  * `Explicit Out-of-Domain Classification UX`: **REIMPLEMENT** (Idea only: Reinforce THINAI's Tier 3 UI with clear "Unidentified / Non-Agricultural Input" feedback, clean-room TypeScript).
  * `Flutter Source & Model Files`: **SKIP** (No license; duplicate/inferior to THINAI's LiteRT WASM).

---

### Project 6: plant-planet
* **Repository URL:** `https://github.com/abdallahalidev/plant-planet`
* **Head Commit:** `d03c348b2b44645405662dc9f2b0eda963e3d7e6` (Committed: `2019-09-13T05:42:53+02:00` by abdallahalidev)
* **License File:** **NONE FOUND** (HTTP 404 on GitHub license API; no license file in repository root or subfolders; EUCYS 2019 contest submission).
* **Licence Rule Status:** Reference only; copy nothing.
* **Tech Stack:** Android Native (Kotlin), Fotoapparat camera library, Firebase ML Custom Model Downloader (`com.google.firebase.ml.custom`), SQLite OpenHelper (`DatabaseHelper.kt`), Android Text-To-Speech (`android.speech.tts.TextToSpeech`), Google Maps (`MapsActivity.kt`).

#### Features Identified
1. **Text-to-Speech (TTS) Readout (`app/src/main/java/.../activities/ResultActivity.kt`):** Uses Android `TextToSpeech` to vocalize the disease diagnosis and management advice when the farmer taps an audio button.
2. **Local Diagnosis History (`DatabaseHelper.kt`):** Stores past scan results with diagnosis name, confidence percentage, and compressed image BLOB in local SQLite database.
3. **Disease Encyclopedia Library (`LibraryActivity.kt`):** Searchable list of crops and associated pathologies with prevention recommendations.
4. **Outbreak Map (`MapsActivity.kt`):** Renders disease detection pins on Google Maps using Firebase Realtime Database coordinates.

#### Comparative Evaluation
* **What THINAI Does Better:**
  * THINAI is a modern cross-platform PWA running on web and Android without legacy Firebase ML cloud dependencies.
  * THINAI stores scan data in Dexie IndexedDB with structured schema, FIFO sync queue, and LWW resolution, avoiding SQLite BLOB memory leaks.
  * THINAI has calibrated gating, temperature scaling, and crop priors.
* **What plant-planet Does Better:**
  * Text-to-Speech (TTS) accessibility: Essential for smallholder farmers with limited literacy to hear diagnoses in their native language.
  * Agronomic outbreak map: Visualizes geographic clustering of plant disease cases.
* **Feature Actions:**
  * `Text-to-Speech (TTS) Audio Readout UX`: **REIMPLEMENT** (Idea only: Add an audio readout button to THINAI's diagnosis card using the standard browser Web Speech API `window.speechSynthesis` with Indian language codes `ta-IN`, `hi-IN`, `te-IN`, `kn-IN`, `ml-IN`, `en-IN`. Clean-room TypeScript).
  * `Disease Outbreak Map Visualization UX`: **REIMPLEMENT** (Idea only: Anonymized local disease heatmap using Leaflet / OpenStreetMap. Clean-room TypeScript).
  * `Android Kotlin & SQLite BLOB Code`: **SKIP** (No license; architectural regression).

---

## 3. Comprehensive Feature Comparison & Reuse Matrix

| Project | License & Status | Specific Feature | THINAI Current State | external Project State | Action | Reused Files / Clean-Room Target | Estimated Effort | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FarmerChat** (`digitalgreenorg`) | MIT (`farmerchat-prompts`) / Apache-2.0 (`farmstack-open`) | Agricultural Prompt Taxonomy & Templates | Basic system prompt in chat assistant | Structured prompts for crop recommendations, pest management, soil, weather, market | **REUSE** | Reused: `farmerchat_prompts/prompts/crop_advisory/openai.py`, `gemma.py`. Adapt to TS config. | 0.5 days | Low |
| **FarmerChat** (`digitalgreenorg`) | MIT (`farmerchat-prompts`) | Agronomic Specificity & Guardrail Logic | Gating engine on CV model | Validates contextual anchors (soil type, season, irrigation) in advice | **REIMPLEMENT** | Clean-room TS helper validating remedy display preconditions | 1.0 day | Low |
| **FarmerChat** (`digitalgreenorg`) | Apache-2.0 (`farmstack-open`) | FarmStack Data Federation | Direct Firestore + IndexedDB sync | Multi-tenant organization datahub | **SKIP** | Not applicable to client-side app | — | Low |
| **farmOS** | GPL-2.0 (Reference Only) | Farm Asset & Event Log Schema | Basic scan history in IndexedDB | Standardized Observation, Input, Activity, Harvest log entities | **REIMPLEMENT** | Clean-room TypeScript Dexie entities (`ObservationRecord`, `InputLogRecord`) | 1.5 days | Low |
| **farmOS** | GPL-2.0 (Reference Only) | Drupal PHP Server & Modules | Client-side Vite/React/Capacitor PWA | Heavy Drupal 11 PHP server | **SKIP** | Incompatible architecture | — | Low |
| **plant-planet** | None (Reference Only) | Text-to-Speech (TTS) Result Readout | Text display only | Android `TextToSpeech` vocalization | **REIMPLEMENT** | Clean-room Web Speech API (`window.speechSynthesis`) for 6 Indian languages | 0.5 days | Low |
| **plant-planet** | None (Reference Only) | Outbreak Mapping | Tabular scan history only | Google Maps pin visualization of disease outbreaks | **REIMPLEMENT** | Clean-room Leaflet / OpenStreetMap disease pressure heatmap | 2.0 days | Medium (DPDP GPS privacy) |
| **LeafGuard** (`mouathayed`) | None (Reference Only) | Reference Photo Comparison UX | Displays detected disease name | Displays side-by-side reference leaf photo with description | **REIMPLEMENT** | Clean-room TS React modal for Tier 2 differential verification | 0.5 days | Low |
| **LeafLife** | MIT | Community Social Feed | Offline personal scan archive | Public feed with posts, likes, comments in Firestore | **SKIP** | Out of scope; moderation & unverified remedy liability | — | Low |
| **LeafLife** | MIT | TFLite Inference Pipeline | LiteRT WASM ($T=1.28$, $\tau=0.78$) | Deprecated `tflite` Flutter plugin, unquantized model, no gating | **SKIP** | Inferior to THINAI | — | Low |
| **Podoco** | None (Reference Only) | Dedicated "Unknown" / OOD UX | Tier 3 fallback with advisory | Explicit "Unknown" output class | **REIMPLEMENT** | Refine Tier 3 visual guidance (lighting, angle, retake prompt) | 0.5 days | Low |

---

## 4. Implementation Phasing & Risk Assessment

### Priority 1: High-Impact, Low-Risk Additions (Phase 3 Recommended Candidates)
1. **Text-to-Speech (TTS) Audio Readout (Inspired by `plant-planet`):**
   * *Implementation:* Use the standard Web Speech API (`window.speechSynthesis`) in `DiagnosisCard.tsx`.
   * *Languages Supported:* `ta-IN` (Tamil), `hi-IN` (Hindi), `te-IN` (Telugu), `kn-IN` (Kannada), `ml-IN` (Malayalam), `en-IN` (English).
   * *Effort:* 0.5 days.
   * *Risk:* Very Low (Zero external dependencies; supported natively in Android WebView and modern browsers).
2. **Agricultural Prompt Templates Adaptation (Reused from `farmerchat-prompts`):**
   * *Implementation:* Integrate structured prompts for crop advisory and pest management into `src/utils/aiAdvisor.ts`.
   * *Attribution:* Add Digital Green Private Limited attribution to `THIRD_PARTY_LICENSES.md`.
   * *Effort:* 0.5 days.
   * *Risk:* Low (Template tuning for client context).
3. **Reference Photo Verification for Tier 2 Diagnoses (Inspired by `LeafGuard`):**
   * *Implementation:* When model confidence lands in Tier 2 ($0.45 \le p < 0.78$), present a canonical leaf photo of the suspected disease so the farmer can visually confirm symptoms before proceeding.
   * *Effort:* 0.5 days.
   * *Risk:* Low (Static reference assets).

### Priority 2: Medium-Effort Enhancements (Subsequent Phases)
4. **Structured Farm Activity & Treatment Logs (Inspired by `farmOS`):**
   * *Implementation:* Extend `src/utils/offlineSync.ts` with Dexie tables for `treatment_logs` (recording chemical/organic inputs applied, date, dosage, and outcome) linking back to original scan observations.
   * *Effort:* 1.5 days.
   * *Risk:* Low.
5. **Local Outbreak Map Visualization (Inspired by `plant-planet`):**
   * *Implementation:* Leaflet / OpenStreetMap component rendering localized, aggregate disease clusters.
   * *Effort:* 2.0 days.
   * *Risk:* Medium. Strict DPDP compliance required: farmer GPS coordinates must be generalized/fuzzed to a minimum 1km grid before storage or mapping to prevent farmer re-identification.

---

## 5. Verification & Standing Rules Checklist

* [x] **New Git Branch:** Created and active on `rework/phase-2`.
* [x] **Pre-Phase Tag:** `pre-rework-2` placed at commit `2eb37dbab00586e025b07e325f4ec2a468f4d66f`.
* [x] **Real LICENSE Files Opened & Quoted:**
  * LeafLife: `LICENSE` (MIT, commit `ead4d4b85d2fc7889648a354007d43a818874c37`)
  * FarmerChat: `LICENSE` in `farmerchat-prompts` (MIT, commit `579796ee40ad208f12a04a23026322286cfaf38f`) and `LICENSE` in `farmstack-open` (Apache-2.0, commit `b3fa2f1a981e7e6bbc67720bf329d627824dfa43`)
  * farmOS: `COPYRIGHT.txt` / `LICENSE.txt` (GPL-2.0, commit `883436b28cf91cc6fbb989736e8d7a7767b8725d`)
  * Plant-Disease-Detection: Verified 404 / no license file in repo
  * Podoco: Verified 404 / no license file in repo
  * plant-planet: Verified 404 / no license file in repo
* [x] **Licence Integrity Enforced:** Reused code identified strictly from MIT/Apache sources (`farmerchat-prompts`). No code copied from GPL-2.0 or unlicensed repositories.
* [x] **No Code Changes in Phase 2:** Application source code (`src/`, `android/`, `ml/`, `tests/`) has not been altered.
* [x] **Zero Fabricated Data & Objective Tone:** Report contains no banned hype terminology.
