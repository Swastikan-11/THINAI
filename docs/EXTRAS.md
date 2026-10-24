# THINAI Extended Features & Non-Gate Deliverables (`docs/EXTRAS.md`)

This document records extended platform deliverables and supplementary features that are developed outside the primary 10 binary gates (G1–G10) defined in [READINESS_CRITERIA.md](file:///c:/Users/cswas/Documents/THINAI/READINESS_CRITERIA.md).

---

## 1. Windows Desktop Installer & Electron Shell (Candidate Gate G11)

### Technical Details
- **Packaging Framework**: Electron 31 + `electron-builder`
- **Output Executable**: `dist-electron/win-unpacked/THINAI.exe` (and `dist-electron/THINAI-Setup-1.0.0.exe`)
- **Architecture**: Windows x86_64
- **Signing Status**: **Unsigned**. Will trigger Microsoft Defender SmartScreen warning ("Unknown Publisher"). THINAI explicitly claims no commercial Authenticode code-signing certificate for this distribution.
- **Hardware Integration & Capabilities**:
  - Web camera access supported via Chromium device bridge.
  - LiteRT WASM model execution fully functional on CPU runtime without internet connection.
  - Auto-update: Disabled / Not implemented for local binary testing.

### Local Windows Verification
- Executed on Windows 11 host machine.
- App launched cleanly, displaying the full bilingual/multilingual interface.
- Leaf image inspection and language toggles tested.

---

## 2. Multilingual Support: 23 Scheduled Indian Languages (Candidate Gate G12)

THINAI expands beyond the core Tamil (`ta`) and English (`en`) pair to support all 22 official languages listed in the Eighth Schedule of the Constitution of India, plus English:

| Language | ISO Code | Script / Layout | Parity Status | Translation Source |
|---|:---:|:---:|:---:|---|
| **English** | `en` | Latin (LTR) | 100% Core (Verified) | Native Human Translation |
| **Tamil** | `ta` | Tamil (LTR) | 100% Core (Verified) | TNAU Agronomy / Native Human Review |
| **Assamese** | `as` | Bengali-Assamese | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Bengali** | `bn` | Bengali | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Bodo** | `brx` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Dogri** | `doi` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Gujarati** | `gu` | Gujarati | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Hindi** | `hi` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Kannada** | `kn` | Kannada | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Kashmiri** | `ks` | Perso-Arabic (RTL) | Key Parity Complete | Machine Translation / RTL Layout |
| **Konkani** | `kok` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Maithili** | `mai` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Malayalam** | `ml` | Malayalam | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Manipuri (Meitei)**| `mni` | Meetei Mayek / Bengali | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Marathi** | `mr` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Nepali** | `ne` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Odia** | `or` | Odia | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Punjabi** | `pa` | Gurmukhi | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Sanskrit** | `sa` | Devanagari | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Santali** | `sat` | Ol Chiki | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Sindhi** | `sd` | Perso-Arabic (RTL) | Key Parity Complete | Machine Translation / RTL Layout |
| **Telugu** | `te` | Telugu | Key Parity Complete | Machine Translation / Pre-reviewed |
| **Urdu** | `ur` | Perso-Arabic (RTL) | Key Parity Complete | Machine Translation / RTL Layout |

*Note: In accordance with gate safety rules, translations outside Tamil and English are labeled provisional until validated by native agronomic extension officers in their respective states.*

---

## 3. Crop Coverage Expansion (Candidate Gate G13)

### Crop Registry & Due Diligence (`data/crop_registry.json`)
The expansion roadmap catalogs 18 major Tamil Nadu crops:
- **Core Modeled Crops (Active LiteRT Neural Model)**: Tomato, Corn (Maize), Pepper (Chilli), Potato.
- **Provisional / Rule-Gated Crops**: Paddy (Rice), Sugarcane, Groundnut, Cotton, Banana, Millets (Ragi, Cholam, Bajra), Pulses (Black gram, Green gram, Red gram), Coconut, Mango, Brinjal, Onion, Turmeric, Tapioca (Cassava).
- **Domain Guard Rule**: Unmodeled crops are intercepted by the domain classifier and selectively routed to Tier 3 with the explicit guidance: *"This crop requires field confirmation by an agricultural extension officer. On-device automated diagnosis is not calibrated for this class."*
