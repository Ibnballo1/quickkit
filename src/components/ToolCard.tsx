import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface ToolCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  accentColor?: string;
}

export function ToolCard({
  title,
  subtitle,
  icon,
  onPress,
  accentColor,
}: ToolCardProps): React.JSX.Element {
  const { colors, typography, spacing, radii, elevation } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.card,
        elevation.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderColor: colors.border,
          padding: spacing.md,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: (accentColor ?? colors.primary) + "1A",
            borderRadius: radii.md,
            marginBottom: spacing.sm,
          },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[typography.h3, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, marginTop: 2 },
        ]}
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 120,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
