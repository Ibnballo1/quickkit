import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { ColorPalette, darkColors, lightColors } from "./colors";
import { typography } from "./typography";
import { spacing, radii, elevation } from "./spacing";
import { getSetting, setSetting } from "@/services/settingsStorage";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  colors: ColorPalette;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  elevation: typeof elevation;
  preference: ThemePreference;
  resolvedScheme: "light" | "dark";
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveScheme(
  pref: ThemePreference,
  system: ColorSchemeName,
): "light" | "dark" {
  if (pref === "system") {
    return system === "dark" ? "dark" : "light";
  }
  return pref;
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? "light",
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSetting("themePreference", "system").then((stored) => {
      if (mounted) {
        setPreferenceState(stored);
        setHydrated(true);
      }
    });
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "light");
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const setPreference = (pref: ThemePreference): void => {
    setPreferenceState(pref);
    void setSetting("themePreference", pref);
  };

  const resolvedScheme = resolveScheme(preference, systemScheme);
  const colors = resolvedScheme === "dark" ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      typography,
      spacing,
      radii,
      elevation,
      preference,
      resolvedScheme,
      setPreference,
    }),
    [colors, preference, resolvedScheme],
  );

  // Avoid a flash of the wrong theme before AsyncStorage resolves.
  if (!hydrated) {
    return <>{null}</>;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
