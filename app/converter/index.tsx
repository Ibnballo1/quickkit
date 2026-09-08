import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { useTheme } from "@/theme/ThemeProvider";
import { CATEGORY_LABELS, UnitCategory } from "@/features/unit-converter/units";

const CATEGORY_ICONS: Record<UnitCategory, keyof typeof Ionicons.glyphMap> = {
  length: "resize-outline",
  weight: "barbell-outline",
  temperature: "thermometer-outline",
  area: "square-outline",
  volume: "water-outline",
  speed: "speedometer-outline",
  time: "time-outline",
  digital: "save-outline",
};

export default function ConverterCategoryScreen(): React.JSX.Element {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const categories = Object.keys(CATEGORY_LABELS) as UnitCategory[];

  return (
    <ToolScreenLayout title="Unit Converter">
      {categories.map((category) => (
        <Pressable
          key={category}
          onPress={() => router.push(`/converter/${category}` as never)}
          accessibilityRole="button"
          accessibilityLabel={CATEGORY_LABELS[category]}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.md,
              padding: spacing.sm,
              marginBottom: spacing.xs,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons
            name={CATEGORY_ICONS[category]}
            size={20}
            color={colors.primary}
            style={{ marginRight: spacing.sm }}
          />
          <Text style={[typography.bodyLg, { color: colors.textPrimary }]}>
            {CATEGORY_LABELS[category]}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
            style={styles.chevron}
          />
        </Pressable>
      ))}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  chevron: {
    marginLeft: "auto",
  },
});
