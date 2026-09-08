export interface XPercentOfYResult {
  result: number;
}

export interface PercentChangeResult {
  percentChange: number;
  direction: "increase" | "decrease" | "none";
}

export interface PercentDifferenceResult {
  percentDifference: number;
}

/** What is X% of Y? */
export function xPercentOfY(x: number, y: number): XPercentOfYResult {
  return { result: (x / 100) * y };
}

/** Percent increase/decrease from `from` to `to`. */
export function percentChange(from: number, to: number): PercentChangeResult {
  if (from === 0) {
    return {
      percentChange: to === 0 ? 0 : Infinity,
      direction: to > 0 ? "increase" : to < 0 ? "decrease" : "none",
    };
  }
  const change = ((to - from) / Math.abs(from)) * 100;
  return {
    percentChange: Math.abs(change),
    direction: change > 0 ? "increase" : change < 0 ? "decrease" : "none",
  };
}

/** Symmetric percent difference between two values (relative to their average). */
export function percentDifference(
  a: number,
  b: number,
): PercentDifferenceResult {
  const average = (Math.abs(a) + Math.abs(b)) / 2;
  if (average === 0) {
    return { percentDifference: 0 };
  }
  return { percentDifference: (Math.abs(a - b) / average) * 100 };
}
