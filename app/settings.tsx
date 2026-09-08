import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { SettingsRow } from "@/components/SettingsRow";
import { ChipGroup } from "@/components/ChipGroup";
import { useTheme, ThemePreference } from "@/theme/ThemeProvider";
import { clearHistory } from "@/services/historyStorage";

const PRIVACY_TEXT = `QuickKit is designed to work entirely on your device.

• Image compression, resizing, calculations, conversions, and QR code generation and scanning all happen locally — nothing is uploaded to a server.
• Scan and calculation history is stored only on your device using local storage, and is never transmitted anywhere.
• Camera access is used only while the QR Scanner screen is open, and only to read the code in front of the camera.
• QuickKit shows ads via Google AdMob. AdMob may collect advertising identifiers to serve and measure ads — this is the only data that leaves your device, and it's governed by Google's own privacy policy, not QuickKit's.

You can clear your local history at any time from this Settings screen.`;

const ABOUT_TEXT = `QuickKit — Everyday tools that just work.

A focused set of offline-first utilities: image compression and resizing, quick calculators, a unit converter, age and date tools, and a QR scanner/generator. Built to be fast, private, and useful without asking anything of you first.`;

export default function SettingsScreen(): React.JSX.Element {
  const { colors, typography, spacing, preference, setPreference } = useTheme();
  const [modal, setModal] = useState<"privacy" | "about" | null>(null);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleClearHistory = (): void => {
    Alert.alert(
      "Clear all history",
      "This removes every scan, calculation, and conversion saved on this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: () => void clearHistory(),
        },
      ],
    );
  };

  return (
    <ToolScreenLayout title="Settings">
      <Text
        style={[
          typography.h3,
          { color: colors.textPrimary, marginBottom: spacing.xs },
        ]}
      >
        Appearance
      </Text>
      <ChipGroup
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
        value={preference}
        onChange={(v: ThemePreference) => setPreference(v)}
        accessibilityLabel="Theme"
      />

      <Text
        style={[
          typography.h3,
          {
            color: colors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.xs,
          },
        ]}
      >
        Data
      </Text>
      <SettingsRow
        icon="trash-outline"
        label="Clear All History"
        onPress={handleClearHistory}
        destructive
      />

      <Text
        style={[
          typography.h3,
          {
            color: colors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.xs,
          },
        ]}
      >
        About
      </Text>
      <SettingsRow
        icon="shield-checkmark-outline"
        label="Privacy Info"
        onPress={() => setModal("privacy")}
      />
      <SettingsRow
        icon="information-circle-outline"
        label="About QuickKit"
        onPress={() => setModal("about")}
      />
      <SettingsRow icon="pricetag-outline" label="Version" value={appVersion} />

      <Modal
        visible={modal !== null}
        animationType="slide"
        onRequestClose={() => setModal(null)}
        presentationStyle="pageSheet"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border, padding: spacing.md },
            ]}
          >
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              {modal === "privacy" ? "Privacy Info" : "About QuickKit"}
            </Text>
            <Pressable
              onPress={() => setModal(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
            >
              <Text style={[typography.body, { color: colors.primary }]}>
                Done
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <Text
              style={[
                typography.bodyLg,
                { color: colors.textPrimary, lineHeight: 24 },
              ]}
            >
              {modal === "privacy" ? PRIVACY_TEXT : ABOUT_TEXT}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
