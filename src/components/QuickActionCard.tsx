import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

/**
 * A single prominent "just do the common thing" entry point, distinct
 * from the regular ToolCard grid — per the product roadmap, more of
 * these are coming in a later version (Smart Quick Actions), so this is
 * built as a small reusable piece rather than one-off inline styling.
 */
export function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: QuickActionCardProps): React.JSX.Element {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.primary,
          borderRadius: radii.lg,
          padding: spacing.md,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: radii.md,
            marginRight: spacing.sm,
          },
        ]}
      >
        <Ionicons name={icon} size={22} color={colors.onPrimary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[typography.h3, { color: colors.onPrimary }]}>
          {title}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.onPrimary, opacity: 0.85 },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
});
