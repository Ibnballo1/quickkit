import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AppHeader } from "./AppHeader";
import { AdContainer } from "./AdContainer";
import { useTheme } from "@/theme/ThemeProvider";

interface ToolScreenLayoutProps {
  title: string;
  children: React.ReactNode;
  /** Show the bottom banner ad. Only true on result/summary screens per PRD §4 — never on active-input screens. */
  showResultAd?: boolean;
  rightAction?: React.ComponentProps<typeof AppHeader>["rightAction"];
}

export function ToolScreenLayout({
  title,
  children,
  showResultAd = false,
  rightAction,
}: ToolScreenLayoutProps): React.JSX.Element {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <AppHeader title={title} rightAction={rightAction} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {showResultAd ? <AdContainer placement="result-bottom" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
