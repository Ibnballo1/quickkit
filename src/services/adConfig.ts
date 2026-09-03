/**
 * Single source of truth for ad unit IDs. Real IDs are read from app
 * config extras so they're never hardcoded in source — swap the values
 * in eas.json / app.config.ts per build profile before release.
 * During development __DEV__ short-circuits every call site to
 * Google's published test IDs (see AdContainer and AdInterstitialService).
 */
export const AD_UNIT_IDS = {
  banner: "ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_UNIT_ID",
  interstitial: "ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_UNIT_ID",
} as const;

/** Minimum completed actions between interstitials. */
export const INTERSTITIAL_MIN_ACTIONS = 3;
/** Minimum wall-clock time between interstitials, in milliseconds. */
export const INTERSTITIAL_MIN_INTERVAL_MS = 2 * 60 * 1000;
