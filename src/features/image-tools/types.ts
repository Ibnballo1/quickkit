export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export type CompressionTarget =
  | { kind: "under500kb" }
  | { kind: "under1mb" }
  | { kind: "under2mb" }
  | { kind: "bestQuality" }
  | { kind: "custom"; maxSizeBytes: number };

export interface CompressionResult {
  uri: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  percentSaved: number;
  width: number;
  height: number;
  qualityUsed: number;
}

export type ResizeMode =
  | { kind: "percentage"; percent: number }
  | {
      kind: "exact";
      width: number;
      height: number;
      preserveAspectRatio: boolean;
    };

export interface ResizeResult {
  uri: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

export type CropAspectRatioKey =
  | "free"
  | "square"
  | "4:3"
  | "16:9"
  | "4:5"
  | "9:16";

/** Normalized crop rectangle, all fields in the 0–1 range relative to the
 * original image's full width/height — resolution-independent, so the
 * same rect works whether it was computed against a small preview or the
 * full-size original. */
export interface NormalizedCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropResult {
  uri: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}
