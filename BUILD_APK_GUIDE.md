# THINAI — Build a Real, Installable .apk

There are now **two ways** to build the APK from this package. If you can't
install Android Studio locally, use **Method A** — it needs nothing but a web
browser and a free GitHub account. Method B is for if you do have Android
Studio available.

This package already contains everything pre-built and verified:
- `dist/` — your compiled, production-ready web app (built with 0 errors)
- `android/` — a **complete, ready-to-build native Android project** (already generated)
- `.github/workflows/build-apk.yml` — an automated cloud build script (Method A uses this)
- `src/`, `index.html`, etc. — original project source
- `capacitor.config.json`, `package.json` — fully configured, Capacitor already added

---

## Method A — Build in the cloud with GitHub Actions (no installs, browser only)

This is the recommended path if you can't run local build tools. GitHub's
servers do the actual compiling for free; you just upload and download.

### A1. Create a free GitHub account
Go to https://github.com/signup if you don't already have one.

### A2. Create a new repository
1. Go to https://github.com/new
2. Name it `thinai-app` (or anything you like)
3. Set it to **Public** or **Private** — either works
4. **Do not** check "Add a README" — leave it empty
5. Click **Create repository**

### A3. Upload this entire project folder
On the new repo's page:
1. Click **uploading an existing file** (link shown on the empty repo page)
2. Open the extracted `THINAI` folder on your computer in File Explorer
3. Select **all files and folders inside it** (including the hidden `.github`
   folder — if you don't see it, enable "Show hidden items" in File Explorer's
   View tab first) and drag them into the GitHub upload box
4. Scroll down, click **Commit changes**

   > If GitHub's web uploader rejects the upload for being too large or too
   > many files at once, upload in two batches: first everything except the
   > `android` folder, commit, then upload the `android` folder separately
   > and commit again.

### A4. Watch the build run automatically
1. Click the **Actions** tab at the top of your repo
2. You'll see a workflow run called "Build Android APK" already running
   (it starts automatically on upload) — click it
3. Wait for the green checkmark (usually 3–6 minutes)

### A5. Download your APK
1. Once finished, scroll to the bottom of that workflow run page
2. Under **Artifacts**, click **THINAI-app-debug-apk** to download a zip
3. Unzip it — inside is `app-debug.apk`
4. Transfer it to your phone (email it to yourself, Google Drive, USB, etc.)
   and tap to install (enable "install from unknown sources" if prompted)

**That's it — no local tools, no Android Studio, no command line needed.**

> Note: this produces a **debug-signed APK**, perfect for installing and using
> on your own phone. If you ever want to publish to the Play Store, you'd
> need a release-signed version (see Method B, Step 6) — but for personal use,
> demos, or sharing with others to sideload, the debug APK works fully.

---

## Method B — Build locally with Android Studio

Your project **builds with zero errors** (verified: `npm run build` → 0 errors,
output in `dist/`).

Follow the steps below **in order**. Estimated time: 20–30 minutes (mostly Gradle
downloading the SDK on first run).

---

## Prerequisites (install once)

| Tool | Why | Link |
|---|---|---|
| Node.js 18+ | Runs npm/Vite | https://nodejs.org |
| Android Studio (latest) | Builds + signs the APK | https://developer.android.com/studio |
| JDK 17 (bundled with Android Studio) | Required by Gradle | included |

Android Studio will prompt you to install the Android SDK on first launch —
accept the defaults.

---

## Step 1 — Unzip and install dependencies

```bash
unzip THINAI_APK_Build_Package.zip -d thinai
cd thinai
npm install
```

## Step 2 — Rebuild the web app (safe to re-run, already done once for you)

```bash
npm run build
```

You should see:
```
✓ built in ~11s
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
```
**Zero errors expected.** If you see errors here, stop and check Node version
(`node -v`, needs 18+).

## Step 3 — Sync your web build into the native project (already generated for you)

The `android/` folder is already included in this package — you don't need
to run `npx cap add android`. Just sync your build into it:

```bash
npx cap sync android
```

Run this **every time** you change the web app and rebuild.

## Step 4 — Open in Android Studio

```bash
npx cap open android
```

This launches Android Studio with the project already open. Let Gradle finish
its first sync (progress bar at the bottom) — this downloads build tools and
can take 5–15 minutes on first run.

## Step 5 — Run a quick test (optional but recommended)

Plug in an Android phone (USB debugging enabled) or use an emulator, then click
the green **Run ▶** button in Android Studio. Confirm the app launches and the
THINAI screens (splash → onboarding → login → home) work correctly.

## Step 6 — Generate the signed, installable APK

In Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. Choose **APK** → Next
3. Click **Create new...** under Key store path:
   - Choose a save location for your keystore file (e.g. `thinai-release-key.jks`)
   - Set a strong password, alias, and validity (e.g. 25 years)
   - **Save this keystore file and password somewhere safe** — you need the
     *same* keystore to release future updates to this app.
4. Next → select **release** build variant → check **V1 + V2 signature**
5. Click **Finish**

Android Studio will build the signed APK. When done, click the **locate**
link in the notification, or find it at:

```
android/app/release/app-release.apk
```

## Step 7 — Install on your phone

Copy `app-release.apk` to your phone and tap it to install (enable
"install from unknown sources" if prompted), or run:

```bash
adb install android/app/release/app-release.apk
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npx cap sync android` fails: "config not found" | Make sure you're in the `thinai/` folder (where `capacitor.config.json` lives) |
| Gradle sync fails / SDK not found | In Android Studio: File → Settings → Appearance & Behavior → System Settings → Android SDK, install SDK Platform matching `compileSdkVersion` (Capacitor defaults to recent stable, usually fine) |
| Blank white screen on app launch | Confirm `npm run build` ran *before* `npx cap sync android` — Capacitor copies `dist/` at sync time, not live |
| "App not installed" on phone | Uninstall any previous debug-signed version first; debug and release builds use different signatures and can't overwrite each other |
| Want a custom app icon | Replace files in `android/app/src/main/res/mipmap-*/` after Step 3, or use Android Studio's Image Asset Studio (right-click `res` → New → Image Asset) |

---

## Notes on this specific app

- This is a fully self-contained front-end demo (login, crop advisory, weather,
  disease detection UI, AI chat, reports, profile, settings) using **demo data**
  — there is no backend/API wired in, so the APK will work fully offline with
  the same demo content you saw in the browser preview.
- App ID is set to `com.thinai.agriapp` in `capacitor.config.json` — change this
  before publishing if you want a different package name (must be unique on
  the Play Store if you ever publish).
