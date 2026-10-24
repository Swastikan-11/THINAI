# THINAI Gate Architecture Change Proposal (`docs/GATE_CHANGE_PROPOSAL.md`)

**Date**: October 24, 2026  
**Status**: AWAITING OWNER APPROVAL  
**Current Gate Governance**: Gates G1 through G10 strictly adhere to their original definitions established in `READINESS_CRITERIA.md`.

---

## 1. Rationale for Proposal

In earlier development phases, additional release requirements were introduced:
- Windows Desktop Packaging (Electron/Tauri NSIS installer)
- 23-Language Multilingual & RTL Expansion (Eighth Schedule of the Constitution of India)
- Multi-Crop Coverage Expansion (Crop Registry & Packs)

To maintain absolute gate definition integrity without mutating the historical meaning of G1 through G10, we propose formalizing these as **Extended Release Dimensions (G11, G12, G13)** rather than altering G1 through G10.

---

## 2. Proposed Extended Dimensions

| Proposed ID | Name | Pass Threshold | Current Empirical Evidence |
| :---: | :--- | :--- | :--- |
| **G11** | **Desktop Packaging (Windows x64)** | Clean NSIS installer build; launches offline without remote dependency; unsigned warning transparently documented. | `dist-electron/THINAI Setup 0.0.1.exe` (179,429,818 bytes, SHA-256: `1FD5F6A056BD91FFC50897f79F7CDEC57CE36EE0051F1410311D974422A78A88`). Verified launch and offline WASM load. |
| **G12** | **Multilingual Architecture & RTL** | 23 languages bundled; native scripts; RTL layout for Urdu, Kashmiri, Sindhi; remedy safety invariant (English fallback for unreviewed languages); error report modal. | 23 locale JSON files in `locales/`; 6 tests pass in `tests/multilingual_parity.test.ts`; 2 Playwright tests pass in `e2e/multilingual_switch.spec.ts`. All 22 non-English languages marked `MACHINE-DRAFT`. |
| **G13** | **Crop Coverage Registry & Packs** | Official registry with provenance, licensing, and A/B/C status; modular pack generation; chemical remedies withheld for Status B and C. | `data/crop_registry.json` tracking 17 Indian crops; 10 tests pass in `tests/crop_coverage_phase2b.test.ts`. |

---

## 3. Owner Decision Required

- [ ] **APPROVE**: Extend readiness scorecard with G11, G12, and G13 as non-breaking dimensions.
- [ ] **REJECT**: Retain strictly G1–G10 scorecard and track Desktop / Multilingual outside the core gate matrix.
