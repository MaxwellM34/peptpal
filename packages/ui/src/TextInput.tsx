import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextInput({ label, error, hint, className, ...props }: TextInputProps) {
  return (
    <View className="gap-1.5">
      {label && <Text className="text-slate-300 text-sm font-medium">{label}</Text>}
      <RNTextInput
        className={`bg-surface-elevated border ${error ? 'border-danger-500' : 'border-surface-border'} rounded-xl px-4 py-3 text-white text-base ${className ?? ''}`}
        placeholderTextColor="#64748b"
        selectionColor="#3b82f6"
        {...props}
      />
      {error && <Text className="text-danger-400 text-xs">{error}</Text>}
      {hint && !error && <Text className="text-slate-500 text-xs">{hint}</Text>}
    </View>
  );
}
