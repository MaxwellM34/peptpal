import React from 'react';
import { View, Text } from 'react-native';

type RowType = 'injection' | 'symptom';

interface TimelineRowProps {
  type: RowType;
  title: string;
  subtitle?: string;
  timestamp: string;
  isLast?: boolean;
}

const typeStyles = {
  injection: {
    dot: 'bg-primary-500',
    icon: '💉',
  },
  symptom: {
    dot: 'bg-warning-500',
    icon: '🔔',
  },
};

export function TimelineRow({ type, title, subtitle, timestamp, isLast = false }: TimelineRowProps) {
  const s = typeStyles[type];
  return (
    <View className="flex-row gap-3">
      {/* Timeline column */}
      <View className="items-center w-8">
        <View className={`w-3 h-3 rounded-full mt-1.5 ${s.dot}`} />
        {!isLast && <View className="w-0.5 flex-1 bg-surface-border mt-1" />}
      </View>

      {/* Content */}
      <View className="flex-1 pb-4">
        <View className="flex-row items-center gap-1.5">
          <Text>{s.icon}</Text>
          <Text className="text-white font-semibold text-sm">{title}</Text>
        </View>
        {subtitle && <Text className="text-slate-400 text-xs mt-0.5">{subtitle}</Text>}
        <Text className="text-slate-500 text-xs mt-1">{timestamp}</Text>
      </View>
    </View>
  );
}
