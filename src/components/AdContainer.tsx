import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { useTheme } from "@/theme/ThemeProvider";
import { AD_UNIT_IDS } from "@/services/adConfig";

interface AdContainerProps {
  placement: "result-bottom" | "history-inline";
}

/**
 * Reserves a fixed-height slot so surrounding content never jumps when the
 * ad loads, fails, or is absent (e.g. no network). Never place this inside
 * a scroll view directly above an interactive input — see placement rules
 * in adConfig.ts.
 */
export function AdContainer({
  placement,
}: AdContainerProps): React.JSX.Element | null {
  const { colors, spacing } = useTheme();
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Fail closed and silent — a broken ad slot must never show an error
    // state or blank flash to the user.
    return null;
  }

  const unitId = __DEV__ ? TestIds.BANNER : AD_UNIT_IDS.banner;

  return (
    <View
      style={[
        styles.wrap,
        { marginTop: spacing.md, backgroundColor: colors.background },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
});
