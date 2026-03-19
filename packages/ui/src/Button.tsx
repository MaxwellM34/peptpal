import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-primary-600 active:bg-primary-700', text: 'text-white font-semibold' },
  secondary: { container: 'bg-surface-elevated border border-surface-border active:bg-surface-card', text: 'text-white font-medium' },
  danger: { container: 'bg-danger-600 active:bg-danger-700', text: 'text-white font-semibold' },
  ghost: { container: 'bg-transparent active:bg-surface-elevated', text: 'text-primary-400 font-medium' },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-3 py-1.5 rounded-lg', text: 'text-sm' },
  md: { container: 'px-4 py-2.5 rounded-xl', text: 'text-base' },
  lg: { container: 'px-6 py-3.5 rounded-xl', text: 'text-lg' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`${v.container} ${s.container} flex-row items-center justify-center gap-2 ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color="white" />}
      <Text className={`${v.text} ${s.text}`}>{children}</Text>
    </TouchableOpacity>
  );
}
