import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library/index"
        options={{
          title: 'Peptide Library',
          tabBarLabel: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="log/index"
        options={{
          title: 'Injection Log',
          tabBarLabel: 'Log',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💉" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="symptoms/index"
        options={{
          title: 'Symptoms',
          tabBarLabel: 'Symptoms',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: 'Inventory',
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧪" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule/index"
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
      {/* Hidden screens (navigated to programmatically) */}
      <Tabs.Screen name="library/[slug]" options={{ href: null }} />
      <Tabs.Screen name="log/new" options={{ href: null }} />
      <Tabs.Screen name="log/chart" options={{ href: null }} />
      <Tabs.Screen name="symptoms/new" options={{ href: null }} />
      <Tabs.Screen name="inventory/[id]" options={{ href: null }} />
      <Tabs.Screen name="schedule/new" options={{ href: null }} />
    </Tabs>
  );
}
