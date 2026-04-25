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
import { getTutorialState } from '../src/db/tutorial';
import { getUserProfile } from '../src/db/profile';
import { DisclaimerModal } from './modals/disclaimer';
import { TutorialProvider, useTutorial } from '../src/lib/tutorialContext';
import { TutorialOverlay } from '../src/components/TutorialOverlay';
import { OnboardingWeightPrompt } from '../src/components/OnboardingWeightPrompt';

const isWeb = Platform.OS === 'web';

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
  const [ready, setReady] = useState(isWeb);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [needsTutorial, setNeedsTutorial] = useState(false);
  const [needsWeight, setNeedsWeight] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        if (isDbAvailable()) {
          await getDb();
        }

        let ack: string | null = null;
        if (isWeb) {
          ack = typeof localStorage !== 'undefined'
            ? localStorage.getItem(DISCLAIMER_KEY)
            : 'true';
        } else {
          try {
            const SecureStore = await import('expo-secure-store');
            ack = await SecureStore.getItemAsync(DISCLAIMER_KEY);
          } catch {
            ack = null;
          }
        }

        if (!ack) setShowDisclaimer(true);

        if (isDbAvailable()) {
          const [t, profile] = await Promise.all([getTutorialState(), getUserProfile()]);
          if (!t?.completed) {
            setNeedsTutorial(true);
            if (!profile?.weight_kg) setNeedsWeight(true);
          }
        }
      } finally {
        setReady(true);
        if (!isWeb) await SplashScreen.hideAsync();
      }
    }
    void init();
  }, []);

  async function handleDisclaimerAck() {
    if (isWeb) {
      localStorage.setItem(DISCLAIMER_KEY, 'true');
    } else {
      try {
        const SecureStore = await import('expo-secure-store');
        await SecureStore.setItemAsync(DISCLAIMER_KEY, 'true');
      } catch {
        // non-fatal
      }
    }
    setShowDisclaimer(false);
  }

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TutorialProvider>
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
                <Stack.Screen
                  name="modals/feedback"
                  options={{ presentation: 'modal', title: 'Send Feedback' }}
                />
              </Stack>
            </View>
            <TutorialAutoStart
              enabled={!showDisclaimer && !needsWeight && needsTutorial}
              onStarted={() => setNeedsTutorial(false)}
            />
            <DisclaimerModal visible={showDisclaimer} onAcknowledge={handleDisclaimerAck} />
            <OnboardingWeightPrompt
              visible={!showDisclaimer && needsWeight}
              onDone={() => setNeedsWeight(false)}
              onSkip={() => setNeedsWeight(false)}
            />
            <TutorialOverlay />
          </TutorialProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Kicks off the tutorial once the disclaimer is dismissed and first-run is detected. */
function TutorialAutoStart({ enabled, onStarted }: { enabled: boolean; onStarted: () => void }) {
  const { start, active } = useTutorial();
  useEffect(() => {
    if (enabled && !active) {
      start();
      onStarted();
    }
  }, [enabled, active, start, onStarted]);
  return null;
}
