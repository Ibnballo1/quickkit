import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { compressImage } from "./imageCompression";
import { CompressionResult, PickedImage } from "./types";

export type SharePresetKey =
  | "whatsapp"
  | "email"
  | "website"
  | "instagram"
  | "facebook"
  | "linkedin";

interface PresetConfig {
  label: string;
  description: string;
  maxDimension: number;
  maxSizeBytes: number;
}

/**
 * Practical, not scientific — these numbers are reasonable defaults for
 * "will this look fine and send/upload without hassle", not each
 * platform's exact published spec (which change over time anyway).
 */
export const SHARE_PRESETS: Record<SharePresetKey, PresetConfig> = {
  whatsapp: {
    label: "WhatsApp",
    description: "Fast to send, still sharp in chat",
    maxDimension: 1600,
    maxSizeBytes: 500 * 1024,
  },
  email: {
    label: "Email",
    description: "Small enough to attach without bouncing",
    maxDimension: 1920,
    maxSizeBytes: 1024 * 1024,
  },
  website: {
    label: "Website",
    description: "Optimized for fast page loads",
    maxDimension: 1920,
    maxSizeBytes: 300 * 1024,
  },
  instagram: {
    label: "Instagram",
    description: "High quality, social-feed ready",
    maxDimension: 1080,
    maxSizeBytes: 1024 * 1024,
  },
  facebook: {
    label: "Facebook",
    description: "Good balance of quality and size",
    maxDimension: 2048,
    maxSizeBytes: 1024 * 1024,
  },
  linkedin: {
    label: "LinkedIn",
    description: "Clean and professional-looking",
    maxDimension: 1200,
    maxSizeBytes: 800 * 1024,
  },
};

async function getSizeBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? info.size : 0;
}

/**
 * Resizes to the preset's max dimension (if needed) then reuses the
 * existing compressImage binary-search engine to hit the preset's target
 * size — no duplicated compression logic. The returned result reflects
 * the effect against the TRUE original image, not the resized
 * intermediate step, so "percent saved" means what a user expects.
 */
export async function applySharePreset(
  image: PickedImage,
  preset: SharePresetKey,
): Promise<CompressionResult> {
  const config = SHARE_PRESETS[preset];
  const needsResize =
    image.width > config.maxDimension || image.height > config.maxDimension;

  let workingUri = image.uri;
  let workingWidth = image.width;
  let workingHeight = image.height;

  if (needsResize) {
    const resized = await ImageManipulator.manipulateAsync(
      image.uri,
      [
        {
          resize:
            image.width >= image.height
              ? { width: config.maxDimension }
              : { height: config.maxDimension },
        },
      ],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
    );
    workingUri = resized.uri;
    workingWidth = resized.width;
    workingHeight = resized.height;
  }

  const workingSizeBytes = await getSizeBytes(workingUri);

  const intermediateImage: PickedImage = {
    uri: workingUri,
    width: workingWidth,
    height: workingHeight,
    fileName: image.fileName,
    fileSizeBytes: workingSizeBytes,
    mimeType: "image/jpeg",
  };

  const compressed = await compressImage(intermediateImage, {
    kind: "custom",
    maxSizeBytes: config.maxSizeBytes,
  });

  const percentSaved =
    image.fileSizeBytes > 0
      ? Math.max(
          0,
          Math.round(
            (1 - compressed.compressedSizeBytes / image.fileSizeBytes) * 100,
          ),
        )
      : 0;

  return {
    ...compressed,
    originalSizeBytes: image.fileSizeBytes,
    percentSaved,
  };
}
