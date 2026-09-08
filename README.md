# QuickKit — Everyday tools that just work.

Android-first Expo/React Native utility app. This README is the living record of
the Phase 0 research and the Phase 1 (project setup) deliverables. See "Status"
at the bottom for what's built vs. still pending.

## Phase 0 — Compatibility Table

Verified against Expo's own SDK/RN/React compatibility matrix as of the SDK 57
release (June 30, 2026). Do not hand-pin these versions in a real checkout —
run `npx create-expo-app` at the target SDK, then `npx expo install <pkg>` for
every dependency below, so Expo resolves the exact patch versions that are
mutually compatible for that SDK. The versions in `package.json` are a
snapshot for reference, not a guarantee of the latest patch.

| Concern            | Selection                                                                                            | Notes                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo SDK           | **57** (RN 0.86, React 19.2.3)                                                                       | Small, non-breaking release over SDK 56; fixes a Hermes V1 memory regression present in 56. If you need a longer track record before committing, SDK 56 (RN 0.85) is the fallback — same React version, one RN minor behind. |
| Node.js            | ≥ 22.13.x                                                                                            | Required minimum for SDK 57.                                                                                                                                                                                                 |
| TypeScript         | ^6.0.3                                                                                               | Matches Expo's bundled TS baseline since SDK 56.                                                                                                                                                                             |
| Navigation         | **Expo Router** (file-based, wraps React Navigation)                                                 | Chosen over bare React Navigation for convention-driven routing, deep-linking, and less boilerplate across ~10 screens.                                                                                                      |
| Image picking      | `expo-image-picker`                                                                                  | Scoped-storage compliant on Android; no legacy storage permissions needed.                                                                                                                                                   |
| Image manipulation | `expo-image-manipulator`                                                                             | Local resize/compress/format conversion, no native module authoring required.                                                                                                                                                |
| File I/O & sharing | `expo-file-system`, `expo-sharing`, `expo-media-library`                                             | Read compressed output size, native share sheet, save to gallery.                                                                                                                                                            |
| Camera / QR        | `expo-camera` (`CameraView` with `barcodeScannerSettings`)                                           | Actively maintained first-party scanner; avoids a second camera library.                                                                                                                                                     |
| QR generation      | `react-native-qrcode-svg` (+ `react-native-svg`, already an Expo Router/Router-ecosystem dependency) | Renders QR entirely on-device as SVG; no network round-trip to a QR image API (privacy requirement).                                                                                                                         |
| Ads                | `react-native-google-mobile-ads`                                                                     | The only maintained AdMob binding for Expo; requires a Development Build (see below), not Expo Go.                                                                                                                           |
| Local storage      | `@react-native-async-storage/async-storage`                                                          | Sufficient for settings + capped history list (≤200 entries); no SQLite needed for MVP scope.                                                                                                                                |
| Dates              | `date-fns`                                                                                           | Tree-shakeable, avoids Moment's bundle cost; used for age/date-diff leap-year-correct math.                                                                                                                                  |

### Why a Development Build, not Expo Go

`react-native-google-mobile-ads` ships native Android/iOS code. Expo Go cannot
load custom native modules, so this project **must** run via
`npx expo run:android` (or an EAS development build) from day one, even before
ads are wired up, so the native module set never has to be retrofitted later.

## Project Structure

