import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Central settings schema. Add new keys here so every read/write
 * stays type-checked against a single source of truth.
 */
export interface SettingsSchema {
  themePreference: "light" | "dark" | "system";
  hasSeenOnboarding: boolean;
  hasSeenPrivacyNotice: boolean;
}

const NAMESPACE = "@quickkit/settings/";

export async function getSetting<K extends keyof SettingsSchema>(
  key: K,
  fallback: SettingsSchema[K],
): Promise<SettingsSchema[K]> {
  try {
    const raw = await AsyncStorage.getItem(NAMESPACE + key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as SettingsSchema[K];
  } catch {
    // Corrupt or inaccessible storage should never crash the app —
    // fall back to the default and let the user re-set it.
    return fallback;
  }
}

export async function setSetting<K extends keyof SettingsSchema>(
  key: K,
  value: SettingsSchema[K],
): Promise<void> {
  try {
    await AsyncStorage.setItem(NAMESPACE + key, JSON.stringify(value));
  } catch {
    // Best-effort persistence. Swallow write failures (e.g. storage full)
    // rather than crashing a settings toggle.
  }
}

export async function clearAllSettings(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const settingsKeys = keys.filter((k) => k.startsWith(NAMESPACE));
  await AsyncStorage.multiRemove(settingsKeys);
}
