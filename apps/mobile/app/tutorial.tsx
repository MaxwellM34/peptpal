import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { PeptPalMascot, SpeechBubble } from '../src/components/PeptPalMascot';
import { markTutorialComplete } from '../src/db/tutorial';
import { DegradationChart, SyringeDiagram } from '@peptpal/ui';
import { buildDegradationCurve } from '@peptpal/core';

interface Step {
  key: string;
  title: string;
  bubble: React.ReactNode;
  Visual: React.FC;
}

const STEPS: Step[] = [
  {
    key: 'welcome',
    title: 'Welcome',
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        Sup. I'm PeptPal. I'm gonna walk you through this thing. It's a harm-reduction
        tool — not medical advice. Tap Next.
      </Text>
    ),
    Visual: BrandVisual,
  },
  {
    key: 'profile',
    title: 'Your profile',
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        First, set your weight in Settings. Clinical trial doses were run on big dudes
        (retatrutide trial avg = 248 lb). If you're leaner, I'll scale the dose down so
        you don't overshoot.
      </Text>
    ),
    Visual: ProfileVisual,
  },
  {
    key: 'shipment',
    title: 'Receive shipment',
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        When vials arrive in the mail, hit Inventory → 📦 Receive Shipment. Snap photos,
        name the vendor, add the vials. I auto-label them (BPC-157 #1, #2…) so you know
        which one to use next.
      </Text>
    ),
    Visual: ShipmentVisual,
  },
  {
    key: 'reconstitute',
    title: 'Reconstitute + inject',
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        When you log an injection, I pick your oldest reconstituted vial first (FIFO) and
        show the exact mark to draw to on a U-100 syringe. Protocol builder solves the BAC
        water for you so every injection lands at ~10 IU.
      </Text>
    ),
    Visual: SyringeVisual,
  },
  {
    key: 'degradation',
    title: 'Peptides degrade',
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        Reconstituted peptides lose potency in the fridge. I track it per-vial with a
        first-order decay model and warn you when a vial drops below 60%. Degradation
        math is an estimate — supplier + absorption variance is often bigger than the
        correction.
      </Text>
    ),
    Visual: DegradationVisual,
  },
  {
    key: 'variability',
    title: 'Variability is real',
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        Even when you inject exactly X mcg, your actual blood level can be ±30% from the
        curve. Suppliers vary, bodies vary, technique varies. I show the band so you
        don't treat these lines as gospel.
      </Text>
    ),
    Visual: VariabilityVisual,
  },
  {
    key: 'community',
    title: 'Community',
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        Two streams in the 💬 Community tab — aggregated stuff from reddit + papers, and
        PeptPal-internal pseudonymous dose logs. Bloodwork-attached posts count 5× more.
        Post your own results to improve the median for everyone.
      </Text>
    ),
    Visual: CommunityVisual,
  },
  {
    key: 'done',
    title: "You're good",
    bubble: (
      <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
        That's it. Remember: I'm not your doctor. Peptides below FDA approval carry real
        risks. Track everything, get bloodwork, rotate sites. You can replay this
        tutorial anytime from Settings.
      </Text>
    ),
    Visual: BrandVisual,
  },
];

