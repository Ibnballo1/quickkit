import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { ToolCard } from "@/components/ToolCard";

interface ToolDefinition {
  key: string;
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
}

export default function HomeScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tools: ToolDefinition[] = [
    {
      key: "compress",
      title: "Compress Image",
      subtitle: "Shrink to a target size",
      route: "/image/compress",
      icon: "image-outline",
      accentColor: colors.primary,
    },
    {
      key: "resize",
      title: "Resize Image",
      subtitle: "Percentage or exact size",
      route: "/image/resize",
      icon: "resize-outline",
      accentColor: colors.info,
    },
    {
      key: "crop",
      title: "Crop Image",
      subtitle: "Free or aspect ratio presets",
      route: "/image/crop",
      icon: "crop-outline",
      accentColor: colors.warning,
    },
    {
      key: "convert",
      title: "Convert Format",
      subtitle: "JPG, PNG, and WebP",
      route: "/image/convert",
      icon: "repeat-outline",
      accentColor: colors.success,
    },
    {
      key: "to-pdf",
      title: "Images to PDF",
      subtitle: "Combine photos into one PDF",
      route: "/image/to-pdf",
      icon: "document-outline",
      accentColor: colors.danger,
    },
    {
      key: "percentage",
      title: "Percentage",
      subtitle: "X% of Y, change, diff",
      route: "/calculators/percentage",
      icon: "calculator-outline",
      accentColor: colors.success,
    },
    {
      key: "discount",
      title: "Discount",
      subtitle: "Final price & savings",
      route: "/calculators/discount",
      icon: "pricetag-outline",
      accentColor: colors.warning,
    },
    {
      key: "unit-converter",
      title: "Unit Converter",
      subtitle: "Length, weight, temp & more",
      route: "/converter",
      icon: "swap-horizontal-outline",
      accentColor: colors.primary,
    },
    {
      key: "age",
      title: "Age Calculator",
      subtitle: "Years, months, days",
      route: "/date/age",
      icon: "calendar-outline",
      accentColor: colors.info,
    },
    {
      key: "date-diff",
      title: "Date Difference",
      subtitle: "Duration between dates",
      route: "/date/difference",
      icon: "time-outline",
      accentColor: colors.success,
    },
    {
      key: "qr-scan",
      title: "QR Scanner",
      subtitle: "Scan codes instantly",
      route: "/qr/scan",
      icon: "scan-outline",
      accentColor: colors.danger,
    },
    {
      key: "qr-generate",
      title: "QR Generator",
      subtitle: "Text, URL, Wi-Fi & more",
      route: "/qr/generate",
      icon: "qr-code-outline",
      accentColor: colors.warning,
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: spacing.md,
        paddingBottom: spacing.xxl,
      }}
    >
      <View
        style={[
          styles.headerRow,
          { marginTop: insets.top > 0 ? 0 : spacing.sm },
        ]}
      >
        <View style={styles.headerText}>
          <Text
            style={[
              typography.displayLg,
              { color: colors.textPrimary, marginBottom: spacing.xxs },
            ]}
          >
            QuickKit
          </Text>
          <Text
            style={[
              typography.bodyLg,
              { color: colors.textSecondary, marginBottom: spacing.lg },
            ]}
          >
            Everyday tools that just work.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/history" as never)}
            accessibilityRole="button"
            accessibilityLabel="History"
            hitSlop={10}
            style={{ marginRight: spacing.md }}
          >
            <Ionicons
              name="time-outline"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings" as never)}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={10}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        {tools.map((tool) => (
          <View key={tool.key} style={styles.gridItem}>
            <ToolCard
              title={tool.title}
              subtitle={tool.subtitle}
              accentColor={tool.accentColor}
              icon={
                <Ionicons name={tool.icon} size={22} color={tool.accentColor} />
              }
              onPress={() => router.push(tool.route as never)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
});
