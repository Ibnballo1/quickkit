export interface DiscountResult {
  originalPrice: number;
  discountPercent: number;
  amountSaved: number;
  finalPrice: number;
}

export function calculateDiscount(
  originalPrice: number,
  discountPercent: number,
): DiscountResult {
  const clampedPercent = Math.max(0, Math.min(100, discountPercent));
  const amountSaved = (clampedPercent / 100) * originalPrice;
  return {
    originalPrice,
    discountPercent: clampedPercent,
    amountSaved,
    finalPrice: originalPrice - amountSaved,
  };
}
