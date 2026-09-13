import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { PdfGenerationResult, PickedImage, SavePdfOutcome } from "./types";

/** Hard cap on pages per PDF — protects memory/processing time on a
 * device rather than letting someone select 80 photos and hang the app. */
export const MAX_PDF_IMAGES = 20;

/** Images are downsampled to this max dimension before embedding, so a
 * batch of full-resolution originals doesn't produce a multi-hundred-MB
 * PDF or blow past available memory while generating it. */
const MAX_EMBED_DIMENSION = 1600;

async function prepareImageForEmbedding(
  image: PickedImage,
): Promise<{ base64: string }> {
  const needsDownsize =
    image.width > MAX_EMBED_DIMENSION || image.height > MAX_EMBED_DIMENSION;
  const actions = needsDownsize
    ? [
        {
          resize:
            image.width >= image.height
              ? { width: MAX_EMBED_DIMENSION }
              : { height: MAX_EMBED_DIMENSION },
        },
      ]
    : [];

  const manipulated = await ImageManipulator.manipulateAsync(
    image.uri,
    actions,
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: "base64",
  });
  return { base64 };
}

/**
 * Generates a PDF with one image per page. Images beyond MAX_PDF_IMAGES
 * are silently dropped — the caller (the screen) is responsible for
 * warning the user before calling this if their selection was capped, so
 * that's not a surprise after the fact.
 */
export async function generatePdfFromImages(
  images: PickedImage[],
): Promise<PdfGenerationResult> {
  if (images.length === 0) {
    throw new Error("No images to include in the PDF.");
  }
  const capped = images.slice(0, MAX_PDF_IMAGES);

  const pageHtmlFragments = await Promise.all(
    capped.map(async (image) => {
      const { base64 } = await prepareImageForEmbedding(image);
      return `
        <div style="page-break-after: always; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0;">
          <img src="data:image/jpeg;base64,${base64}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
      `;
    }),
  );

  const html = `<html><body style="margin:0; padding:0;">${pageHtmlFragments.join("")}</body></html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const info = await FileSystem.getInfoAsync(uri);
  const fileSizeBytes = info.exists && "size" in info ? info.size : 0;

  return { uri, pageCount: capped.length, fileSizeBytes };
}

export async function sharePdf(uri: string): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return false;
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });
  return true;
}

/**
 * PDFs aren't photos, so expo-media-library's photo-oriented save flow
 * doesn't apply here. Uses Android's Storage Access Framework instead
 * (already part of expo-file-system's legacy API — no new dependency) to
 * let the user pick a destination folder and write the file there.
 */
export async function savePdfToDevice(
  uri: string,
  fileName: string,
): Promise<SavePdfOutcome> {
  try {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      return { status: "cancelled" };
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });
    const destinationUri =
      await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        "application/pdf",
      );
    // Must use StorageAccessFramework's own writeAsStringAsync, not the
    // general FileSystem.writeAsStringAsync — the destination here is a
    // content:// SAF URI, which the general file-path-based write does
    // not know how to handle. This was the actual bug behind "Save
    // failed": the permission request and file creation both succeeded,
    // but the write silently threw and got swallowed by the catch below.
    await FileSystem.StorageAccessFramework.writeAsStringAsync(
      destinationUri,
      base64,
      { encoding: "base64" },
    );
    return { status: "saved" };
  } catch (err) {
    if (__DEV__) {
      console.error("savePdfToDevice failed:", err);
    }

    // Android's built-in "Downloads" shortcut in the system folder picker
    // is backed by com.android.providers.downloads.documents, which
    // rejects file creation via the directory-tree SAF API on many
    // Android versions/OEMs even after permission is granted — it only
    // supports the older single-file "Create Document" flow, which
    // expo-file-system's StorageAccessFramework doesn't expose. This is
    // an OS-level provider restriction, not something fixable here —
    // detecting it lets the UI tell the user to pick a different folder
    // instead of showing a generic, unhelpful "save failed".
    const message = err instanceof Error ? err.message : "";
    if (
      message.includes("providers.downloads.documents") ||
      message.includes("isn't writable")
    ) {
      return { status: "unwritableFolder" };
    }

    return { status: "error" };
  }
}
