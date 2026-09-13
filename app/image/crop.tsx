import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from "react-native";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ResultCard } from "@/components/ResultCard";
import { ChipGroup } from "@/components/ChipGroup";
import { CropOverlay, CropOverlayHandle } from "@/components/CropOverlay";
import { useTheme } from "@/theme/ThemeProvider";
import { pickImage } from "@/features/image-tools/imagePickerService";
import { cropImage } from "@/features/image-tools/imageCrop";
import {
  saveImageToGallery,
  shareImage,
} from "@/features/image-tools/saveShareService";
import {
  CropAspectRatioKey,
  CropResult,
  PickedImage,
} from "@/features/image-tools/types";
import { formatBytes } from "@/utils/formatBytes";
import { addHistoryEntry } from "@/services/historyStorage";
import { AdInterstitialService } from "@/services/AdInterstitialService";

const RATIO_OPTIONS: { value: CropAspectRatioKey; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "square", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
  { value: "4:5", label: "4:5 (Portrait)" },
  { value: "9:16", label: "9:16 (Story)" },
];

const SCREEN_PADDING = 16; // matches ToolScreenLayout's spacing.md content padding

export default function CropImageScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const displayWidth = windowWidth - SCREEN_PADDING * 2;

  const [image, setImage] = useState<PickedImage | null>(null);
  const [ratio, setRatio] = useState<CropAspectRatioKey>("free");
  const [result, setResult] = useState<CropResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const overlayRef = useRef<CropOverlayHandle>(null);

  const handlePick = async (): Promise<void> => {
    const outcome = await pickImage();
    if (outcome.status === "permissionDenied") {
      Alert.alert(
        "Photo access needed",
        "QuickKit needs permission to access your photos to crop an image.",
      );
      return;
    }
    if (outcome.status === "canceled") return;
    setImage(outcome.image);
    setResult(null);
    setRatio("free");
  };

  const handleRatioChange = (next: CropAspectRatioKey): void => {
    setRatio(next);
    overlayRef.current?.resetToRatio(next);
  };

  const handleCrop = async (): Promise<void> => {
    if (!image || !overlayRef.current) return;
    setIsProcessing(true);
    try {
      const rect = overlayRef.current.getNormalizedRect();
      const cropped = await cropImage(image, rect);
      setResult(cropped);
      await addHistoryEntry({
        kind: "image_edit",
        title: `Cropped ${image.fileName}`,
        subtitle: `${cropped.width}×${cropped.height}`,
        data: { uri: cropped.uri, ratio },
      });
    } catch {
      Alert.alert(
        "Crop failed",
        "This image could not be cropped. Try a different photo or crop area.",
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
    <ToolScreenLayout title="Crop Image" showResultAd={result !== null}>
      {!image ? (
        <PrimaryButton
          label="Choose a Photo"
          onPress={() => void handlePick()}
        />
      ) : !result ? (
        <>
          <ChipGroup
            options={RATIO_OPTIONS}
            value={ratio}
            onChange={handleRatioChange}
            accessibilityLabel="Aspect ratio"
          />

          <View style={[styles.overlayWrap, { marginBottom: spacing.md }]}>
            <CropOverlay
              ref={overlayRef}
              imageUri={image.uri}
              imageWidth={image.width}
              imageHeight={image.height}
              displayWidth={displayWidth}
              aspectRatio={ratio}
            />
          </View>

          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginBottom: spacing.md },
            ]}
          >
            Drag inside the box to move it, drag any corner to resize.
          </Text>

          <PrimaryButton
            label={isProcessing ? "Cropping…" : "Crop"}
            onPress={() => void handleCrop()}
            loading={isProcessing}
            style={{ marginBottom: spacing.sm }}
          />
          <PrimaryButton
            label="Choose a Different Photo"
            variant="ghost"
            onPress={() => void handlePick()}
          />
        </>
      ) : (
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
                label: "Dimensions",
                value: `${result.width}×${result.height}`,
                emphasis: true,
              },
              { label: "File size", value: formatBytes(result.fileSizeBytes) },
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
            label="Crop Again"
            variant="ghost"
            onPress={() => setResult(null)}
            style={{ marginTop: spacing.sm }}
          />
          <PrimaryButton
            label="Choose a Different Photo"
            variant="ghost"
            onPress={() => void handlePick()}
            style={{ marginTop: spacing.xs }}
          />
        </>
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },
  resultPreview: {
    width: "100%",
    height: 260,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
