import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
// See src/features/image-tools/imageCompression.ts for why /legacy is used.
import * as FileSystem from "expo-file-system/legacy";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { InputField } from "@/components/InputField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChipGroup } from "@/components/ChipGroup";
import { useTheme } from "@/theme/ThemeProvider";
import { buildQrPayload, QrGenerateInput } from "@/features/qr-tools/qrPayload";
import {
  saveImageToGallery,
  shareImage,
} from "@/features/image-tools/saveShareService";
import { addHistoryEntry } from "@/services/historyStorage";
import { AdInterstitialService } from "@/services/AdInterstitialService";

type Kind = QrGenerateInput["kind"];

export default function QrGenerateScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const qrRef = useRef<{
    toDataURL: (callback: (data: string) => void) => void;
  } | null>(null);

  const [kind, setKind] = useState<Kind>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [ssid, setSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  const payload = useMemo(() => {
    const input: QrGenerateInput | null = (() => {
      switch (kind) {
        case "text":
          return text.trim() ? { kind: "text", text } : null;
        case "url":
          return url.trim() ? { kind: "url", url } : null;
        case "wifi":
          return ssid.trim()
            ? { kind: "wifi", ssid, password: wifiPassword, security: "WPA" }
            : null;
        case "phone":
          return phone.trim() ? { kind: "phone", number: phone } : null;
        case "email":
          return emailAddress.trim()
            ? { kind: "email", address: emailAddress, subject: emailSubject }
            : null;
      }
    })();
    return input ? buildQrPayload(input) : null;
  }, [kind, text, url, ssid, wifiPassword, phone, emailAddress, emailSubject]);

  const handleSaveOrShare = (action: "save" | "share"): void => {
    if (!payload) return;

    // The initial call itself can throw synchronously if this library
    // version doesn't expose toDataURL the way we expect on this ref —
    // wrapping only the callback body (as before) missed that case, which
    // meant a failure here showed no feedback at all.
    try {
      if (!qrRef.current || typeof qrRef.current.toDataURL !== "function") {
        Alert.alert(
          "Export not available",
          "This QR code can still be scanned directly from the screen, but saving/sharing as an image isn't working on this build. This is a known fragile point in the QR rendering library — let the developer know so it can be swapped for a more reliable export method.",
        );
        return;
      }

      qrRef.current.toDataURL(async (data: string) => {
        try {
          const path = `${FileSystem.cacheDirectory}quickkit-qr-${Date.now()}.png`;
          await FileSystem.writeAsStringAsync(path, data, {
            encoding: "base64",
          });

          if (action === "save") {
            const outcome = await saveImageToGallery(path);
            if (outcome.status === "permissionDenied") {
              Alert.alert(
                "Photo library access needed",
                "Enable photo library access in Settings to save the QR code.",
              );
              return;
            }
            if (outcome.status === "error") {
              Alert.alert("Save failed", "The QR code could not be saved.");
              return;
            }
          } else {
            await shareImage(path);
          }

          await addHistoryEntry({
            kind: "qr_generate",
            title: `Generated ${kind} QR code`,
            subtitle: payload,
            data: { kind, payload },
          });
          AdInterstitialService.recordCompletedAction();
        } catch (err) {
          Alert.alert(
            "Something went wrong",
            `The QR code could not be exported. ${err instanceof Error ? err.message : ""}`,
          );
        }
      });
    } catch (err) {
      Alert.alert(
        "Export not available",
        `Saving/sharing this QR code failed to start. ${err instanceof Error ? err.message : ""}`,
      );
    }
  };

  return (
    <ToolScreenLayout title="QR Generator" showResultAd={payload !== null}>
      <ChipGroup
        options={[
          { value: "text", label: "Text" },
          { value: "url", label: "URL" },
          { value: "wifi", label: "Wi-Fi" },
          { value: "phone", label: "Phone" },
          { value: "email", label: "Email" },
        ]}
        value={kind}
        onChange={setKind}
        accessibilityLabel="QR code type"
      />

      {kind === "text" && (
        <InputField
          label="Text"
          value={text}
          onChangeText={setText}
          multiline
        />
      )}
      {kind === "url" && (
        <InputField
          label="URL"
          value={url}
          onChangeText={setUrl}
          keyboardType="url"
          autoCapitalize="none"
        />
      )}
      {kind === "wifi" && (
        <>
          <InputField
            label="Network name (SSID)"
            value={ssid}
            onChangeText={setSsid}
          />
          <InputField
            label="Password"
            value={wifiPassword}
            onChangeText={setWifiPassword}
            secureTextEntry
          />
        </>
      )}
      {kind === "phone" && (
        <InputField
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      )}
      {kind === "email" && (
        <>
          <InputField
            label="Email address"
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Subject (optional)"
            value={emailSubject}
            onChangeText={setEmailSubject}
          />
        </>
      )}

      {payload ? (
        <View
          style={[
            styles.qrWrap,
            {
              backgroundColor: colors.surface,
              marginTop: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <QRCode
            value={payload}
            size={200}
            getRef={(ref) => {
              qrRef.current = ref;
            }}
          />
        </View>
      ) : (
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: spacing.sm },
          ]}
        >
          Fill in the fields above to generate a code.
        </Text>
      )}

      {payload ? (
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          <PrimaryButton
            label="Save"
            variant="secondary"
            onPress={() => void handleSaveOrShare("save")}
            style={styles.flexButton}
          />
          <PrimaryButton
            label="Share"
            onPress={() => void handleSaveOrShare("share")}
            style={styles.flexButton}
          />
        </View>
      ) : null}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 16,
    alignSelf: "center",
  },
  flexButton: { flex: 1 },
});
