import React, { useCallback } from 'react';
import { View, Text, PanResponder, type LayoutChangeEvent } from 'react-native';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  onValueChange: (v: number) => void;
}

export function Slider({ value, min = 1, max = 10, step = 1, label, onValueChange }: SliderProps) {
  const [width, setWidth] = React.useState(0);
  const percent = ((value - min) / (max - min)) * 100;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      if (width === 0) return;
      const x = e.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / width));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      onValueChange(Math.max(min, Math.min(max, stepped)));
    },
    onPanResponderMove: (e) => {
      if (width === 0) return;
      const x = e.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / width));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      onValueChange(Math.max(min, Math.min(max, stepped)));
    },
  });

  return (
    <View className="gap-2">
      {label && (
        <View className="flex-row justify-between items-center">
          <Text className="text-slate-300 text-sm font-medium">{label}</Text>
          <Text className="text-primary-400 text-sm font-bold">{value}</Text>
        </View>
      )}
      <View className="h-8 justify-center" onLayout={onLayout} {...panResponder.panHandlers}>
        <View className="h-2 bg-surface-elevated rounded-full">
          <View
            className="h-2 bg-primary-500 rounded-full absolute"
            style={{ width: `${percent}%` }}
          />
          <View
            className="w-5 h-5 bg-primary-400 rounded-full absolute top-1/2 -mt-2.5 border-2 border-white shadow"
            style={{ left: `${percent}%`, marginLeft: -10 }}
          />
        </View>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-slate-500 text-xs">{min}</Text>
        <Text className="text-slate-500 text-xs">{max}</Text>
      </View>
    </View>
  );
}
