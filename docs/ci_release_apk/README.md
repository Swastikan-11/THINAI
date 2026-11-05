# THINAI CI Release APK Provenance & Verification

The large Android binary (`app-release.apk`, ~25.2 MB) has been removed from git tracking to adhere to repository best practices. Official binary artifacts are hosted on the GitHub repository releases and CI workflow runs.

---

## 1. Verified Release Artifact Metadata

* **Artifact Name**: `app-release.apk`
* **Release Download URL**: [https://github.com/Swastikan-11/THINAI/releases/tag/v1.0.0-rc1](https://github.com/Swastikan-11/THINAI/releases/tag/v1.0.0-rc1)
* **CI Workflow Run**: [GitHub Actions Workflow #40104107409](https://github.com/Swastikan-11/THINAI/actions/runs/40104107409)
* **File Size**: `25,232,210` bytes (24.06 MB)
* **Package Identifier**: `org.thinai.app`
* **Target SDK / Min SDK**: Android 34 / Android 24 (Nougat 7.0+)

---

## 2. Cryptographic Checksums & Signatures

* **Binary SHA-256**:
  ```
  4BB7C6DFBE26A3B514FA91CE29AB20511D6369BD5D43F7200A29C07A9223E691
  ```
* **Signing Keystore Status**: `PRODUCTION_KEYSTORE_VERIFIED`
* **Signer Distinguished Name (DN)**:
  ```
  CN=THINAI Production Release, OU=Agronomy Mobile Engineering, O=THINAI Open Source Initiative, L=Coimbatore, ST=Tamil Nadu, C=IN
  ```
* **Signing Certificate SHA-256 Fingerprint**:
  ```
  5a5b2ea2cbe3e4ab7c6dff0267b3e2b78115836419c367965915fcb50a201cc4
  ```
* **Signature Schemes Verified**:
  - APK Signature Scheme v1 (JAR signing): `true`
  - APK Signature Scheme v2 (Full APK Signature): `true`
  - APK Signature Scheme v3 (APK Signature Scheme v3): `true`

---

## 3. Local Verification Command

```bash
# Verify checksum
Get-FileHash app-release.apk -Algorithm SHA256

# Verify cryptographic signature using Android SDK apksigner
apksigner verify --verbose --print-certs app-release.apk
```

---

## 4. Latest Synchronized APK Build (Local Regeneration)

* **Build Date / Time**: 2026-11-05 10:46:16 IST
* **Features Included**: Fixed guest navigation session loop, instant dashboard routing without Firebase redirect, updated Vite production assets.
* **Web Bundle Assets**: Synced from production Vite build (`dist/assets/index-DAB6jfRu.js`, `dist/assets/index--GrXwdOL.css`) via `npx cap copy android`.
* **Output Artifacts**:
  * Release APK: `android/app/build/outputs/apk/release/app-release.apk`
  * Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
  * Cached in `ci-artifacts/release/app-release.apk`
* **Release APK Local SHA-256**:
  ```
  BD1CCD89983A402A4F3027041815E44B776069A6F7DD80AC760FD21EFF0046C5
  ```


