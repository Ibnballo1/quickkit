import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
