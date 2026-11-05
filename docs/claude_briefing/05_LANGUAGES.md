# THINAI Multilingual Architecture, Typography & Translation Governance

**Document Target**: 23-Language Registry, Typography Specifications & Safety Invariants  
**Context**: Evaluated on commit `cde89aa` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `locales/status.json`, `locales/*.json`, `public/fonts/fonts.css`, `docs/LANGUAGES.md`, `tests/multilingual_parity.test.ts`  

---

## 1. 23-Language Master Registry

THINAI provides translation support for English plus the 22 Scheduled Languages recognized under the Eighth Schedule of the Constitution of India:

| Code | English Name | Native Name | Script Family | Layout Dir | Key Count | Completeness | Review Status | Named Reviewer | Review Date |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `en` | **English (Base)** | English | Latin | LTR | 125 / 125 | all 125 | **REVIEWED** | Dr. K. Ramanathan (TNAU Agronomy) | 2026-10-01 |
| `ta` | **Tamil** | தமிழ் | Tamil | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `hi` | **Hindi** | हिन्दी | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `as` | **Assamese** | অসমীয়া | Bengali-Assamese | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `bn` | **Bengali** | বাংলা | Bengali | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `brx` | **Bodo** | बड़ो | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `doi` | **Dogri** | डोगरी | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `gu` | **Gujarati** | ગુજરાતી | Gujarati | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `kn` | **Kannada** | ಕನ್ನಡ | Kannada | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `ks` | **Kashmiri** | کٲشُر | Perso-Arabic | **RTL** | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `kok` | **Konkani** | कोंकणी | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `mai` | **Maithili** | मैथिली | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `ml` | **Malayalam** | മലയാളം | Malayalam | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `mni` | **Manipuri** | মৈতৈলোন্ | Bengali | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `mr` | **Marathi** | मराठी | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `ne` | **Nepali** | नेपाली | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `or` | **Odia** | ଓଡ଼ିଆ | Odia | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `pa` | **Punjabi** | ਪੰਜਾਬੀ | Gurmukhi | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `sa` | **Sanskrit** | संस्कृतम् | Devanagari | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `sat` | **Santali** | ᱥᱟᱱᱛᱟᱲᱤ | Ol Chiki | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `sd` | **Sindhi** | سنڌي | Perso-Arabic | **RTL** | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `te` | **Telugu** | తెలుగు | Telugu | LTR | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |
| `ur` | **Urdu** | اُردُو | Perso-Arabic | **RTL** | 125 / 125 | all 125 | **MACHINE-DRAFT** | *(Awaiting Agronomic Sign-Off)* | *(Pending)* |

* **Schema Symmetry**: Verified by `tests/multilingual_parity.test.ts`. Every single locale file contains exactly 125 UI translation keys mirroring `locales/en.json`.
* **RTL Languages**: Urdu (`ur`), Kashmiri (`ks`), and Sindhi (`sd`). When selected, the DOM dynamically receives `dir="rtl"`, and utility classes flip margins and chevron directions (`[dir="rtl"] .rtl-flip`).

---

## 2. Translation Production Methodology

1. **Base English Dictionary (`locales/en.json`)**: Curated by the agronomy engineering team with standardized terminology aligned with TNAU Agritech Portal glossaries.
2. **Machine-Draft Translations**: Non-English dictionaries were generated using neural machine translation engines via Google Translate API and AI batch synthesis, followed by syntactic JSON normalization and schema alignment.
3. **Audit Status**: Because automated machine translation often makes critical errors on agricultural chemical compounds, dosage formulations, and botanical terms, **all 22 non-English languages are explicitly marked `MACHINE-DRAFT`** in `locales/status.json`. None are claimed to be human-verified.

---

## 3. Typography & Font System (`public/fonts/fonts.css`)

To ensure rendering across Android, Linux, macOS, and Windows without missing characters or "tofu" glyph replacement boxes (□), `public/fonts/fonts.css` defines an Indic and Perso-Arabic font stack:

* **License**: SIL Open Font License 1.1 (OFL-1.1).
* **Font Stacks Specified in CSS**:
  * **Tamil**: `"Noto Sans Tamil"`, `"Latha"`, `"Mukta Malar"`
  * **Devanagari** (Hindi, Marathi, Nepali, Sanskrit, Bodo, Dogri, Konkani, Maithili): `"Noto Sans Devanagari"`, `"Mangal"`, `"Mukta"`
  * **Bengali & Assamese**: `"Noto Sans Bengali"`, `"Vrinda"`, `"Shonar Bangla"`
  * **Telugu**: `"Noto Sans Telugu"`, `"Gautami"`, `"Vani"`
  * **Kannada**: `"Noto Sans Kannada"`, `"Tunga"`, `"Kedage"`
  * **Malayalam**: `"Noto Sans Malayalam"`, `"Kartika"`, `"Manjari"`
  * **Gujarati**: `"Noto Sans Gujarati"`, `"Shruti"`
  * **Gurmukhi (Punjabi)**: `"Noto Sans Gurmukhi"`, `"Raavi"`
  * **Odia**: `"Noto Sans Odia"`, `"Kalinga"`
  * **Perso-Arabic (Urdu, Kashmiri, Sindhi)**: `"Noto Nastaliq Urdu"`, `"Noto Sans Arabic"`, `"Jameel Noori Nastaleeq"`, `"Urdu Typesetting"`
  * **Ol Chiki (Santali)**: `"Noto Sans Ol Chiki"`
  * **Meetei Mayek (Manipuri)**: `"Noto Sans Meetei Mayek"`
* **Zero External Network CDN Dependency**: Fonts map to native operating system Indic rendering engines or local device assets, ensuring offline-first text rendering.

---

## 4. The Remedy Safety Invariant & Unreviewed Languages

### 4.1 Agronomic Risk of Machine Translation
A small error in translating a chemical remedy can have disastrous consequences for a farmer:
* Confusing **fungicide** with **herbicide** can destroy an entire standing vegetable crop within 48 hours.
* Translating dilution ratios incorrectly (e.g. converting $2.0\text{ g/L}$ into $20\text{ g/L}$ due to decimal point or unit mistranslation) causes severe foliar burning and phytotoxicity.
* Recommending an unapproved pesticide violates the Insecticides Act, 1968 and exposes farmers to regulatory and harvest seizure penalties.

### 4.2 Architectural Safety Invariant
To prevent these harms, `src/services/i18n.ts` enforces the **Remedy Safety Guard**:
1. When any diagnosis is displayed, the system inspects the review status of the active language in `locales/status.json`.
2. If `status !== "REVIEWED"`, chemical remedy advice, pesticide trade names, and dilution instructions **CANNOT be shown in the machine-translated language**.
3. Instead, the chemical formulation is presented in verified **English**, preceded by an alert box:
   > *"This advice is shown in English until a language expert has checked the translation. Ask your extension officer if unsure."*
4. Organic and cultural practices (e.g. crop rotation, weed clearing, neem oil foliar spray) are permitted in machine-draft languages because they carry negligible phytotoxicity risk.

