import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Linking, Alert } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ResultCard } from "@/components/ResultCard";
import { useTheme } from "@/theme/ThemeProvider";
import { parseQrContent, ParsedQrContent } from "@/features/qr-tools/qrParser";
import { addHistoryEntry } from "@/services/historyStorage";
import { AdInterstitialService } from "@/services/AdInterstitialService";

function summarize(parsed: ParsedQrContent): {
  title: string;
  subtitle: string;
} {
  switch (parsed.kind) {
    case "url":
      return { title: "Website", subtitle: parsed.url };
    case "wifi":
      return { title: "Wi-Fi network", subtitle: parsed.ssid };
    case "email":
      return { title: "Email", subtitle: parsed.address };
    case "contact":
      return {
        title: "Contact",
        subtitle: parsed.name ?? parsed.phone ?? parsed.email ?? "Unknown",
      };
    case "text":
      return { title: "Text", subtitle: parsed.text };
  }
}

export default function QrScanScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<ParsedQrContent | null>(null);
  const [isScanningPaused, setIsScanningPaused] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleScan = (result: BarcodeScanningResult): void => {
    if (isScanningPaused) return;
    setIsScanningPaused(true);
    const parsed = parseQrContent(result.data);
    setScanned(parsed);
    const { title, subtitle } = summarize(parsed);
    void addHistoryEntry({
      kind: "qr_scan",
      title,
      subtitle,
      data: { raw: result.data, parsed },
    });
    AdInterstitialService.recordCompletedAction();
  };

  const handleOpen = (): void => {
    if (!scanned) return;
    if (scanned.kind === "url") void Linking.openURL(scanned.url);
    else if (scanned.kind === "email")
      void Linking.openURL(`mailto:${scanned.address}`);
    else if (scanned.kind === "contact" && scanned.phone)
      void Linking.openURL(`tel:${scanned.phone}`);
  };

  const handleScanAgain = (): void => {
    setScanned(null);
    setIsScanningPaused(false);
  };

  if (!permission) {
    return (
      <ToolScreenLayout title="QR Scanner">
        <Text style={typography.body}>Checking camera permission…</Text>
      </ToolScreenLayout>
    );
  }

  if (!permission.granted) {
    return (
      <ToolScreenLayout title="QR Scanner">
        <Text
          style={[
            typography.bodyLg,
            { color: colors.textPrimary, marginBottom: spacing.md },
          ]}
        >
          Camera access is needed to scan QR codes. QuickKit only uses the
          camera while this screen is open — nothing is recorded or uploaded.
        </Text>
        <PrimaryButton
          label={
            permission.canAskAgain ? "Grant Camera Access" : "Open Settings"
          }
          onPress={() => {
            if (permission.canAskAgain) {
              void requestPermission();
            } else {
              Alert.alert(
                "Camera permission denied",
                "Enable camera access for QuickKit in your device Settings.",
              );
            }
          }}
        />
      </ToolScreenLayout>
    );
  }

  return (
    <ToolScreenLayout title="QR Scanner" showResultAd={scanned !== null}>
      {!scanned ? (
        <View style={[styles.cameraWrap, { borderRadius: 16 }]}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleScan}
          />
        </View>
      ) : (
        <>
          <ResultCard
            title={summarize(scanned).title}
            rows={[{ label: "Content", value: summarize(scanned).subtitle }]}
          />
          <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
            {scanned.kind === "url" ||
            scanned.kind === "email" ||
            (scanned.kind === "contact" && scanned.phone) ? (
              <PrimaryButton label="Open" onPress={handleOpen} />
            ) : null}
            <PrimaryButton
              label="Scan Another"
              variant="secondary"
              onPress={handleScanAgain}
            />
          </View>
        </>
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    overflow: "hidden",
    aspectRatio: 1,
  },
  camera: {
    flex: 1,
  },
});
