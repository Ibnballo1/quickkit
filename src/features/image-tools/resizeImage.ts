import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { PickedImage, ResizeMode, ResizeResult } from "./types";

async function getSizeBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? info.size : 0;
}

function computeTargetDimensions(
  image: PickedImage,
  mode: ResizeMode,
): { width: number; height: number } {
  if (mode.kind === "percentage") {
    const factor = Math.max(1, Math.min(100, mode.percent)) / 100;
    return {
      width: Math.max(1, Math.round(image.width * factor)),
      height: Math.max(1, Math.round(image.height * factor)),
    };
  }

  if (!mode.preserveAspectRatio) {
    return { width: mode.width, height: mode.height };
  }

  const aspectRatio = image.width / image.height;
  // Fit within the requested box while preserving aspect ratio.
  const widthFromHeight = Math.round(mode.height * aspectRatio);
  if (widthFromHeight <= mode.width) {
    return { width: widthFromHeight, height: mode.height };
  }
  return { width: mode.width, height: Math.round(mode.width / aspectRatio) };
}

export async function resizeImage(
  image: PickedImage,
  mode: ResizeMode,
): Promise<ResizeResult> {
  const { width, height } = computeTargetDimensions(image, mode);

  const result = await ImageManipulator.manipulateAsync(
    image.uri,
    [{ resize: { width, height } }],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
  );

  const fileSizeBytes = await getSizeBytes(result.uri);

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    fileSizeBytes,
  };
}
