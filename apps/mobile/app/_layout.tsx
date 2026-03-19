import '../global.css';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../src/db/client';
import { DisclaimerModal } from './modals/disclaimer';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const DISCLAIMER_KEY = 'disclaimer_acknowledged_v1';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await getDb();

        const ack = await SecureStore.getItemAsync(DISCLAIMER_KEY);
        if (!ack) {
          setShowDisclaimer(true);
        }
      } finally {
        setDbReady(true);
        await SplashScreen.hideAsync();
      }
    }
    void init();
  }, []);

  async function handleDisclaimerAck() {
    await SecureStore.setItemAsync(DISCLAIMER_KEY, 'true');
    setShowDisclaimer(false);
  }

  if (!dbReady) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <View className="flex-1 bg-surface">
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: '#0f172a' },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modals/dose-warning"
                options={{ presentation: 'modal', title: 'Dose Warning' }}
              />
              <Stack.Screen
                name="modals/reconstitution-calc"
                options={{ presentation: 'modal', title: 'Reconstitution Calculator' }}
              />
            </Stack>
          </View>
          <DisclaimerModal visible={showDisclaimer} onAcknowledge={handleDisclaimerAck} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
