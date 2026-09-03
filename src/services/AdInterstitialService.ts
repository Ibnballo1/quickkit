import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import {
  AD_UNIT_IDS,
  INTERSTITIAL_MIN_ACTIONS,
  INTERSTITIAL_MIN_INTERVAL_MS,
} from "./adConfig";

const unitId = __DEV__ ? TestIds.INTERSTITIAL : AD_UNIT_IDS.interstitial;

/**
 * Frequency-capped interstitial gate.
 *
 * Rules (see PRD §4 — never relax these without a product decision):
 *  - Never on app launch.
 *  - Never while the user is actively typing/selecting (call sites must
 *    only invoke recordCompletedAction/maybeShow after a task truly ends,
 *    e.g. after a share/save, not on every keystroke).
 *  - At most one interstitial per 3 completed actions AND at least
 *    2 minutes since the last impression, both conditions required.
 */
class AdInterstitialServiceImpl {
  private ad: InterstitialAd | null = null;
  private isLoaded = false;
  private completedActionsSinceLastAd = 0;
  private lastShownAt = 0;

  private load(): void {
    this.ad = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    this.isLoaded = false;

    const unsubscribeLoaded = this.ad.addAdEventListener(
      AdEventType.LOADED,
      () => {
        this.isLoaded = true;
      },
    );
    const unsubscribeClosed = this.ad.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        this.isLoaded = false;
        unsubscribeLoaded();
        unsubscribeClosed();
        // Pre-load the next one so it's ready well before it's next eligible.
        this.load();
      },
    );

    this.ad.load();
  }

  /** Call once, e.g. from the root layout, to warm the first ad. */
  initialize(): void {
    if (!this.ad) {
      this.load();
    }
  }

  /** Call after a user genuinely finishes a task (save, share, scan complete). */
  recordCompletedAction(): void {
    this.completedActionsSinceLastAd += 1;
    void this.maybeShow();
  }

  private async maybeShow(): Promise<void> {
    const enoughActions =
      this.completedActionsSinceLastAd >= INTERSTITIAL_MIN_ACTIONS;
    const enoughTime =
      Date.now() - this.lastShownAt >= INTERSTITIAL_MIN_INTERVAL_MS;

    if (!enoughActions || !enoughTime || !this.isLoaded || !this.ad) {
      return;
    }

    try {
      await this.ad.show();
      this.lastShownAt = Date.now();
      this.completedActionsSinceLastAd = 0;
    } catch {
      // Ad failed to present — leave counters untouched so we retry
      // once a fresh ad loads, rather than silently resetting the cap.
    }
  }
}

export const AdInterstitialService = new AdInterstitialServiceImpl();
