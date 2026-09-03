import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import mobileAds from "react-native-google-mobile-ads";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { AdInterstitialService } from "@/services/AdInterstitialService";

function ThemedStack(): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    />
  );
}

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => AdInterstitialService.initialize())
      .catch(() => {
        // Ad SDK init failures must never block app usage.
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
