import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ResultCard } from "@/components/ResultCard";
import { ChipGroup } from "@/components/ChipGroup";
import { useTheme } from "@/theme/ThemeProvider";
import { pickImage } from "@/features/image-tools/imagePickerService";
import {
  convertImageFormat,
  detectSourceFormatLabel,
} from "@/features/image-tools/imageFormatConvert";
import {
  saveImageToGallery,
  shareImage,
} from "@/features/image-tools/saveShareService";
import {
  FormatConvertResult,
  ImageFormat,
  PickedImage,
} from "@/features/image-tools/types";
import { formatBytes } from "@/utils/formatBytes";
import { addHistoryEntry } from "@/services/historyStorage";
import { AdInterstitialService } from "@/services/AdInterstitialService";

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
];

export default function ConvertImageScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("jpg");
  const [result, setResult] = useState<FormatConvertResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const sourceLabel = image ? detectSourceFormatLabel(image.mimeType) : "";

  const handlePick = async (): Promise<void> => {
    const outcome = await pickImage();
    if (outcome.status === "permissionDenied") {
      Alert.alert(
        "Photo access needed",
        "QuickKit needs permission to access your photos to convert an image.",
      );
      return;
    }
    if (outcome.status === "canceled") return;
    setImage(outcome.image);
    setResult(null);
    // Default the target to whichever of JPG/PNG differs from the source,
    // so the common case (convert PNG -> JPG, or JPG/WebP -> PNG) doesn't
    // require the user to touch the format chips at all.
    const detected = detectSourceFormatLabel(outcome.image.mimeType);
    setTargetFormat(detected === "PNG" ? "jpg" : "png");
  };

  const handleConvert = async (): Promise<void> => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const converted = await convertImageFormat(image, targetFormat);
      setResult(converted);
      await addHistoryEntry({
        kind: "image_edit",
        title: `Converted ${image.fileName} to ${targetFormat.toUpperCase()}`,
        subtitle: `${sourceLabel} → ${targetFormat.toUpperCase()}`,
        data: { uri: converted.uri, sourceFormat: sourceLabel, targetFormat },
      });
    } catch {
      Alert.alert(
        "Conversion failed",
        "This image could not be converted. Try a different photo.",
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
    <ToolScreenLayout title="Convert Image" showResultAd={result !== null}>
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
                {sourceLabel} · {image.width}×{image.height} ·{" "}
                {formatBytes(image.fileSizeBytes)}
              </Text>
            </View>
          </View>

          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Convert to
          </Text>
          <ChipGroup
            options={FORMAT_OPTIONS}
            value={targetFormat}
            onChange={setTargetFormat}
            accessibilityLabel="Target format"
          />

          {sourceLabel === targetFormat.toUpperCase() ? (
            <Text
              style={[
                typography.caption,
                { color: colors.textTertiary, marginBottom: spacing.sm },
              ]}
            >
              This is already a {sourceLabel} image — converting will just
              re-encode it.
            </Text>
          ) : null}

          <PrimaryButton
            label={isProcessing ? "Converting…" : "Convert"}
            onPress={() => void handleConvert()}
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
                    label: "Format",
                    value: result.format.toUpperCase(),
                    emphasis: true,
                  },
                  {
                    label: "File size",
                    value: formatBytes(result.fileSizeBytes),
                  },
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
  previewRow: { flexDirection: "row", alignItems: "center" },
  thumbnail: { width: 64, height: 64, marginRight: 12 },
  previewMeta: { flex: 1 },
  resultPreview: { width: "100%", height: 220 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1 },
});
