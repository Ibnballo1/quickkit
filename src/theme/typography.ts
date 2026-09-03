import { Platform } from "react-native";

const fontFamily = Platform.select({
  android: "sans-serif",
  ios: "System",
  default: "System",
});

const fontFamilyMedium = Platform.select({
  android: "sans-serif-medium",
  ios: "System",
  default: "System",
});

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: "400" | "500" | "600" | "700";
  letterSpacing?: number;
}

export const typography = {
  displayLg: {
    fontFamily: fontFamilyMedium,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
  h1: {
    fontFamily: fontFamilyMedium,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  h2: {
    fontFamily: fontFamilyMedium,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  h3: {
    fontFamily: fontFamilyMedium,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
  },
  bodyLg: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  body: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  button: {
    fontFamily: fontFamilyMedium,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
  numeric: {
    fontFamily: fontFamilyMedium,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyToken = keyof typeof typography;
