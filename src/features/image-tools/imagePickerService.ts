import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { PickedImage } from "./types";

export type PickImageOutcome =
  | { status: "picked"; image: PickedImage }
  | { status: "canceled" }
  | { status: "permissionDenied" };

/**
 * Launches the native image picker. Requests library permission first so we
 * can distinguish "user denied" from "user canceled the picker" and show the
 * right message for each (PRD requirement: graceful denial messaging).
 */
export async function pickImage(): Promise<PickImageOutcome> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: "permissionDenied" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    exif: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return { status: "canceled" };
  }

  const asset = result.assets[0];
  if (!asset) {
    return { status: "canceled" };
  }

  const fileSizeBytes = asset.fileSize ?? (await getFileSize(asset.uri));

  return {
    status: "picked",
    image: {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName ?? uriToFileName(asset.uri),
      fileSizeBytes,
      mimeType: asset.mimeType ?? "image/jpeg",
    },
  };
}

async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && "size" in info ? info.size : 0;
  } catch {
    return 0;
  }
}

function uriToFileName(uri: string): string {
  const segments = uri.split("/");
  return segments[segments.length - 1] ?? "image.jpg";
}
