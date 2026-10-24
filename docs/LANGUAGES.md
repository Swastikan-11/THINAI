# THINAI Multilingual Architecture & Translation Registry (`docs/LANGUAGES.md`)

**Specification Version**: 1.0.0-rc  
**Last Updated**: October 2026  
**Default Language**: English (`en`)  
**Scope**: English plus the 22 Scheduled Languages of India (Eighth Schedule of the Constitution of India).

---

## 1. 23-Language Registry & Review Status

Remedy safety rule: **Chemical remedies, product trade names, dosage rates, and spray intervals appear ONLY in languages with status `REVIEWED` by a named expert.** In all languages marked `MACHINE-DRAFT`, remedy advice is presented in English accompanied by the mandatory safety warning notice:  
> *"This advice is shown in English until a language expert has checked the translation. Ask your extension officer if unsure."*

| Language Code | English Name | Native Name | Script Family | Layout Direction | Review Status | Reviewer Name | Review Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `en` | **English (Default)** | English | Latin | LTR | **REVIEWED** | Dr. K. Ramanathan (TNAU Agronomy) | 2026-10-01 |
| `ta` | **Tamil** | தமிழ் (Tamil) | Tamil | LTR | **MACHINE-DRAFT** | *Pending Native Agronomic Review Board Approval* | *Unreviewed* |
| `hi` | **Hindi** | हिन्दी (Hindi) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `as` | **Assamese** | অসমীয়া (Assamese) | Bengali-Assamese | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `bn` | **Bengali** | বাংলা (Bengali) | Bengali | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `brx` | **Bodo** | बर' (Bodo) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `doi` | **Dogri** | डोगरी (Dogri) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `gu` | **Gujarati** | ગુજરાતી (Gujarati) | Gujarati | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `kn` | **Kannada** | ಕನ್ನಡ (Kannada) | Kannada | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `ks` | **Kashmiri** | کٲشُر (Kashmiri) | Perso-Arabic | **RTL** | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `kok` | **Konkani** | कोंकणी (Konkani) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `mai` | **Maithili** | मैथिली (Maithili) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `ml` | **Malayalam** | മലയാളം (Malayalam) | Malayalam | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `mni` | **Manipuri** | মৈতৈলোন্ (Manipuri) | Bengali | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `mr` | **Marathi** | मराठी (Marathi) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `ne` | **Nepali** | नेपाली (Nepali) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `or` | **Odia** | ଓଡ଼ିଆ (Odia) | Odia | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `pa` | **Punjabi** | ਪੰਜਾਬੀ (Punjabi) | Gurmukhi | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `sa` | **Sanskrit** | संस्कृतम् (Sanskrit) | Devanagari | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `sat` | **Santali** | ᱥᱟᱱᱛᱟᱲᱤ (Santali) | Ol Chiki | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `sd` | **Sindhi** | سنڌي (Sindhi) | Perso-Arabic | **RTL** | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `te` | **Telugu** | తెలుగు (Telugu) | Telugu | LTR | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |
| `ur` | **Urdu** | اُردُو (Urdu) | Perso-Arabic | **RTL** | **MACHINE-DRAFT** | *Pending Expert Board* | *Unreviewed* |

---

## 2. Right-to-Left (RTL) Layout Specification

Urdu (`ur`), Kashmiri (`ks`), and Sindhi (`sd`) utilize Perso-Arabic scripts written right-to-left. THINAI handles RTL layout natively:
1. Dynamic attribute assignment: `document.documentElement.setAttribute("dir", "rtl")` and `setAttribute("lang", code)`.
2. CSS mirroring rules defined in `public/fonts/fonts.css` ensure margins, paddings, icon placements, and text alignments reverse seamlessly without breaking card geometry.
3. Form controls, buttons, and drawer handles flip symmetrically for natural right-hand thumb reach on mobile devices.

---

## 3. Typography & Offline Font Stacks

To eliminate tofu character artifacts (`□` or `\uFFFD`) in rural offline contexts, `public/fonts/fonts.css` defines system-native font stacks with open-source Google Noto Sans / Serif fallbacks for all 12 major Indian script families:
- **Devanagari**: Noto Sans Devanagari, Mangal, Nirmala UI, sans-serif
- **Tamil**: Noto Sans Tamil, Latha, Vijaya, sans-serif
- **Telugu**: Noto Sans Telugu, Gautami, sans-serif
- **Kannada**: Noto Sans Kannada, Tunga, sans-serif
- **Malayalam**: Noto Sans Malayalam, Kartika, sans-serif
- **Bengali & Assamese**: Noto Sans Bengali, Vrinda, Shonar Bangla, sans-serif
- **Gujarati**: Noto Sans Gujarati, Shruti, sans-serif
- **Gurmukhi (Punjabi)**: Noto Sans Gurmukhi, Raavi, sans-serif
- **Odia**: Noto Sans Odia, Kalinga, sans-serif
- **Ol Chiki (Santali)**: Noto Sans Ol Chiki, sans-serif
- **Perso-Arabic (Urdu, Kashmiri, Sindhi)**: Noto Nastaliq Urdu, Noto Sans Arabic, Arial, sans-serif

All font stacks are licensed under the **SIL Open Font License 1.1 (OFL 1.1)**.

---

## 4. How to Contribute Translations

### Step 1: Clone and Locate Locale Files
All language dictionaries reside under the `locales/` directory:
- Reference English file: `locales/en.json`
- Target language file: `locales/<lang_code>.json`
- Status tracker: `locales/status.json`

### Step 2: Translation Contribution Workflow
1. Fork repository and create a branch `i18n/<lang_code>-review`.
2. Edit `locales/<lang_code>.json`. Preserve all JSON keys and parameter placeholders exactly (e.g. `{{name}}`, `{{count}}`).
3. Maintain agricultural glossary consistency using terms defined in `locales/glossary.json` (ICAR/TNAU standard definitions).
4. Run validation tests:
   ```bash
   npx vitest run tests/multilingual_parity.test.ts
   npx playwright test e2e/multilingual_switch.spec.ts
   ```
5. Submit Pull Request with the reviewer's qualifications (accredited agronomist, native speaker, university affiliation).
6. Upon board approval, update `locales/status.json` from `MACHINE-DRAFT` to `REVIEWED` with the reviewer's name and review date.
