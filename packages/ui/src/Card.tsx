import React from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  elevated?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = false, children, className, ...props }: CardProps) {
  return (
    <View
      className={`${elevated ? 'bg-surface-elevated' : 'bg-surface-card'} rounded-2xl p-4 ${className ?? ''}`}
      {...props}
    >
      {children}
    </View>
  );
}
