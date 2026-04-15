import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial } from '../lib/tutorialContext';

/**
 * Two-row tab bar: 4 tabs per row. Designed to fit 8 tabs on iPhone without
 * cramming labels. Active tab gets a blue accent + filled emoji opacity.
 *
 * Maps the Tabs route names to emoji + label metadata. Unknown tabs fall back
 * to the route name.
 */
const TAB_META: Record<
  string,
  { label: string; emoji: string; row: 0 | 1; hotspotId?: string }
> = {
  'index':           { label: 'Home',      emoji: '🏠', row: 0, hotspotId: 'tab.home' },
  'library/index':   { label: 'Library',   emoji: '📚', row: 0, hotspotId: 'tab.library' },
  'log/index':       { label: 'Log',       emoji: '💉', row: 0, hotspotId: 'tab.log' },
  'community/index': { label: 'Community', emoji: '💬', row: 0, hotspotId: 'tab.community' },
  'symptoms/index':  { label: 'Symptoms',  emoji: '🔔', row: 1, hotspotId: 'tab.symptoms' },
  'inventory/index': { label: 'Inventory', emoji: '🧪', row: 1, hotspotId: 'tab.inventory' },
  'schedule/index':  { label: 'Schedule',  emoji: '📅', row: 1, hotspotId: 'tab.schedule' },
  'settings/index':  { label: 'Settings',  emoji: '⚙️', row: 1, hotspotId: 'tab.settings' },
};

export function TwoRowTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { registerHotspot, onHotspotTapped, active: tutorialActive, stepIndex } = useTutorial();
  // Keep refs per tab so we can re-measure whenever the tutorial activates
  // or the current step changes (the spotlight may need a fresh measurement).
  const tabRefs = useRef<Map<string, View | null>>(new Map());

  useEffect(() => {
    if (!tutorialActive) return;
    // Re-measure every registered tab button against the window.
    const id = setTimeout(() => {
      tabRefs.current.forEach((node, hotspotId) => {
        if (!node) return;
        node.measureInWindow((wx, wy, ww, wh) => {
          if (ww > 0) registerHotspot(hotspotId, { x: wx, y: wy, width: ww, height: wh });
        });
      });
    }, 100);
    return () => clearTimeout(id);
  }, [tutorialActive, stepIndex, registerHotspot]);

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
                ref={(node) => {
                  if (meta.hotspotId) {
                    // Store node ref for later re-measurement on tutorial activation.
                    tabRefs.current.set(meta.hotspotId, node as unknown as View | null);
                  }
                }}
                onLayout={() => {
                  if (!meta.hotspotId) return;
                  const node = tabRefs.current.get(meta.hotspotId);
                  // measureInWindow on the next frame — onLayout's coords are local.
                  setTimeout(() => {
                    node?.measureInWindow((wx, wy, ww, wh) => {
                      if (ww > 0) registerHotspot(meta.hotspotId!, { x: wx, y: wy, width: ww, height: wh });
                    });
                  }, 30);
                }}
                onPress={() => {
                  if (meta.hotspotId) onHotspotTapped(meta.hotspotId);
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
