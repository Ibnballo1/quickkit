import React, { useMemo, useState } from "react";
import { Text } from "react-native";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { ResultCard } from "@/components/ResultCard";
import { InputField } from "@/components/InputField";
import { ChipGroup } from "@/components/ChipGroup";
import { DateFields, fieldsToDate } from "@/components/DateFields";
import { useTheme } from "@/theme/ThemeProvider";
import {
  calculateDateDifference,
  addDaysToDate,
} from "@/features/date-tools/dateDifference";
import { useDebouncedHistoryLog } from "@/hooks/useDebouncedHistoryLog";

type Mode = "duration" | "addSubtract";

export default function DateDifferenceScreen(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const [mode, setMode] = useState<Mode>("duration");

  const [startDay, setStartDay] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endDay, setEndDay] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [offsetDays, setOffsetDays] = useState("");

  const startDate = useMemo(
    () => fieldsToDate(startDay, startMonth, startYear),
    [startDay, startMonth, startYear],
  );
  const endDate = useMemo(
    () => fieldsToDate(endDay, endMonth, endYear),
    [endDay, endMonth, endYear],
  );

  const durationResult = useMemo(() => {
    if (mode !== "duration" || !startDate || !endDate) return null;
    return calculateDateDifference(startDate, endDate);
  }, [mode, startDate, endDate]);

  const offsetResult = useMemo(() => {
    if (mode !== "addSubtract" || !startDate) return null;
    const n = Number(offsetDays);
    if (!Number.isFinite(n)) return null;
    return addDaysToDate(startDate, n);
  }, [mode, startDate, offsetDays]);

  useDebouncedHistoryLog(
    durationResult
      ? {
          kind: "date_diff",
          title: `${startDay}/${startMonth}/${startYear} → ${endDay}/${endMonth}/${endYear}`,
          subtitle: `${durationResult.totalDays.toLocaleString()} days`,
          data: { startDay, startMonth, startYear, endDay, endMonth, endYear },
        }
      : offsetResult
        ? {
            kind: "date_diff",
            title: `${startDay}/${startMonth}/${startYear} ${Number(offsetDays) >= 0 ? "+" : ""}${offsetDays} days`,
            subtitle: offsetResult.toLocaleDateString(),
            data: { startDay, startMonth, startYear, offsetDays },
          }
        : null,
  );

  return (
    <ToolScreenLayout
      title="Date Difference"
      showResultAd={durationResult !== null || offsetResult !== null}
    >
      <ChipGroup
        options={[
          { value: "duration", label: "Duration between dates" },
          { value: "addSubtract", label: "Date ± N days" },
        ]}
        value={mode}
        onChange={setMode}
        accessibilityLabel="Mode"
      />

      <DateFields
        label={mode === "duration" ? "Start date" : "Date"}
        day={startDay}
        month={startMonth}
        year={startYear}
        onChangeDay={setStartDay}
        onChangeMonth={setStartMonth}
        onChangeYear={setStartYear}
      />

      {mode === "duration" ? (
        <DateFields
          label="End date"
          day={endDay}
          month={endMonth}
          year={endYear}
          onChangeDay={setEndDay}
          onChangeMonth={setEndMonth}
          onChangeYear={setEndYear}
        />
      ) : (
        <InputField
          label="Days to add (use a negative number to subtract)"
          keyboardType="numbers-and-punctuation"
          value={offsetDays}
          onChangeText={setOffsetDays}
        />
      )}

      {durationResult ? (
        <ResultCard
          title="Duration"
          rows={[
            {
              label: "Total days",
              value: durationResult.totalDays.toLocaleString(),
              emphasis: true,
            },
            {
              label: "Approx. years",
              value: durationResult.years.toLocaleString(),
            },
            {
              label: "Approx. months",
              value: durationResult.months.toLocaleString(),
            },
            { label: "Weeks", value: durationResult.weeks.toLocaleString() },
          ]}
        />
      ) : null}

      {offsetResult ? (
        <ResultCard
          title="Resulting date"
          rows={[
            {
              label: "Date",
              value: offsetResult.toLocaleDateString(),
              emphasis: true,
            },
          ]}
        />
      ) : null}
    </ToolScreenLayout>
  );
}
