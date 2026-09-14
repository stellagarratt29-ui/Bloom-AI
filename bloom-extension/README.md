# Bloom Focus Mode — Chrome Extension

Blocks distracting sites (YouTube, TikTok, Instagram, Reddit, X, Facebook, Snapchat) and redirects you to Bloom.

## How to install (Chrome / Arc / Edge / Brave)

1. Open your browser and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select this `bloom-extension` folder
5. The 🌿 Bloom icon will appear in your toolbar

## How it works

- Toggle blocking ON from the popup (click the 🌿 icon)
- When you navigate to a blocked site, you're redirected to a **calm pause page** with a 10-second countdown
- After the countdown, you can still continue if you genuinely need to
- Or tap **Open Bloom** to go do the things you actually planned
- **Pause for 5 minutes** lets you temporarily allow a site without turning blocking off entirely

## Sites blocked

| Site | Reason |
|---|---|
| YouTube | Infinite scroll / autoplay |
| TikTok | Infinite scroll |
| Instagram | Infinite scroll |
| X / Twitter | Infinite scroll |
| Reddit | Infinite scroll |
| Facebook | Infinite scroll |
| Snapchat | Stories loop |

## Limitations

- This blocks sites **in the browser only** — native apps (TikTok app, YouTube app) are not affected
- To block native apps on iPhone, use **Screen Time** in Settings → Screen Time → App Limits
- To block native apps on Android, use **Digital Wellbeing** in Settings → Digital Wellbeing → Dashboard

## For Safari (iPhone / Mac)

Safari extensions use a different format. A Safari version can be built from this codebase using Xcode's "Convert Web Extension" tool — this requires a Mac with Xcode installed.
