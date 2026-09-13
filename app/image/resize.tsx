import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Alert, Switch } from "react-native";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { PrimaryButton } from "@/components/PrimaryButton";
import { InputField } from "@/components/InputField";
import { ResultCard } from "@/components/ResultCard";
import { ChipGroup } from "@/components/ChipGroup";
import { useTheme } from "@/theme/ThemeProvider";
import { pickImage } from "@/features/image-tools/imagePickerService";
import { resizeImage } from "@/features/image-tools/resizeImage";
import {
  saveImageToGallery,
  shareImage,
} from "@/features/image-tools/saveShareService";
import {
  PickedImage,
  ResizeMode,
  ResizeResult,
} from "@/features/image-tools/types";
import { formatBytes } from "@/utils/formatBytes";
import { addHistoryEntry } from "@/services/historyStorage";
import { AdInterstitialService } from "@/services/AdInterstitialService";

type ModeKey = "percentage" | "exact";

/** Resize can occasionally produce a larger file (e.g. upscaling, or a
 * source that was already heavily compressed), so this reports both
 * directions rather than assuming "resize" always means "smaller". */
function describeSizeChange(originalBytes: number, newBytes: number): string {
  if (originalBytes <= 0) return "—";
  const percent = Math.round((1 - newBytes / originalBytes) * 100);
  if (percent > 0) return `${percent}% smaller`;
  if (percent < 0) return `${Math.abs(percent)}% larger`;
  return "No change";
}

export default function ResizeImageScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [mode, setMode] = useState<ModeKey>("percentage");
  const [percent, setPercent] = useState("50");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [result, setResult] = useState<ResizeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handlePick = async (): Promise<void> => {
    const outcome = await pickImage();
    if (outcome.status === "permissionDenied") {
      Alert.alert(
        "Photo access needed",
        "QuickKit needs permission to access your photos to resize an image.",
      );
      return;
    }
    if (outcome.status === "canceled") return;
    setImage(outcome.image);
    setResult(null);
    setError(undefined);
  };

  const buildResizeMode = (): ResizeMode | null => {
    if (mode === "percentage") {
      const value = Number(percent);
      if (!Number.isFinite(value) || value <= 0 || value > 100) {
        setError("Enter a percentage between 1 and 100.");
        return null;
      }
      return { kind: "percentage", percent: value };
    }
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      setError("Enter a valid width and height in pixels.");
      return null;
    }
    return {
      kind: "exact",
      width: Math.round(w),
      height: Math.round(h),
      preserveAspectRatio,
    };
  };

  const handleResize = async (): Promise<void> => {
    if (!image) return;
    setError(undefined);
    const resizeMode = buildResizeMode();
    if (!resizeMode) return;

    setIsProcessing(true);
    try {
      const resized = await resizeImage(image, resizeMode);
      setResult(resized);
      await addHistoryEntry({
        kind: "calculation",
        title: `Resized ${image.fileName}`,
        subtitle: `${image.width}×${image.height} → ${resized.width}×${resized.height} (${formatBytes(resized.fileSizeBytes)})`,
        data: { uri: resized.uri },
      });
    } catch {
      Alert.alert(
        "Resize failed",
        "This image could not be processed. Try a different photo.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!result) return;
    const outcome = await saveImageToGallery(result.uri);
    if (outcome.status === "permissionDenied") {
      Alert.alert(
        "Photo library access needed",
        "Enable photo library access in Settings to save images.",
      );
      return;
    }
    if (outcome.status === "error") {
      Alert.alert(
        "Save failed",
        "The image could not be saved to your gallery.",
      );
      return;
    }
    AdInterstitialService.recordCompletedAction();
  };

  const handleShare = async (): Promise<void> => {
    if (!result) return;
    const shared = await shareImage(result.uri);
    if (shared) {
      AdInterstitialService.recordCompletedAction();
    }
  };

  return (
    <ToolScreenLayout title="Resize Image" showResultAd={result !== null}>
      {!image ? (
        <PrimaryButton
          label="Choose a Photo"
          onPress={() => void handlePick()}
        />
      ) : (
        <>
          <View style={[styles.previewRow, { marginBottom: spacing.md }]}>
            <Image
              source={{ uri: image.uri }}
              style={[styles.thumbnail, { borderRadius: 12 }]}
              resizeMode="cover"
            />
            <View style={styles.previewMeta}>
              <Text
                style={[typography.body, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {image.fileName}
              </Text>
              <Text
                style={[typography.caption, { color: colors.textSecondary }]}
              >
                {image.width}×{image.height} ·{" "}
                {formatBytes(image.fileSizeBytes)}
              </Text>
            </View>
          </View>

          <ChipGroup
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "exact", label: "Custom size" },
            ]}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setError(undefined);
            }}
            accessibilityLabel="Resize mode"
          />

          {mode === "percentage" ? (
            <InputField
              label="Percentage of original size"
              keyboardType="number-pad"
              value={percent}
              onChangeText={setPercent}
              suffix="%"
            />
          ) : (
            <>
              <InputField
                label="Width"
                keyboardType="number-pad"
                value={width}
                onChangeText={setWidth}
                suffix="px"
              />
              <InputField
                label="Height"
                keyboardType="number-pad"
                value={height}
                onChangeText={setHeight}
                suffix="px"
              />
              <View style={[styles.switchRow, { marginBottom: spacing.md }]}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>
                  Preserve aspect ratio
                </Text>
                <Switch
                  value={preserveAspectRatio}
                  onValueChange={setPreserveAspectRatio}
                />
              </View>
            </>
          )}

          {error ? (
            <Text
              style={[
                typography.caption,
                { color: colors.danger, marginBottom: spacing.sm },
              ]}
            >
              {error}
            </Text>
          ) : null}

          <PrimaryButton
            label={isProcessing ? "Resizing…" : "Resize"}
            onPress={() => void handleResize()}
            loading={isProcessing}
            style={{ marginBottom: spacing.md }}
          />

          {result ? (
            <>
              <Image
                source={{ uri: result.uri }}
                style={[
                  styles.resultPreview,
                  { borderRadius: 12, marginBottom: spacing.md },
                ]}
                resizeMode="contain"
              />
              <ResultCard
                title="Result"
                rows={[
                  {
                    label: "Original",
                    value: `${image.width}×${image.height} · ${formatBytes(image.fileSizeBytes)}`,
                  },
                  {
                    label: "New size",
                    value: `${result.width}×${result.height} · ${formatBytes(result.fileSizeBytes)}`,
                    emphasis: true,
                  },
                  {
                    label: "Change",
                    value: describeSizeChange(
                      image.fileSizeBytes,
                      result.fileSizeBytes,
                    ),
                  },
                ]}
              />
              <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
                <PrimaryButton
                  label="Save"
                  variant="secondary"
                  onPress={() => void handleSave()}
                  style={styles.actionButton}
                />
                <PrimaryButton
                  label="Share"
                  onPress={() => void handleShare()}
                  style={styles.actionButton}
                />
              </View>
              <PrimaryButton
                label="Choose a Different Photo"
                variant="ghost"
                onPress={() => void handlePick()}
                style={{ marginTop: spacing.sm }}
              />
            </>
          ) : null}
        </>
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  previewRow: { flexDirection: "row", alignItems: "center" },
  thumbnail: { width: 64, height: 64, marginRight: 12 },
  previewMeta: { flex: 1 },
  resultPreview: { width: "100%", height: 220 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1 },
});
