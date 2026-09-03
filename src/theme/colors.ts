/**
 * QuickKit color tokens.
 * Two palettes only: light and dark. Never reference raw hex values
 * outside this file — always go through useTheme().colors.
 */

export interface ColorPalette {
  // Surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Brand / actions
  primary: string;
  primaryPressed: string;
  onPrimary: string;

  // Semantic
  success: string;
  warning: string;
  danger: string;
  info: string;

  // Chrome
  statusBar: "light" | "dark";
  overlay: string;
}

export const lightColors: ColorPalette = {
  background: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border: "#E4E7EC",

  textPrimary: "#101828",
  textSecondary: "#475467",
  textTertiary: "#98A2B3",
  textInverse: "#FFFFFF",

  primary: "#2563EB",
  primaryPressed: "#1D4ED8",
  onPrimary: "#FFFFFF",

  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#0EA5E9",

  statusBar: "dark",
  overlay: "rgba(16, 24, 40, 0.5)",
};

export const darkColors: ColorPalette = {
  background: "#0B0F1A",
  surface: "#131826",
  surfaceElevated: "#1B2233",
  border: "#252D40",

  textPrimary: "#F2F4F7",
  textSecondary: "#98A2B3",
  textTertiary: "#667085",
  textInverse: "#101828",

  primary: "#3B82F6",
  primaryPressed: "#60A5FA",
  onPrimary: "#0B0F1A",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#38BDF8",

  statusBar: "light",
  overlay: "rgba(0, 0, 0, 0.6)",
};
