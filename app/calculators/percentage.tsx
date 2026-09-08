import React, { useMemo, useState } from "react";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { InputField } from "@/components/InputField";
import { ResultCard } from "@/components/ResultCard";
import { ChipGroup } from "@/components/ChipGroup";
import {
  xPercentOfY,
  percentChange,
  percentDifference,
} from "@/features/calculators/percentage";
import { formatAmount, formatPercent } from "@/utils/formatNumber";
import { useDebouncedHistoryLog } from "@/hooks/useDebouncedHistoryLog";

type Mode = "xOfY" | "change" | "difference";

function parseOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function PercentageCalculatorScreen(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>("xOfY");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const result = useMemo(() => {
    const numA = parseOrNull(a);
    const numB = parseOrNull(b);
    if (numA === null || numB === null) return null;

    if (mode === "xOfY") {
      const { result: value } = xPercentOfY(numA, numB);
      return [
        { label: `${a}% of ${b}`, value: formatAmount(value), emphasis: true },
      ];
    }
    if (mode === "change") {
      const { percentChange: pct, direction } = percentChange(numA, numB);
      const label =
        direction === "increase"
          ? "Increase"
          : direction === "decrease"
            ? "Decrease"
            : "No change";
      return [{ label, value: formatPercent(pct), emphasis: true }];
    }
    const { percentDifference: pct } = percentDifference(numA, numB);
    return [
      {
        label: "Percent difference",
        value: formatPercent(pct),
        emphasis: true,
      },
    ];
  }, [a, b, mode]);

  const fieldLabels: Record<Mode, [string, string]> = {
    xOfY: ["X (percentage)", "Y (value)"],
    change: ["From value", "To value"],
    difference: ["Value A", "Value B"],
  };

  useDebouncedHistoryLog(
    result
      ? {
          kind: "calculation",
          title:
            mode === "xOfY"
              ? `${a}% of ${b}`
              : mode === "change"
                ? `% change: ${a} → ${b}`
                : `% difference: ${a} vs ${b}`,
          subtitle: result[0]?.value ?? "",
          data: { mode, a, b },
        }
      : null,
  );

  return (
    <ToolScreenLayout title="Percentage" showResultAd={result !== null}>
      <ChipGroup
        options={[
          { value: "xOfY", label: "X% of Y" },
          { value: "change", label: "% Change" },
          { value: "difference", label: "% Difference" },
        ]}
        value={mode}
        onChange={(v) => setMode(v)}
        accessibilityLabel="Calculation mode"
      />
      <InputField
        label={fieldLabels[mode][0]}
        keyboardType="numeric"
        value={a}
        onChangeText={setA}
      />
      <InputField
        label={fieldLabels[mode][1]}
        keyboardType="numeric"
        value={b}
        onChangeText={setB}
      />
      {result ? <ResultCard rows={result} /> : null}
    </ToolScreenLayout>
  );
}
