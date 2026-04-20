# How to Build the APK

## Prerequisites

Install these once on your machine:

1. **Node.js** (v18+): https://nodejs.org
2. **Git**: https://git-scm.com
3. **Java JDK 17**: https://adoptium.net (required for local Android builds)
4. **Android Studio**: https://developer.android.com/studio
   - After installing, open Android Studio → SDK Manager → Install **Android SDK Platform 34**
   - Also install **Android Build Tools 34**

---

## Option A — Cloud Build via EAS (Easiest, no Android Studio needed)

EAS (Expo Application Services) builds the APK on Expo's servers. You just download the result.

### Step 1 — Set up

```bash
npm install -g eas-cli
eas login        # create a free Expo account at expo.dev if needed
```

### Step 2 — Install dependencies

```bash
cd bag-tracker
npm install
```

### Step 3 — Configure EAS

```bash
eas build:configure
```

This creates an `eas.json`. When prompted, choose **Android**.

### Step 4 — Build APK (not AAB)

```bash
eas build --platform android --profile preview
```

When asked, choose **APK** (not AAB) — APK installs directly without Play Store.

This takes ~5–10 minutes. You'll get a download link when done.

---

## Option B — Local Build (No internet dependency after setup)

### Step 1 — Install dependencies

```bash
cd bag-tracker
npm install
```

### Step 2 — Generate native Android project

```bash
npx expo prebuild --platform android
```

This creates an `android/` folder.

### Step 3 — Build debug APK

```bash
cd android
./gradlew assembleDebug
```

Your APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 4 — Install on your phone

Enable **USB Debugging** on your Android phone (Settings → Developer Options → USB Debugging), connect via USB, then:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or simply copy the APK file to your phone and open it.

---

## Option C — Build Release APK (signed, for distribution)

```bash
cd android
./gradlew assembleRelease
```

For a release build you need a keystore. Generate one:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore bag-tracker.keystore -alias bag-tracker \
  -keyalg RSA -keysize 2048 -validity 10000
```

Then configure signing in `android/app/build.gradle`.

---

## Quick Start (Recommended for first time)

```bash
cd bag-tracker
npm install
npx expo start
```

Scan the QR code with **Expo Go** app on your phone to test instantly — no build needed.

---

## Troubleshooting

- **`SDK not found`**: Open Android Studio → SDK Manager → install Platform 34
- **`JAVA_HOME not set`**: Set it to your JDK 17 path in your shell profile
- **`gradlew permission denied`**: Run `chmod +x android/gradlew`
- **`adb not found`**: Add `platform-tools` from Android SDK to your PATH
