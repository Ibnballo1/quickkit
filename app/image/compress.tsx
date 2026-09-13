import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { PrimaryButton } from "@/components/PrimaryButton";
import { InputField } from "@/components/InputField";
import { ResultCard } from "@/components/ResultCard";
import { ChipGroup } from "@/components/ChipGroup";
import { useTheme } from "@/theme/ThemeProvider";
import { pickImage } from "@/features/image-tools/imagePickerService";
import { compressImage } from "@/features/image-tools/imageCompression";
import {
  applySharePreset,
  SHARE_PRESETS,
  SharePresetKey,
} from "@/features/image-tools/SharePresets";
import {
  saveImageToGallery,
  shareImage,
} from "@/features/image-tools/saveShareService";
import {
  CompressionResult,
  CompressionTarget,
  PickedImage,
} from "@/features/image-tools/types";
import { formatBytes } from "@/utils/formatBytes";
import { addHistoryEntry } from "@/services/historyStorage";
import { AdInterstitialService } from "@/services/AdInterstitialService";

type TargetKey =
  | "under500kb"
  | "under1mb"
  | "under2mb"
  | "bestQuality"
  | "custom";
type CompressMode = "size" | "purpose";

const TARGET_OPTIONS: { value: TargetKey; label: string }[] = [
  { value: "under500kb", label: "Under 500 KB" },
  { value: "under1mb", label: "Under 1 MB" },
  { value: "under2mb", label: "Under 2 MB" },
  { value: "bestQuality", label: "Best quality" },
  { value: "custom", label: "Custom" },
];

const PRESET_OPTIONS: { value: SharePresetKey; label: string }[] = (
  Object.keys(SHARE_PRESETS) as SharePresetKey[]
).map((key) => ({ value: key, label: SHARE_PRESETS[key].label }));

export default function CompressImageScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: CompressMode =
    params.mode === "purpose" ? "purpose" : "size";
  const [image, setImage] = useState<PickedImage | null>(null);
  const [mode, setMode] = useState<CompressMode>(initialMode);
  const [target, setTarget] = useState<TargetKey>("under1mb");
  const [customKb, setCustomKb] = useState("");
  const [preset, setPreset] = useState<SharePresetKey>("whatsapp");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePick = async (): Promise<void> => {
    const outcome = await pickImage();
    if (outcome.status === "permissionDenied") {
      Alert.alert(
        "Photo access needed",
        "QuickKit needs permission to access your photos to compress an image. You can enable this in Settings.",
      );
      return;
    }
    if (outcome.status === "canceled") {
      return;
    }
    setImage(outcome.image);
    setResult(null);
  };

  const handleCompress = async (): Promise<void> => {
    if (!image) return;

    setIsProcessing(true);
    try {
      let compressed: CompressionResult;
      let historySubtitleSuffix: string;

      if (mode === "purpose") {
        compressed = await applySharePreset(image, preset);
        historySubtitleSuffix = ` for ${SHARE_PRESETS[preset].label}`;
      } else {
        let compressionTarget: CompressionTarget;
        if (target === "custom") {
          const kb = Number(customKb);
          if (!Number.isFinite(kb) || kb <= 0) {
            Alert.alert(
              "Enter a target size",
              "Enter the target size in KB, e.g. 127.",
            );
            setIsProcessing(false);
            return;
          }
          compressionTarget = {
            kind: "custom",
            maxSizeBytes: Math.round(kb * 1024),
          };
        } else {
          compressionTarget = { kind: target };
        }
        compressed = await compressImage(image, compressionTarget);
        historySubtitleSuffix = "";
      }

      setResult(compressed);
      await addHistoryEntry({
        kind: "calculation",
        title: `Compressed ${image.fileName}${historySubtitleSuffix}`,
        subtitle: `${formatBytes(compressed.originalSizeBytes)} → ${formatBytes(compressed.compressedSizeBytes)} (${compressed.percentSaved}% saved)`,
        data: { uri: compressed.uri },
      });
    } catch {
      Alert.alert(
        "Compression failed",
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
    <ToolScreenLayout title="Compress Image" showResultAd={result !== null}>
      {!image ? (
        <PrimaryButton
          label="Choose a Photo"
          onPress={() => void handlePick()}
        />
      ) : (
        <>
          <View
            style={[styles.previewRow, { marginBottom: spacing.md }]}
            accessibilityLabel={`Selected image: ${image.fileName}`}
          >
            <Image
              source={{ uri: image.uri }}
              style={[styles.thumbnail, { borderRadius: 12 }]}
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
              { value: "size", label: "By Size" },
              { value: "purpose", label: "By Purpose" },
            ]}
            value={mode}
            onChange={setMode}
            accessibilityLabel="Compression mode"
          />

          {mode === "purpose" ? (
            <>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Where is this going?
              </Text>
              <ChipGroup
                options={PRESET_OPTIONS}
                value={preset}
                onChange={setPreset}
                accessibilityLabel="Share destination"
              />
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginBottom: spacing.md },
                ]}
              >
                {SHARE_PRESETS[preset].description}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Target size
              </Text>
              <ChipGroup
                options={TARGET_OPTIONS}
                value={target}
                onChange={setTarget}
                accessibilityLabel="Compression target"
              />

              {target === "custom" ? (
                <InputField
                  label="Target size"
                  keyboardType="number-pad"
                  value={customKb}
                  onChangeText={setCustomKb}
                  suffix="KB"
                />
              ) : null}
            </>
          )}

          <PrimaryButton
            label={isProcessing ? "Compressing…" : "Compress"}
            onPress={() => void handleCompress()}
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
              />
              <ResultCard
                title="Result"
                rows={[
                  {
                    label: "Original size",
                    value: formatBytes(result.originalSizeBytes),
                  },
                  {
                    label: "Compressed size",
                    value: formatBytes(result.compressedSizeBytes),
                    emphasis: true,
                  },
                  { label: "Saved", value: `${result.percentSaved}%` },
                  {
                    label: "Dimensions",
                    value: `${result.width}×${result.height}`,
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
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 64,
    height: 64,
    marginRight: 12,
  },
  previewMeta: {
    flex: 1,
  },
  resultPreview: {
    width: "100%",
    height: 220,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
