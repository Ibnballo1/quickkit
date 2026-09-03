import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface ResultRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

interface ResultCardProps {
  title?: string;
  rows: ResultRow[];
  footnote?: string;
}

export function ResultCard({
  title,
  rows,
  footnote,
}: ResultCardProps): React.JSX.Element {
  const { colors, typography, spacing, radii, elevation } = useTheme();

  return (
    <View
      style={[
        elevation.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          padding: spacing.md,
        },
      ]}
      accessibilityRole="summary"
    >
      {title ? (
        <Text
          style={[
            typography.h3,
            { color: colors.textPrimary, marginBottom: spacing.sm },
          ]}
        >
          {title}
        </Text>
      ) : null}
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[
            styles.row,
            {
              paddingVertical: spacing.xs,
              borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {row.label}
          </Text>
          <Text
            style={[
              row.emphasis ? typography.numeric : typography.bodyLg,
              { color: row.emphasis ? colors.primary : colors.textPrimary },
            ]}
          >
            {row.value}
          </Text>
        </View>
      ))}
      {footnote ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: spacing.xs },
          ]}
        >
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
