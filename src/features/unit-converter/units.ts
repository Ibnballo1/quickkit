export type UnitCategory =
  | "length"
  | "weight"
  | "temperature"
  | "area"
  | "volume"
  | "speed"
  | "time"
  | "digital";

export interface UnitDefinition {
  id: string;
  label: string;
  /** Short symbol shown next to values, e.g. "km", "°C". */
  symbol: string;
}

export const CATEGORY_LABELS: Record<UnitCategory, string> = {
  length: "Length",
  weight: "Weight / Mass",
  temperature: "Temperature",
  area: "Area",
  volume: "Volume",
  speed: "Speed",
  time: "Time",
  digital: "Digital Storage",
};

/**
 * Linear-conversion categories store a factor relative to a single base unit
 * (documented per category). Temperature is handled separately in convert.ts
 * because °F/°C/K are affine, not linear, conversions.
 */
export const UNIT_DEFINITIONS: Record<
  Exclude<UnitCategory, "temperature">,
  Record<string, UnitDefinition & { toBase: number }>
> = {
  // Base unit: meters
  length: {
    mm: { id: "mm", label: "Millimeters", symbol: "mm", toBase: 0.001 },
    cm: { id: "cm", label: "Centimeters", symbol: "cm", toBase: 0.01 },
    m: { id: "m", label: "Meters", symbol: "m", toBase: 1 },
    km: { id: "km", label: "Kilometers", symbol: "km", toBase: 1000 },
    in: { id: "in", label: "Inches", symbol: "in", toBase: 0.0254 },
    ft: { id: "ft", label: "Feet", symbol: "ft", toBase: 0.3048 },
    yd: { id: "yd", label: "Yards", symbol: "yd", toBase: 0.9144 },
    mi: { id: "mi", label: "Miles", symbol: "mi", toBase: 1609.344 },
  },
  // Base unit: grams
  weight: {
    mg: { id: "mg", label: "Milligrams", symbol: "mg", toBase: 0.001 },
    g: { id: "g", label: "Grams", symbol: "g", toBase: 1 },
    kg: { id: "kg", label: "Kilograms", symbol: "kg", toBase: 1000 },
    oz: { id: "oz", label: "Ounces", symbol: "oz", toBase: 28.349523125 },
    lb: { id: "lb", label: "Pounds", symbol: "lb", toBase: 453.59237 },
    tonne: {
      id: "tonne",
      label: "Metric Tons",
      symbol: "t",
      toBase: 1_000_000,
    },
  },
  // Base unit: square meters
  area: {
    sqm: { id: "sqm", label: "Square Meters", symbol: "m²", toBase: 1 },
    sqkm: {
      id: "sqkm",
      label: "Square Kilometers",
      symbol: "km²",
      toBase: 1_000_000,
    },
    sqft: {
      id: "sqft",
      label: "Square Feet",
      symbol: "ft²",
      toBase: 0.09290304,
    },
    acre: { id: "acre", label: "Acres", symbol: "ac", toBase: 4046.8564224 },
    hectare: { id: "hectare", label: "Hectares", symbol: "ha", toBase: 10000 },
  },
  // Base unit: liters
  volume: {
    ml: { id: "ml", label: "Milliliters", symbol: "mL", toBase: 0.001 },
    l: { id: "l", label: "Liters", symbol: "L", toBase: 1 },
    galUs: {
      id: "galUs",
      label: "US Gallons",
      symbol: "gal",
      toBase: 3.785411784,
    },
    cupUs: {
      id: "cupUs",
      label: "US Cups",
      symbol: "cup",
      toBase: 0.2365882365,
    },
    flOzUs: {
      id: "flOzUs",
      label: "US Fluid Ounces",
      symbol: "fl oz",
      toBase: 0.0295735295625,
    },
  },
  // Base unit: meters per second
  speed: {
    mps: { id: "mps", label: "Meters/sec", symbol: "m/s", toBase: 1 },
    kph: {
      id: "kph",
      label: "Kilometers/hour",
      symbol: "km/h",
      toBase: 0.277778,
    },
    mph: { id: "mph", label: "Miles/hour", symbol: "mph", toBase: 0.44704 },
    knot: { id: "knot", label: "Knots", symbol: "kn", toBase: 0.514444 },
  },
  // Base unit: seconds
  time: {
    ms: { id: "ms", label: "Milliseconds", symbol: "ms", toBase: 0.001 },
    sec: { id: "sec", label: "Seconds", symbol: "s", toBase: 1 },
    min: { id: "min", label: "Minutes", symbol: "min", toBase: 60 },
    hour: { id: "hour", label: "Hours", symbol: "hr", toBase: 3600 },
    day: { id: "day", label: "Days", symbol: "day", toBase: 86400 },
    week: { id: "week", label: "Weeks", symbol: "wk", toBase: 604800 },
  },
  // Base unit: bytes
  digital: {
    bit: { id: "bit", label: "Bits", symbol: "b", toBase: 0.125 },
    byte: { id: "byte", label: "Bytes", symbol: "B", toBase: 1 },
    kb: { id: "kb", label: "Kilobytes", symbol: "KB", toBase: 1024 },
    mb: { id: "mb", label: "Megabytes", symbol: "MB", toBase: 1024 ** 2 },
    gb: { id: "gb", label: "Gigabytes", symbol: "GB", toBase: 1024 ** 3 },
    tb: { id: "tb", label: "Terabytes", symbol: "TB", toBase: 1024 ** 4 },
  },
};

export const TEMPERATURE_UNITS: UnitDefinition[] = [
  { id: "celsius", label: "Celsius", symbol: "°C" },
  { id: "fahrenheit", label: "Fahrenheit", symbol: "°F" },
  { id: "kelvin", label: "Kelvin", symbol: "K" },
];