```
quickkit/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout: theme, safe area, gesture handler, AdMob init
│   ├── index.tsx               # Home — tool grid
│   ├── image/                  # (Phase 3) compress.tsx, resize.tsx
│   ├── calculators/            # (Phase 3) percentage.tsx, discount.tsx
│   ├── converter/              # (Phase 3) index.tsx + category screens
│   ├── date/                   # (Phase 3) age.tsx, difference.tsx
│   ├── qr/                     # (Phase 3) scan.tsx, generate.tsx
│   ├── history.tsx             # (Phase 3)
│   └── settings.tsx            # (Phase 3)
├── src/
│   ├── components/             # Design-system components (built in Phase 1)
│   │   ├── AppHeader.tsx
│   │   ├── ToolCard.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── InputField.tsx
│   │   ├── ResultCard.tsx
│   │   ├── ToolScreenLayout.tsx
│   │   └── AdContainer.tsx
│   ├── theme/                  # Design tokens (built in Phase 1)
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── ThemeProvider.tsx
│   ├── services/                # Cross-cutting services (storage, ads)
│   │   ├── settingsStorage.ts
│   │   ├── historyStorage.ts
│   │   ├── adConfig.ts
│   │   └── AdInterstitialService.ts
│   ├── features/                # Business logic per module (Phase 3)
│   │   ├── image-tools/
│   │   ├── calculators/
│   │   ├── unit-converter/
│   │   ├── date-tools/
│   │   └── qr-tools/
│   ├── types/                    # Shared domain types (Phase 3)
│   └── utils/                    # Pure helpers (Phase 3)
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Design System Conventions

- **Never** reference a raw hex color or literal font size in a screen or
  feature component — always pull from `useTheme()`.
- Every screen body is wrapped in `ToolScreenLayout`, which owns the header,
  scroll behavior, keyboard avoidance, and the bottom ad slot. This is what
  makes the "banners only on non-interactive result screens" rule structural
  rather than a convention someone can forget.
- `AdInterstitialService.recordCompletedAction()` is called exactly once per
  genuinely completed user action (e.g. after a successful share/save), never
  on intermediate state changes — this is what the internal frequency
  cap (`≥3 actions` AND `≥2 minutes` since last impression) is enforced
  against.

## Status

- [x] **Phase 0** — Compatibility research, package selection, rationale.
- [x] **Phase 1** — Directory structure, design tokens, theme provider,
      settings/history storage, core components (`AppHeader`, `ToolCard`,
      `PrimaryButton`, `InputField`, `ResultCard`, `ToolScreenLayout`,
      `AdContainer`), root layout, home screen.
- [x] **Phase 2a** — Image Compressor & Resizer: `imagePickerService.ts`,
      `imageCompression.ts` (bounded binary search over JPEG quality to hit
      a size target, entirely on-device), `resizeImage.ts` (percentage or
      exact dimensions, aspect-ratio-preserving), `saveShareService.ts`
      (gallery save + native share sheet), `ChipGroup` component, and the
      `app/image/compress.tsx` / `app/image/resize.tsx` screens.
- [x] **Phase 2b** — Percentage/Discount calculators, Unit Converter
      (8 categories, strongly typed, linear + affine temperature engine),
      Age/Date-Difference tools (calendar-correct, leap-year-safe), and
      QR Scanner/Generator (on-device parsing and generation, no network
      round-trip).
- [x] **Phase 2c** — History screen (filterable by tool type, per-entry and
      bulk delete, reloads on focus since entries are written from other
      screens) and Settings screen (theme toggle, clear all history, privacy
      info and about modals, app version). Calculators/converter/date tools
      now log to history too, via a debounced logger so live-recomputed
      results don't spam an entry per keystroke. Home screen got history/
      settings icons since nothing linked to them before.

## Version 1.1 — Image Toolkit + Share-Ready Workflows

- [x] **V1.1-A — Image Cropper** — `src/features/image-tools/imageCrop.ts`
      (pure crop logic, reuses `expo-image-manipulator`'s existing `crop`
      action), `src/components/CropOverlay.tsx` (interactive draggable/
      resizable crop box, built entirely on core React Native
      `PanResponder` + `Animated` — no Reanimated, no new dependency of
      any kind), `app/image/crop.tsx` (pick → adjust → preview → save/
      share, matching the existing compress/resize screen pattern). Free
      crop plus 5 aspect-ratio presets (1:1, 4:3, 16:9, 4:5, 9:16).
      `HistoryKind` extended with `'image_edit'` (additive change,
      existing kinds untouched). One new home-screen card added for Crop;
      no existing tool/screen behavior was modified.
- [ ] V1.1-B — Image Format Converter (not started, awaiting approval)
- [ ] V1.1-C — Image → PDF (not started — will need `expo-print`, a new
      native dependency, and a rebuild)
- [ ] V1.1-D — Share-Ready Presets (fold into `compress.tsx`)
- [ ] V1.1-E — "Make It Smaller" home-screen quick action
- [ ] V1.1-F — Improved result-card details on compress/resize

## Native Build Notes (hard-won)

If you're setting this project up fresh, these are the real gotchas
encountered getting a local (non-EAS) Android build working:

- **Package manager**: use npm, not pnpm, unless you configure
  `node-linker=hoisted` in `.npmrc`. pnpm's default symlinked
  `node_modules` structure breaks Expo's autolinking scripts.
- **Node**: 22.13+ required by SDK 57; also required for
  `expo/scripts/resolveAppEntry` (see entry point note below) to resolve
  correctly.
- **Entry point**: `package.json` `"main"` must be `"index.ts"`, and
  `index.ts` at the project root must contain exactly
  `import 'expo-router/entry';`. A leftover template `App.tsx` at the
  root is not used by Expo Router but can indicate main is misconfigured
  if you see its boilerplate content at runtime.
- **NDK**: verify `C:\Android\sdk\ndk\<version>\source.properties` exists;
  a corrupted/partial NDK install (missing this file) fails Gradle
  configuration with a `CXX1101` error unrelated to any project code.
- **Kotlin version**: `react-native-google-mobile-ads`'s bundled
  `play-services-ads` AAR may be compiled with a newer Kotlin than Expo
  SDK 57's default (2.1.20). Fixed via `expo-build-properties`'
  `android.kotlinVersion` override — requires `npx expo prebuild --clean`
  to take effect, and a full `gradlew --stop` + deleted
  `~/.gradle/caches/*/transforms` if the old error persists after
  bumping the version (stale artifact-transform cache).
- **JDK**: JDK 24+ triggers a JEP 472 restricted-method warning that some
  native CMake configure tasks (`react-native-worklets`,
  `react-native-screens`) treat as fatal. Use JDK 17 for Gradle builds.
- **`expo-file-system`**: SDK 54+ deprecated `getInfoAsync`/
  `writeAsStringAsync` etc. on the main entrypoint. Import from
  `expo-file-system/legacy` instead — same API, no deprecation warning
  (and avoids a reported case where the warning surfaces as a runtime
  error rather than just console noise).
- [ ] **Phase 3** — `AdInterstitialService` wired into real completion events
      per screen; end-to-end local persistence; permission-denial UX;
      production readiness pass (error boundaries, accessibility audit,
      performance pass on image compression for large files).

Say the word and I'll move on to Phase 2 for a specific module (image tools is
the hero feature, so that's the natural next stop) — or all of them in
sequence if you'd rather I just keep going.
