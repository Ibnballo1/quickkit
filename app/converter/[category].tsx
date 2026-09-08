import React, { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { InputField } from "@/components/InputField";
import { ResultCard } from "@/components/ResultCard";
import { ChipGroup } from "@/components/ChipGroup";
import {
  CATEGORY_LABELS,
  TEMPERATURE_UNITS,
  UNIT_DEFINITIONS,
  UnitCategory,
  UnitDefinition,
} from "@/features/unit-converter/units";
import { convert } from "@/features/unit-converter/convert";
import { useDebouncedHistoryLog } from "@/hooks/useDebouncedHistoryLog";

function getUnitsForCategory(category: UnitCategory): UnitDefinition[] {
  if (category === "temperature") {
    return TEMPERATURE_UNITS;
  }
  return Object.values(UNIT_DEFINITIONS[category]);
}

function isValidCategory(value: string): value is UnitCategory {
  return value in CATEGORY_LABELS;
}

export default function UnitCategoryConverterScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ category: string }>();
  const category: UnitCategory = isValidCategory(params.category)
    ? params.category
    : "length";
  const units = useMemo(() => getUnitsForCategory(category), [category]);

  const [fromId, setFromId] = useState(units[0]?.id ?? "");
  const [toId, setToId] = useState(units[1]?.id ?? units[0]?.id ?? "");
  const [value, setValue] = useState("1");

  const result = useMemo(() => {
    const numValue = Number(value);
    if (!Number.isFinite(numValue) || !fromId || !toId) return null;
    try {
      const converted = convert(numValue, category, fromId, toId);
      const toUnit = units.find((u) => u.id === toId);
      return { converted, symbol: toUnit?.symbol ?? "" };
    } catch {
      return null;
    }
  }, [value, fromId, toId, category, units]);

  const chipOptions = units.map((u) => ({
    value: u.id,
    label: `${u.label} (${u.symbol})`,
  }));

  useDebouncedHistoryLog(
    result
      ? {
          kind: "conversion",
          title: `${value} ${fromId} → ${toId}`,
          subtitle: `${result.converted.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${result.symbol}`,
          data: { category, value, fromId, toId },
        }
      : null,
  );

  return (
    <ToolScreenLayout
      title={CATEGORY_LABELS[category]}
      showResultAd={result !== null}
    >
      <InputField
        label="Value"
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
      />

      <ChipGroup
        options={chipOptions}
        value={fromId}
        onChange={setFromId}
        accessibilityLabel="Convert from"
      />
      <ChipGroup
        options={chipOptions}
        value={toId}
        onChange={setToId}
        accessibilityLabel="Convert to"
      />

      {result ? (
        <ResultCard
          rows={[
            {
              label: "Result",
              value: `${result.converted.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${result.symbol}`,
              emphasis: true,
            },
          ]}
        />
      ) : null}
    </ToolScreenLayout>
  );
}
