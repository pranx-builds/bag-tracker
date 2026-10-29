
# Bag Tracker

An internal app for managing Relay bags across multiple stores. Staff can track full bags collected by courier drivers and empty bags returned to stores. An admin dashboard supports management across stores.

## Features

- Track full bags collected by courier drivers
- Manage empty bag returns
- Admin dashboard with multi-store support

## Tech Stack

- React Native
- Expo
- TypeScript
- Supabase

## Getting Started

### Prerequisites

- Node.js
- npm
- An Expo account for cloud builds

### Installation

```bash
git clone https://github.com/pranx-builds/bag-tracker.git
cd bag-tracker
npm install
```

### Environment Variables

Create a `.env` file in the project root using `.env.example` as a template.

Add your Supabase project credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Keep your `.env` file private and never commit it to GitHub.

### Run in Development

Start the Expo development server:

```bash
npx expo start
```

## Android APK Build

Install the EAS CLI:

```bash
npm install -g eas-cli
```

Log in to your Expo account:

```bash
eas login
```

Configure EAS Build if it hasn't been configured already:

```bash
eas build:configure
```

Build an Android APK:

```bash
eas build --platform android --profile preview
```

The `preview` profile in `eas.json` must specify an APK build type:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Once the build finishes, download the APK using the link provided by Expo.

## Available Scripts

- `npm start` — Start the Expo development server
- `npm run android` — Run the app on Android
- `npm run ios` — Run the app on iOS
