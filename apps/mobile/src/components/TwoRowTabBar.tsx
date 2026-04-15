import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Two-row tab bar: 4 tabs per row. Designed to fit 8 tabs on iPhone without
 * cramming labels. Active tab gets a blue accent + filled emoji opacity.
 *
 * Maps the Tabs route names to emoji + label metadata. Unknown tabs fall back
 * to the route name.
 */
const TAB_META: Record<string, { label: string; emoji: string; row: 0 | 1 }> = {
  'index':           { label: 'Home',      emoji: '🏠', row: 0 },
  'library/index':   { label: 'Library',   emoji: '📚', row: 0 },
  'log/index':       { label: 'Log',       emoji: '💉', row: 0 },
  'community/index': { label: 'Community', emoji: '💬', row: 0 },
  'symptoms/index':  { label: 'Symptoms',  emoji: '🔔', row: 1 },
  'inventory/index': { label: 'Inventory', emoji: '🧪', row: 1 },
  'schedule/index':  { label: 'Schedule',  emoji: '📅', row: 1 },
  'settings/index':  { label: 'Settings',  emoji: '⚙️', row: 1 },
};

export function TwoRowTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((r) => {
    const options = descriptors[r.key]?.options;
    // expo-router marks hidden screens with href: null, which propagates as
    // tabBarButton returning null. We also filter by our metadata map.
    if (!TAB_META[r.name]) return false;
    if (options && 'href' in options && options.href === null) return false;
    return true;
  });

  const row0 = visibleRoutes.filter((r) => TAB_META[r.name]?.row === 0);
  const row1 = visibleRoutes.filter((r) => TAB_META[r.name]?.row === 1);

  return (
    <View
      style={{
        backgroundColor: '#1e293b',
        borderTopColor: '#334155',
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 6,
        paddingTop: 4,
      }}
    >
      {[row0, row1].map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 }}>
          {row.map((route) => {
            const focused = state.index === state.routes.findIndex((r) => r.key === route.key);
            const meta = TAB_META[route.name]!;
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 6,
                  marginHorizontal: 2,
                  borderRadius: 10,
                  backgroundColor: focused ? '#1e40af22' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{meta.emoji}</Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: focused ? '#3b82f6' : '#64748b',
                    marginTop: 2,
                  }}
                >
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
