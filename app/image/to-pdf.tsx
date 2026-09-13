import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ResultCard } from "@/components/ResultCard";
import { useTheme } from "@/theme/ThemeProvider";
import { pickMultipleImages } from "@/features/image-tools/imagePickerService";
import {
  generatePdfFromImages,
  savePdfToDevice,
  sharePdf,
  MAX_PDF_IMAGES,
} from "@/features/image-tools/pdfExportService";
import { PdfGenerationResult, PickedImage } from "@/features/image-tools/types";
import { formatBytes } from "@/utils/formatBytes";
import { addHistoryEntry } from "@/services/historyStorage";
import { AdInterstitialService } from "@/services/AdInterstitialService";

export default function ImageToPdfScreen(): React.JSX.Element {
  const { colors, typography, spacing, radii } = useTheme();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [result, setResult] = useState<PdfGenerationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const addImages = (incoming: PickedImage[]): void => {
    setImages((current) => {
      const combined = [...current, ...incoming];
      if (combined.length > MAX_PDF_IMAGES) {
        Alert.alert(
          "Limit reached",
          `QuickKit includes up to ${MAX_PDF_IMAGES} images per PDF. The extra images were not added.`,
        );
      }
      return combined.slice(0, MAX_PDF_IMAGES);
    });
  };

  const handlePick = async (): Promise<void> => {
    const outcome = await pickMultipleImages();
    if (outcome.status === "permissionDenied") {
      Alert.alert(
        "Photo access needed",
        "QuickKit needs permission to access your photos to build a PDF.",
      );
      return;
    }
    if (outcome.status === "canceled") return;
    addImages(outcome.images);
    setResult(null);
  };

  const moveImage = (index: number, direction: -1 | 1): void => {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (!moved) return current;
      next.splice(target, 0, moved);
      return next;
    });
  };

  const removeImage = (index: number): void => {
    setImages((current) => current.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleGenerate = async (): Promise<void> => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const pdf = await generatePdfFromImages(images);
      setResult(pdf);
      await addHistoryEntry({
        kind: "image_edit",
        title: `Created PDF from ${pdf.pageCount} image${pdf.pageCount === 1 ? "" : "s"}`,
        subtitle: formatBytes(pdf.fileSizeBytes),
        data: { uri: pdf.uri, pageCount: pdf.pageCount },
      });
    } catch {
      Alert.alert(
        "PDF creation failed",
        "The PDF could not be created. Try again with fewer or different images.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!result) return;
    const fileName = `QuickKit-${Date.now()}.pdf`;
    const outcome = await savePdfToDevice(result.uri, fileName);
    if (outcome.status === "cancelled") return;
    if (outcome.status === "unwritableFolder") {
      Alert.alert(
        "Try a different folder",
        'Android won\'t let apps save directly into the "Downloads" shortcut from here — this is a restriction Android itself puts on that specific folder, not something QuickKit controls. Tap Save again and choose a different folder instead (e.g. "Documents", or create a new folder), or use Share to save it via another app.',
      );
      return;
    }
    if (outcome.status === "error") {
      Alert.alert(
        "Save failed",
        "The PDF could not be saved. You can still use Share to save it via another app.",
      );
      return;
    }
    AdInterstitialService.recordCompletedAction();
  };

  const handleShare = async (): Promise<void> => {
    if (!result) return;
    const shared = await sharePdf(result.uri);
    if (shared) {
      AdInterstitialService.recordCompletedAction();
    }
  };

  const handleStartOver = (): void => {
    setImages([]);
    setResult(null);
  };

  return (
    <ToolScreenLayout title="Images to PDF" showResultAd={result !== null}>
      {images.length === 0 ? (
        <PrimaryButton
          label="Select Images"
          onPress={() => void handlePick()}
        />
      ) : !result ? (
        <>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginBottom: spacing.sm },
            ]}
          >
            {images.length} of {MAX_PDF_IMAGES} images · use the arrows to
            reorder
          </Text>

          <FlatList
            data={images}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                  },
                ]}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.thumbnail, { borderRadius: 8 }]}
                />
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.textPrimary,
                      flex: 1,
                      marginLeft: spacing.sm,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.fileName}
                </Text>
                <Pressable
                  onPress={() => moveImage(index, -1)}
                  disabled={index === 0}
                  hitSlop={8}
                  accessibilityLabel="Move up"
                >
                  <Ionicons
                    name="chevron-up"
                    size={20}
                    color={index === 0 ? colors.textTertiary : colors.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  hitSlop={8}
                  accessibilityLabel="Move down"
                  style={{ marginLeft: spacing.xs }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={
                      index === images.length - 1
                        ? colors.textTertiary
                        : colors.primary
                    }
                  />
                </Pressable>
                <Pressable
                  onPress={() => removeImage(index)}
                  hitSlop={8}
                  accessibilityLabel="Remove"
                  style={{ marginLeft: spacing.sm }}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            )}
          />

          <PrimaryButton
            label="Add More Images"
            variant="secondary"
            onPress={() => void handlePick()}
            style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
          />
          <PrimaryButton
            label={
              isProcessing
                ? "Creating PDF…"
                : `Create PDF (${images.length} page${images.length === 1 ? "" : "s"})`
            }
            onPress={() => void handleGenerate()}
            loading={isProcessing}
          />
        </>
      ) : (
        <>
          <ResultCard
            title="PDF Created"
            rows={[
              {
                label: "Pages",
                value: String(result.pageCount),
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
            label="Start Over"
            variant="ghost"
            onPress={handleStartOver}
            style={{ marginTop: spacing.sm }}
          />
        </>
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: { width: 44, height: 44 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1 },
});
