import '../global.css';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isDbAvailable, getDb } from '../src/db/client';
import { DisclaimerModal } from './modals/disclaimer';

const isWeb = Platform.OS === 'web';

// SplashScreen is native-only
if (!isWeb) {
  SplashScreen.preventAutoHideAsync();
}

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
  const [ready, setReady] = useState(isWeb); // web skips init gate
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        if (isDbAvailable()) {
          await getDb();
        }

        // SecureStore is native-only; use localStorage on web
        let ack: string | null;
        if (isWeb) {
          ack = typeof localStorage !== 'undefined'
            ? localStorage.getItem(DISCLAIMER_KEY)
            : 'true';
        } else {
          const SecureStore = await import('expo-secure-store');
          ack = await SecureStore.getItemAsync(DISCLAIMER_KEY);
        }

        if (!ack) {
          setShowDisclaimer(true);
        }
      } finally {
        setReady(true);
        if (!isWeb) {
          await SplashScreen.hideAsync();
        }
      }
    }
    void init();
  }, []);

  async function handleDisclaimerAck() {
    if (isWeb) {
      localStorage.setItem(DISCLAIMER_KEY, 'true');
    } else {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(DISCLAIMER_KEY, 'true');
    }
    setShowDisclaimer(false);
  }

  if (!ready) return null;

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
