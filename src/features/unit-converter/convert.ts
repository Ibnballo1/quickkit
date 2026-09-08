import { UNIT_DEFINITIONS, UnitCategory } from "./units";

function celsiusToKelvin(c: number): number {
  return c + 273.15;
}
function kelvinToCelsius(k: number): number {
  return k - 273.15;
}
function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}
function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function convertTemperature(
  value: number,
  fromId: string,
  toId: string,
): number {
  if (fromId === toId) return value;

  // Normalize to Celsius first, then out to the target — keeps the
  // conversion table at 4 well-tested functions instead of 6 pairs.
  let celsius: number;
  switch (fromId) {
    case "celsius":
      celsius = value;
      break;
    case "fahrenheit":
      celsius = fahrenheitToCelsius(value);
      break;
    case "kelvin":
      celsius = kelvinToCelsius(value);
      break;
    default:
      throw new Error(`Unknown temperature unit: ${fromId}`);
  }

  switch (toId) {
    case "celsius":
      return celsius;
    case "fahrenheit":
      return celsiusToFahrenheit(celsius);
    case "kelvin":
      return celsiusToKelvin(celsius);
    default:
      throw new Error(`Unknown temperature unit: ${toId}`);
  }
}

export function convertLinear(
  value: number,
  category: Exclude<UnitCategory, "temperature">,
  fromId: string,
  toId: string,
): number {
  const table = UNIT_DEFINITIONS[category];
  const from = table[fromId];
  const to = table[toId];
  if (!from || !to) {
    throw new Error(
      `Unknown unit for category ${category}: ${fromId} -> ${toId}`,
    );
  }
  const baseValue = value * from.toBase;
  return baseValue / to.toBase;
}

export function convert(
  value: number,
  category: UnitCategory,
  fromId: string,
  toId: string,
): number {
  if (category === "temperature") {
    return convertTemperature(value, fromId, toId);
  }
  return convertLinear(value, category, fromId, toId);
}
