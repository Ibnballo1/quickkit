import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { CropResult, NormalizedCropRect, PickedImage } from "./types";

async function getSizeBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? info.size : 0;
}

/**
 * Applies a normalized (0–1) crop rect to the original image. Clamps to
 * the image bounds and enforces a 1px minimum on each dimension so
 * rounding at the edges can never produce a zero-size crop request,
 * which expo-image-manipulator rejects.
 */
export async function cropImage(
  image: PickedImage,
  rect: NormalizedCropRect,
): Promise<CropResult> {
  const clampedX = Math.min(Math.max(rect.x, 0), 1);
  const clampedY = Math.min(Math.max(rect.y, 0), 1);
  const clampedWidth = Math.min(Math.max(rect.width, 0), 1 - clampedX);
  const clampedHeight = Math.min(Math.max(rect.height, 0), 1 - clampedY);

  const originX = Math.round(clampedX * image.width);
  const originY = Math.round(clampedY * image.height);
  const width = Math.max(1, Math.round(clampedWidth * image.width));
  const height = Math.max(1, Math.round(clampedHeight * image.height));

  const result = await ImageManipulator.manipulateAsync(
    image.uri,
    [{ crop: { originX, originY, width, height } }],
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
