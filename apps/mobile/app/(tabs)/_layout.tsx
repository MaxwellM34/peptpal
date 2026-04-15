import React from 'react';
import { Tabs } from 'expo-router';
import { TwoRowTabBar } from '../../src/components/TwoRowTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TwoRowTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="library/index" options={{ title: 'Peptide Library' }} />
      <Tabs.Screen name="log/index" options={{ title: 'Injection Log' }} />
      <Tabs.Screen name="community/index" options={{ title: 'Community' }} />
      <Tabs.Screen name="symptoms/index" options={{ title: 'Symptoms' }} />
      <Tabs.Screen name="inventory/index" options={{ title: 'Inventory' }} />
      <Tabs.Screen name="schedule/index" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="settings/index" options={{ title: 'Settings' }} />

      {/* Hidden screens (navigated to programmatically) */}
      <Tabs.Screen name="library/[slug]" options={{ href: null }} />
      <Tabs.Screen name="library/goals" options={{ href: null }} />
      <Tabs.Screen name="library/blends" options={{ href: null }} />
      <Tabs.Screen name="log/new" options={{ href: null }} />
      <Tabs.Screen name="log/chart" options={{ href: null }} />
      <Tabs.Screen name="log/sites" options={{ href: null }} />
      <Tabs.Screen name="symptoms/new" options={{ href: null }} />
      <Tabs.Screen name="inventory/[id]" options={{ href: null }} />
      <Tabs.Screen name="schedule/new" options={{ href: null }} />
      <Tabs.Screen name="schedule/cycles" options={{ href: null }} />
      <Tabs.Screen name="biomarkers" options={{ href: null }} />
      <Tabs.Screen name="community/[slug]" options={{ href: null }} />
      <Tabs.Screen name="community/new" options={{ href: null }} />
    </Tabs>
  );
}
