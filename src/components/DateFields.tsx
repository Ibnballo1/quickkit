import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { InputField } from "./InputField";
import { useTheme } from "@/theme/ThemeProvider";

interface DateFieldsProps {
  day: string;
  month: string;
  year: string;
  onChangeDay: (v: string) => void;
  onChangeMonth: (v: string) => void;
  onChangeYear: (v: string) => void;
  label: string;
}

/**
 * Three plain numeric fields rather than a native date-picker component.
 * @react-native-community/datetimepicker isn't in the project's current
 * dependency list — if you'd rather have a native calendar UI, add that
 * package and this can be swapped in without touching the calculation
 * logic in ageCalculator.ts / dateDifference.ts.
 */
export function DateFields({
  day,
  month,
  year,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  label,
}: DateFieldsProps): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={styles.container}>
      {/* Group Header Label sitting strictly above the row */}
      {label ? (
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      {/* Input Row */}
      <View style={styles.row}>
        <View style={styles.day}>
          <InputField
            label="Day"
            placeholder="DD"
            keyboardType="number-pad"
            value={day}
            onChangeText={onChangeDay}
            maxLength={2}
          />
        </View>
        <View style={styles.month}>
          <InputField
            label="Month"
            placeholder="MM"
            keyboardType="number-pad"
            value={month}
            onChangeText={onChangeMonth}
            maxLength={2}
          />
        </View>
        <View style={styles.year}>
          <InputField
            label="Year"
            placeholder="YYYY"
            keyboardType="number-pad"
            value={year}
            onChangeText={onChangeYear}
            maxLength={4}
          />
        </View>
      </View>
    </View>
  );
}

export function fieldsToDate(
  day: string,
  month: string,
  year: string,
): Date | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y))
    return null;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1000 || y > 9999) return null;

  const date = new Date(y, m - 1, d);
  // Reject e.g. Feb 30 rolling over to March — Date silently normalizes,
  // so we verify the components round-trip exactly.
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  )
    return null;
  return date;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  day: { flex: 1 },
  month: { flex: 1 },
  year: { flex: 1.3 },
});
