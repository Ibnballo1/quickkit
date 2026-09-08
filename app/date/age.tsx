import React, { useMemo, useState } from "react";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { ResultCard } from "@/components/ResultCard";
import { DateFields, fieldsToDate } from "@/components/DateFields";
import { Text } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { calculateAge } from "@/features/date-tools/ageCalculator";
import { useDebouncedHistoryLog } from "@/hooks/useDebouncedHistoryLog";

export default function AgeCalculatorScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const { result, error } = useMemo(() => {
    if (!day || !month || !year) return { result: null, error: undefined };
    const birthDate = fieldsToDate(day, month, year);
    if (!birthDate) return { result: null, error: "Enter a valid date." };
    try {
      return { result: calculateAge(birthDate), error: undefined };
    } catch {
      return {
        result: null,
        error: "Date of birth must not be in the future.",
      };
    }
  }, [day, month, year]);

  useDebouncedHistoryLog(
    result
      ? {
          kind: "age",
          title: `Age from ${day}/${month}/${year}`,
          subtitle: `${result.years}y ${result.months}m ${result.days}d`,
          data: { day, month, year },
        }
      : null,
  );

  return (
    <ToolScreenLayout title="Age Calculator" showResultAd={result !== null}>
      <DateFields
        label="Date of birth"
        day={day}
        month={month}
        year={year}
        onChangeDay={setDay}
        onChangeMonth={setMonth}
        onChangeYear={setYear}
      />
      {error ? (
        <Text
          style={[
            typography.caption,
            { color: colors.danger, marginTop: spacing.xs },
          ]}
        >
          {error}
        </Text>
      ) : null}
      {result ? (
        <ResultCard
          title="Your age"
          rows={[
            {
              label: "Years, months, days",
              value: `${result.years}y ${result.months}m ${result.days}d`,
              emphasis: true,
            },
            { label: "Total weeks", value: result.totalWeeks.toLocaleString() },
            { label: "Total days", value: result.totalDays.toLocaleString() },
          ]}
        />
      ) : null}
    </ToolScreenLayout>
  );
}
