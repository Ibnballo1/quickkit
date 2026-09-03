import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: ChipGroupProps<T>): React.JSX.Element {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View
      style={[styles.wrap, { marginBottom: spacing.md }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[
              styles.chip,
              {
                borderRadius: radii.pill,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected
                  ? colors.primary + "1A"
                  : colors.surface,
                paddingVertical: spacing.xxs,
                paddingHorizontal: spacing.sm,
                marginRight: spacing.xs,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                typography.body,
                {
                  color: selected ? colors.primary : colors.textSecondary,
                  fontWeight: selected ? "600" : "400",
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
