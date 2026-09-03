import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";

export type SaveOutcome =
  | { status: "saved" }
  | { status: "permissionDenied" }
  | { status: "error" };

export async function saveImageToGallery(uri: string): Promise<SaveOutcome> {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    return { status: "permissionDenied" };
  }
  try {
    await MediaLibrary.createAssetAsync(uri);
    return { status: "saved" };
  } catch {
    return { status: "error" };
  }
}

export async function shareImage(uri: string): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return false;
  }
  await Sharing.shareAsync(uri, { mimeType: "image/jpeg" });
  return true;
}
