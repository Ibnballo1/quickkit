import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { CompressionResult, CompressionTarget, PickedImage } from "./types";

const MAX_QUALITY_SEARCH_ITERATIONS = 6;
const BEST_QUALITY_SETTING = 0.92;

function targetToMaxBytes(target: CompressionTarget): number | null {
  switch (target.kind) {
    case "under500kb":
      return 500 * 1024;
    case "under1mb":
      return 1024 * 1024;
    case "under2mb":
      return 2 * 1024 * 1024;
    case "custom":
      return target.maxSizeBytes;
    case "bestQuality":
      return null;
  }
}

async function getSizeBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? info.size : 0;
}

async function compressAtQuality(
  uri: string,
  quality: number,
): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: result.uri, width: result.width, height: result.height };
}

/**
 * Compresses an image toward a size target using a bounded binary search
 * over JPEG quality. Runs entirely on-device — no upload, no network call.
 *
 * "Best quality" skips the search and applies a single high-quality pass,
 * since there's no target to search against.
 */
export async function compressImage(
  image: PickedImage,
  target: CompressionTarget,
): Promise<CompressionResult> {
  const maxBytes = targetToMaxBytes(target);

  if (maxBytes === null) {
    const { uri, width, height } = await compressAtQuality(
      image.uri,
      BEST_QUALITY_SETTING,
    );
    const compressedSizeBytes = await getSizeBytes(uri);
    return buildResult(
      image,
      uri,
      compressedSizeBytes,
      width,
      height,
      BEST_QUALITY_SETTING,
    );
  }

  let low = 0.05;
  let high = 0.95;
  let best: {
    uri: string;
    width: number;
    height: number;
    sizeBytes: number;
    quality: number;
  } | null = null;

  for (let i = 0; i < MAX_QUALITY_SEARCH_ITERATIONS; i += 1) {
    const midQuality = Number(((low + high) / 2).toFixed(2));
    const { uri, width, height } = await compressAtQuality(
      image.uri,
      midQuality,
    );
    const sizeBytes = await getSizeBytes(uri);

    if (sizeBytes <= maxBytes) {
      // Under target — this is a valid candidate; try pushing quality up.
      if (!best || sizeBytes > best.sizeBytes) {
        best = { uri, width, height, sizeBytes, quality: midQuality };
      }
      low = midQuality;
    } else {
      // Over target — back off quality.
      high = midQuality;
    }

    if (high - low < 0.04) break;
  }

  // If even the lowest quality in range couldn't hit the target (e.g. the
  // image is huge or already near the floor), fall back to the lowest
  // quality attempt so the user still gets the smallest file we could make,
  // rather than an error.
  if (!best) {
    const { uri, width, height } = await compressAtQuality(image.uri, low);
    const sizeBytes = await getSizeBytes(uri);
    best = { uri, width, height, sizeBytes, quality: low };
  }

  return buildResult(
    image,
    best.uri,
    best.sizeBytes,
    best.width,
    best.height,
    best.quality,
  );
}

function buildResult(
  original: PickedImage,
  uri: string,
  compressedSizeBytes: number,
  width: number,
  height: number,
  qualityUsed: number,
): CompressionResult {
  const percentSaved =
    original.fileSizeBytes > 0
      ? Math.max(
          0,
          Math.round((1 - compressedSizeBytes / original.fileSizeBytes) * 100),
        )
      : 0;

  return {
    uri,
    originalSizeBytes: original.fileSizeBytes,
    compressedSizeBytes,
    percentSaved,
    width,
    height,
    qualityUsed,
  };
}
