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
