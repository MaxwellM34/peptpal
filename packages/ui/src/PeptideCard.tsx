import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Badge } from './Badge';

interface PeptideCardProps {
  name: string;
  aliases?: string[];
  storageTemp: 'fridge' | 'freezer';
  routes: string[];
  halfLifeHours?: number | null;
  onPress?: () => void;
}

const routeLabel: Record<string, string> = {
  subq: 'SubQ',
  im: 'IM',
  intranasal: 'Intranasal',
  topical: 'Topical',
};

export function PeptideCard({
  name,
  aliases,
  storageTemp,
  routes,
  halfLifeHours,
  onPress,
}: PeptideCardProps) {
  return (
    <TouchableOpacity
      className="bg-surface-card rounded-2xl p-4 mb-3 active:bg-surface-elevated"
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-white text-base font-bold">{name}</Text>
          {aliases && aliases.length > 0 && (
            <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
              {aliases.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
        <Badge variant={storageTemp === 'freezer' ? 'info' : 'success'}>
          {storageTemp === 'freezer' ? '❄ Freezer' : '🧊 Fridge'}
        </Badge>
      </View>

      <View className="flex-row flex-wrap gap-1.5 mt-3">
        {routes.map((r) => (
          <Badge key={r} variant="default">
            {routeLabel[r] ?? r}
          </Badge>
        ))}
        {halfLifeHours != null && (
          <Badge variant="default">t½ {halfLifeHours < 1 ? `${(halfLifeHours * 60).toFixed(0)}min` : `${halfLifeHours}h`}</Badge>
        )}
      </View>
    </TouchableOpacity>
  );
}
