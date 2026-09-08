import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { ToolScreenLayout } from "@/components/ToolScreenLayout";
import { ChipGroup } from "@/components/ChipGroup";
import { useTheme } from "@/theme/ThemeProvider";
import {
  getHistory,
  deleteHistoryEntry,
  clearHistory,
  HistoryEntry,
  HistoryKind,
} from "@/services/historyStorage";

type FilterKey = "all" | HistoryKind;

const KIND_ICON: Record<HistoryKind, keyof typeof Ionicons.glyphMap> = {
  qr_scan: "scan-outline",
  qr_generate: "qr-code-outline",
  calculation: "calculator-outline",
  conversion: "swap-horizontal-outline",
  age: "calendar-outline",
  date_diff: "time-outline",
  image_edit: "crop-outline",
};

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "qr_scan", label: "QR Scans" },
  { value: "qr_generate", label: "QR Codes" },
  { value: "calculation", label: "Calculations" },
  { value: "conversion", label: "Conversions" },
  { value: "age", label: "Age" },
  { value: "date_diff", label: "Dates" },
  { value: "image_edit", label: "Image Edits" },
];

export default function HistoryScreen(): React.JSX.Element {
  const { colors, typography, spacing, radii } = useTheme();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const kind = filter === "all" ? undefined : filter;
    const result = await getHistory(kind);
    setEntries(result);
    setIsLoading(false);
  }, [filter]);

  // Reload every time the screen gains focus, since history is written from
  // other screens (compress, scan, convert, etc.) that this screen never
  // directly observes.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = (id: string): void => {
    Alert.alert("Delete entry", "Remove this item from your history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteHistoryEntry(id);
          void load();
        },
      },
    ]);
  };

  const handleClearAll = (): void => {
    if (entries.length === 0) return;
    Alert.alert(
      "Clear history",
      filter === "all"
        ? "Remove all history entries? This cannot be undone."
        : "Remove all entries in this category?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearHistory(filter === "all" ? undefined : filter);
            void load();
          },
        },
      ],
    );
  };

  return (
    <ToolScreenLayout
      title="History"
      rightAction={{
        icon: "trash-outline",
        onPress: handleClearAll,
        accessibilityLabel: "Clear history",
      }}
    >
      <ChipGroup
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Filter history"
      />

      {!isLoading && entries.length === 0 ? (
        <View style={[styles.empty, { paddingVertical: spacing.xl }]}>
          <Ionicons name="time-outline" size={32} color={colors.textTertiary} />
          <Text
            style={[
              typography.body,
              { color: colors.textTertiary, marginTop: spacing.sm },
            ]}
          >
            Nothing here yet. Things you scan, generate, or calculate will show
            up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              <Ionicons
                name={KIND_ICON[item.kind]}
                size={18}
                color={colors.primary}
                style={{ marginRight: spacing.sm }}
              />
              <View style={styles.rowText}>
                <Text
                  style={[typography.body, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginTop: 2 },
                  ]}
                >
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDelete(item.id)}
                accessibilityRole="button"
                accessibilityLabel="Delete entry"
                hitSlop={10}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
          )}
        />
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  empty: {
    alignItems: "center",
  },
});