export default function Tutorial() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;

  async function finish() {
    await markTutorialComplete();
    router.replace('/(tabs)');
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else void finish();
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <View style={{ flex: 1, padding: 16 }}>
          {/* Skip + progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 3,
                    backgroundColor: i <= step ? '#3b82f6' : '#334155',
                    borderRadius: 2,
                  }}
                />
              ))}
            </View>
            <TouchableOpacity onPress={finish} style={{ marginLeft: 12 }}>
              <Text style={{ color: '#64748b', fontSize: 12 }}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
            <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 16 }}>
              {current.title}
            </Text>

            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <current.Visual />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 }}>
              <View style={{ marginRight: -8 }}>
                <PeptPalMascot size={100} />
              </View>
              <View style={{ flex: 1 }}>
                <SpeechBubble from="right">{current.bubble}</SpeechBubble>
              </View>
            </View>
          </ScrollView>

          {/* Nav */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {step > 0 && (
              <TouchableOpacity
                onPress={prev}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: '#1e293b',
                  borderWidth: 1,
                  borderColor: '#334155',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#cbd5e1', fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={next}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>
                {step === STEPS.length - 1 ? "Let's go" : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

function BrandVisual() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
      <Text style={{ fontSize: 72 }}>💪</Text>
      <Text style={{ color: '#3b82f6', fontWeight: '800', fontSize: 32, marginTop: 8 }}>
        PeptPal
      </Text>
    </Animated.View>
  );
}

function ProfileVisual() {
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [slide]);
  const width = slide.interpolate({ inputRange: [0, 1], outputRange: ['10%', '75%'] });

  return (
    <View style={{ width: 280, padding: 16, backgroundColor: '#1e293b', borderRadius: 12 }}>
      <Text style={{ color: '#94a3b8', fontSize: 11 }}>Weight</Text>
      <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
        170 lb
      </Text>
      <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{ height: 8, width: width as unknown as number, backgroundColor: '#3b82f6' }} />
      </View>
      <Text style={{ color: '#64748b', fontSize: 10, marginTop: 6 }}>
        ↑ Your per-kg exposure at the trial's flat dose
      </Text>
    </View>
  );
}

function ShipmentVisual() {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {['#1', '#2', '#3'].map((label, i) => (
        <View
          key={label}
          style={{
            width: 60,
            height: 80,
            backgroundColor: '#334155',
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: '#475569',
          }}
        >
          <Text style={{ fontSize: 24 }}>💊</Text>
          <Text style={{ color: '#60a5fa', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
            BPC-157 {label}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 9 }}>5 mg</Text>
        </View>
      ))}
    </View>
  );
}

function SyringeVisual() {
  return (
    <View style={{ width: 320 }}>
      <SyringeDiagram volumeMl={0.10} capacityMl={1} width={320} height={100} />
    </View>
  );
}

function DegradationVisual() {
  const points = buildDegradationCurve('bpc-157', 'reconstituted_fridge', Date.now(), 45, 45);
  return (
    <View>
      <DegradationChart
        points={points}
        currentPotency={points[points.length - 1]!.potency}
        daysInState={45}
        totalDays={45}
        width={320}
        height={140}
      />
    </View>
  );
}

function VariabilityVisual() {
  return (
    <View style={{ width: 280 }}>
      <View
        style={{
          height: 100,
          backgroundColor: '#1e293b',
          borderRadius: 10,
          padding: 12,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#f59e0b', fontSize: 11, marginBottom: 4, fontWeight: '700' }}>
          ±30% band
        </Text>
        <View style={{ height: 30, backgroundColor: '#3b82f622', borderRadius: 4, position: 'relative' }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 13,
              height: 4,
              backgroundColor: '#3b82f6',
              borderRadius: 2,
            }}
          />
        </View>
        <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 6 }}>
          Your actual blood level lives somewhere in the band, not on the line.
        </Text>
      </View>
    </View>
  );
}

function CommunityVisual() {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View
        style={{
          backgroundColor: '#1e293b',
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: '#334155',
          width: 120,
        }}
      >
        <Text style={{ fontSize: 24, marginBottom: 4 }}>🌐</Text>
        <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>Wider Internet</Text>
        <Text style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
          Reddit, papers, aggregated
        </Text>
      </View>
      <View
        style={{
          backgroundColor: '#1e293b',
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: '#3b82f6',
          width: 120,
        }}
      >
        <Text style={{ fontSize: 24, marginBottom: 4 }}>💬</Text>
        <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>PeptPal</Text>
        <Text style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
          Pseudonymous dose logs
        </Text>
      </View>
    </View>
  );
}
