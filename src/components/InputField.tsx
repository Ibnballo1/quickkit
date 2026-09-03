import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface InputFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  suffix?: string;
}

export function InputField({
  label,
  error,
  suffix,
  ...inputProps
}: InputFieldProps): React.JSX.Element {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginBottom: spacing.xxs },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.wrap,
          {
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.sm,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.textTertiary}
          style={[
            typography.bodyLg,
            styles.input,
            { color: colors.textPrimary },
          ]}
          accessibilityLabel={label}
        />
        {suffix ? (
          <Text style={[typography.body, { color: colors.textTertiary }]}>
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text
          style={[
            typography.caption,
            { color: colors.danger, marginTop: spacing.xxs },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
});
