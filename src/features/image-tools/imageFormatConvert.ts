import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { FormatConvertResult, ImageFormat, PickedImage } from "./types";

async function getSizeBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? info.size : 0;
}

/** Best-effort label for the source format, derived from the picker's
 * reported mime type. Purely informational (shown in the UI so the user
 * knows what they're converting from) — never used to decide how the
 * conversion itself runs, since manipulateAsync accepts any decodable
 * input regardless of what we detect here. */
export function detectSourceFormatLabel(mimeType: string): string {
  if (mimeType.includes("png")) return "PNG";
  if (mimeType.includes("webp")) return "WebP";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "JPG";
  return "Unknown";
}

export async function convertImageFormat(
  image: PickedImage,
  targetFormat: ImageFormat,
): Promise<FormatConvertResult> {
  const saveFormat =
    targetFormat === "png"
      ? ImageManipulator.SaveFormat.PNG
      : ImageManipulator.SaveFormat.JPEG;

  // No resize/crop/compress operations — this is a pure re-encode. PNG is
  // lossless so no quality setting applies to it; JPEG keeps a high
  // default quality since "convert format" shouldn't quietly degrade the
  // image the way a compression tool intentionally does. Built as two
  // branches (rather than a `compress: undefined` field) because the
  // project's tsconfig has exactOptionalPropertyTypes enabled, which
  // treats an explicit undefined differently from an omitted key.
  const result = await ImageManipulator.manipulateAsync(
    image.uri,
    [],
    targetFormat === "jpg"
      ? { format: saveFormat, compress: 0.95 }
      : { format: saveFormat },
  );

  const fileSizeBytes = await getSizeBytes(result.uri);

  return {
    uri: result.uri,
    format: targetFormat,
    width: result.width,
    height: result.height,
    fileSizeBytes,
  };
}
