@AGENTS.md

# Bloom-AI — Claude Code Guide

## Project Overview

Bloom is a React Native/Expo task management app with a calming, nature-inspired aesthetic. It features a single home screen with a task list, priority selection, and motivational "Gentle Nudge" messaging. Currently a client-side prototype with no persistence or backend.

## Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Framework | Expo (managed workflow) | ~56.0.12 |
| UI | React Native | 0.85.3 |
| Language | JavaScript (no TypeScript) | — |
| React | React | 19.2.3 |
| Status bar | expo-status-bar | ~56.0.4 |

**Always consult the versioned Expo docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo-related code.** APIs change between Expo versions and outdated patterns will break.

## Repository Structure

```
Bloom-AI/
├── App.js              # Entire application — all components, styles, constants
├── index.js            # Entry point — registers App via registerRootComponent
├── app.json            # Expo config (name, bundle IDs, icons, orientation)
├── package.json        # Dependencies and npm scripts
├── assets/             # App icons, adaptive icons, splash, favicon
├── CLAUDE.md           # This file
├── AGENTS.md           # Expo version reminder
└── .claude/
    └── settings.json   # Enables the Expo Claude plugin
```

There is currently **no `src/` directory**, no component folder, no navigation, no tests, and no linting config. Everything lives in `App.js`.

## Running the App

```bash
npm start          # Expo dev server (scan QR with Expo Go)
npm run android    # Launch on Android emulator/device
npm run ios        # Launch on iOS simulator/device
npm run web        # Launch in browser
```

Expo Go (mobile app) is the fastest way to preview changes during development.

## Architecture

### Single-file design

`App.js` contains everything in this order:
1. Imports
2. `C` — color palette constant
3. `PRIORITY` — priority config object
4. `NUDGES` — motivational messages array
5. `greeting()` — time-based greeting helper
6. `makeTask()` — task object factory
7. `TaskRow` — sub-component for individual tasks
8. `App` — main component (default export)
9. `styles` — StyleSheet at the bottom of the file

When adding new features, follow this same top-to-bottom ordering: constants → helpers → sub-components → main component → styles.

### State

All state lives in the `App` component using React hooks — no external state management:

```js
const [tasks, setTasks] = useState([...])     // task list
const [inputText, setInputText] = useState('') // text input value
const [priority, setPriority] = useState('medium') // selected priority
const [nudge] = useState(() => NUDGES[...])   // random nudge, stable after mount
const inputRef = useRef(null)                  // keyboard blur control
```

Task IDs use a module-level counter (`let _id = 1`) incremented inside `makeTask()`. This resets on app reload — fine for the current prototype but must be replaced before adding persistence.

### Task shape

```js
{ id: number, text: string, priority: 'high' | 'medium' | 'low', done: boolean }
```

## Key Conventions

### Color palette (`C`)

All colors come from the `C` object — never use raw hex values in JSX or styles. Extend `C` when adding new colors.

```js
C.cream      // #FAF8F4 — background
C.forest     // #2D4A35 — primary text
C.sage       // #7B9E87 — primary accent (green)
C.sageMid    // #A8C5A0
C.sageLight  // #D6E8D4
C.sagePale   // #EBF4E9
C.peach      // #C8795E — secondary accent (warm/alert)
C.peachMid   // #E4A892
C.peachLight // #F2D4C8
C.peachPale  // #FBF0EB — nudge card background
C.muted      // #8A9B8C — secondary text
C.border     // #E5DED6 — borders
C.white      // #FFFFFF
```

### Priority config (`PRIORITY`)

Drives all priority UI (badges, chips, active states). Each entry has `label`, `text` (color), and `bg` (background color):

```js
PRIORITY.high   = { label: 'High',   text: C.peach, bg: C.peachLight }
PRIORITY.medium = { label: 'Medium', text: C.sage,  bg: C.sageLight }
PRIORITY.low    = { label: 'Low',    text: C.muted, bg: '#EDEBE7' }
```

### Styling

- All styles use `StyleSheet.create()` at the bottom of the file — no inline style objects except for dynamic values (colors, conditional states).
- Dynamic style values (e.g., active priority chip color) are applied as inline array items alongside static style keys: `style={[styles.chip, { backgroundColor: cfg.bg }]}`.
- Use `gap` for spacing between flex children (React Native 0.71+ supports it natively).
- Shadows: use both `shadowColor/Offset/Opacity/Radius` (iOS) and `elevation` (Android) together.
- Disabled states: use `opacity: 0.35` on the button style, paired with the `disabled` prop on `TouchableOpacity`.

### Interactive elements

Use `TouchableOpacity` with `activeOpacity={0.7}` for all tappable elements. Never use `Pressable` or `TouchableHighlight` unless there's a specific reason.

### Keyboard handling

- `KeyboardAvoidingView` wraps the entire screen with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.
- `ScrollView` uses `keyboardShouldPersistTaps="handled"` so tapping outside the keyboard dismisses it correctly.
- Use `inputRef.current?.blur()` (not `Keyboard.dismiss()`) after submit.

## Expo Configuration (`app.json`)

```
name:           "Bloom"
slug:           "bloom-ai"
orientation:    portrait only
bundle ID (iOS/Android): com.bloom.app
userInterfaceStyle: light (dark mode not supported yet)
splash bg:      #FAF8F4 (matches C.cream)
```

Keep `orientation: portrait` and `userInterfaceStyle: light` unless explicitly changing these features.

## What Doesn't Exist Yet

These are known gaps — do not add them without being asked:

- **No persistence** — tasks reset on every app reload (no AsyncStorage, SQLite, or backend)
- **No navigation** — single screen only (no React Navigation or Expo Router)
- **No TypeScript** — plain JavaScript throughout
- **No tests** — no Jest setup, no test files
- **No linting** — no ESLint or Prettier config
- **No authentication** — no user accounts
- **No backend/API** — entirely client-side

## Adding New Features

When adding screens or navigation, use **Expo Router** (file-based routing, built into Expo SDK 50+) rather than React Navigation directly. See https://docs.expo.dev/versions/v56.0.0/sdk/router/ for setup.

When adding persistence, use **Expo SecureStore** for sensitive values or **AsyncStorage** (`@react-native-async-storage/async-storage`) for task data. Replace the module-level `_id` counter with a persistent UUID strategy (e.g., `expo-crypto` `randomUUID()`).

When adding new packages, check the Expo SDK 56 compatibility list at https://docs.expo.dev/versions/v56.0.0/ first to confirm the package version is compatible.

## Git

Two commits on `main`:
1. `4573fc5` — add Claude Code project settings
2. `769dcac` — build Bloom home screen with task manager and gentle nudge

Feature branches follow the `claude/<description>` convention.
