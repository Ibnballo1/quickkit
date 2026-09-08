import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  accessory?: React.ReactNode;
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  accessory,
}: SettingsRowProps): React.JSX.Element {
  const { colors, typography, spacing, radii } = useTheme();
  const tint = destructive ? colors.danger : colors.textPrimary;

  const content = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.sm,
          marginBottom: spacing.xs,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors.danger : colors.primary}
        style={{ marginRight: spacing.sm }}
      />
      <Text style={[typography.bodyLg, { color: tint, flex: 1 }]}>{label}</Text>
      {accessory ??
        (value ? (
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginRight: spacing.xxs },
            ]}
          >
            {value}
          </Text>
        ) : null)}
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
