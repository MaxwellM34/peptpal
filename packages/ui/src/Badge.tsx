import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-surface-elevated', text: 'text-slate-300' },
  success: { container: 'bg-emerald-900/50', text: 'text-emerald-400' },
  warning: { container: 'bg-warning-900/50', text: 'text-warning-400' },
  danger: { container: 'bg-danger-900/50', text: 'text-danger-400' },
  info: { container: 'bg-primary-900/50', text: 'text-primary-400' },
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const s = styles[variant];
  return (
    <View className={`${s.container} px-2.5 py-0.5 rounded-full ${className ?? ''}`}>
      <Text className={`${s.text} text-xs font-medium`}>{children}</Text>
    </View>
  );
}
