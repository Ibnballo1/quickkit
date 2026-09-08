import React, { useMemo, useState } from "react";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { InputField } from "@/components/InputField";
import { ResultCard } from "@/components/ResultCard";
import { calculateDiscount } from "@/features/calculators/discount";
import { formatAmount } from "@/utils/formatNumber";
import { useDebouncedHistoryLog } from "@/hooks/useDebouncedHistoryLog";

function parseOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function DiscountCalculatorScreen(): React.JSX.Element {
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");

  const result = useMemo(() => {
    const numPrice = parseOrNull(price);
    const numDiscount = parseOrNull(discount);
    if (numPrice === null || numDiscount === null || numPrice < 0) return null;
    return calculateDiscount(numPrice, numDiscount);
  }, [price, discount]);

  useDebouncedHistoryLog(
    result
      ? {
          kind: "calculation",
          title: `${result.discountPercent}% off ${formatAmount(result.originalPrice)}`,
          subtitle: `Final: ${formatAmount(result.finalPrice)}`,
          data: { price, discount },
        }
      : null,
  );

  return (
    <ToolScreenLayout title="Discount" showResultAd={result !== null}>
      <InputField
        label="Original price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />
      <InputField
        label="Discount"
        keyboardType="numeric"
        value={discount}
        onChangeText={setDiscount}
        suffix="%"
      />
      {result ? (
        <ResultCard
          title="Result"
          rows={[
            { label: "You save", value: formatAmount(result.amountSaved) },
            {
              label: "Final price",
              value: formatAmount(result.finalPrice),
              emphasis: true,
            },
          ]}
          footnote="Amounts are shown without a currency symbol — apply your local currency."
        />
      ) : null}
    </ToolScreenLayout>
  );
}
