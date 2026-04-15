import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTutorialScrollReset } from '../../../src/lib/tutorialContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  listProtocolSeeds,
  PERSONAS,
  PERSONA_ORDER,
  getExternalProtocol,
  type PersonaKey,
} from '@peptpal/core';
import { getUserProfile } from '../../../src/db/profile';

type Section = 'internal' | 'external';

export default function CommunityIndex() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('internal');
  const [persona, setPersona] = useState<PersonaKey>('health_optimizer');
  const scrollRef = useRef<ScrollView>(null);
  useTutorialScrollReset(scrollRef);

  useEffect(() => {
    void (async () => {
      const p = await getUserProfile();
      if (p?.activity_level && (p.activity_level as PersonaKey) in PERSONAS) {
        setPersona(p.activity_level as PersonaKey);
      }
    })();
  }, []);

  const seeds = listProtocolSeeds();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16 }}>
        <Text className="text-slate-200 text-base font-bold mb-1">Community</Text>
        <Text className="text-slate-500 text-xs mb-4">
          Two streams: curated external consensus, and live PeptPal-internal dose logs.
        </Text>

        {/* Section toggle */}
        <View className="flex-row bg-surface-card rounded-xl p-1 mb-4 border border-surface-border">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${
              section === 'internal' ? 'bg-primary-600' : ''
            }`}
            onPress={() => setSection('internal')}
          >
            <Text className={`text-xs font-semibold ${section === 'internal' ? 'text-white' : 'text-slate-400'}`}>
              💬 PeptPal Community
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${
              section === 'external' ? 'bg-primary-600' : ''
            }`}
            onPress={() => setSection('external')}
          >
            <Text className={`text-xs font-semibold ${section === 'external' ? 'text-white' : 'text-slate-400'}`}>
              🌐 Wider Internet
            </Text>
          </TouchableOpacity>
        </View>

        {section === 'external' && (
          <>
            {/* Persona filter */}
            <Text className="text-slate-300 text-xs font-medium mb-2">For a:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {PERSONA_ORDER.map((k) => {
                  const p = PERSONAS[k];
                  const active = persona === k;
                  return (
                    <TouchableOpacity
                      key={k}
                      className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${
                        active
                          ? 'bg-primary-600 border-primary-500'
                          : 'bg-surface-elevated border-surface-border'
                      }`}
                      onPress={() => setPersona(k)}
                    >
                      <Text style={{ fontSize: 12 }}>{p.emoji}</Text>
                      <Text className={`text-[11px] font-medium ${active ? 'text-white' : 'text-slate-300'}`}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-4">
              <Text className="text-amber-300 text-xs font-bold mb-1">Aggregated from the public web</Text>
              <Text className="text-amber-200/80 text-xs leading-5">
                Reddit top-voted posts, forum archives, and informed long-form writers. Vendor sources
                excluded from consensus math. Treat as a starting point, not a prescription.
              </Text>
            </View>
          </>
        )}

        {section === 'internal' && (
          <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-4">
            <Text className="text-amber-300 text-xs font-bold mb-1">Harm-reduction only</Text>
            <Text className="text-amber-200/80 text-xs leading-5">
              Pseudonymous dose logs from PeptPal users. Bloodwork-attached posts count 5× more than anonymous text.
              Dangerous doses are flagged; vendor shills are excluded.
            </Text>
          </View>
        )}

        {seeds.map((s) => {
          const ext = section === 'external' ? getExternalProtocol(s.slug, persona) : undefined;
          return (
            <TouchableOpacity
              key={s.slug}
              className="bg-surface-card rounded-2xl p-4 mb-2 border border-surface-border active:bg-surface-elevated"
              onPress={() => router.push(`/(tabs)/community/${s.slug}?tab=${section}`)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-bold">{s.name}</Text>
                  {section === 'external' && ext ? (
                    ext.avoidReason ? (
                      <Text className="text-red-400 text-xs mt-0.5">⛔ Not recommended for this persona</Text>
                    ) : ext.doseMcgLow != null ? (
                      <Text className="text-slate-400 text-xs mt-0.5">
                        {ext.doseMcgLow}–{ext.doseMcgHigh} mcg ·{' '}
                        {ext.dosesPerWeek}×/wk{ext.cycleWeeks ? ` · ${ext.cycleWeeks}wk cycle` : ''}
                      </Text>
                    ) : (
                      <Text className="text-slate-500 text-xs mt-0.5">No persona data yet</Text>
                    )
                  ) : (
                    <Text className="text-slate-500 text-xs mt-0.5">
                      Trial cohort: {s.startingDose.cohort.meanWeightKg.toFixed(0)} kg avg
                      {s.startingDose.cohort.n ? ` · n=${s.startingDose.cohort.n}` : ''}
                    </Text>
                  )}
                </View>
                <Text className="text-slate-500 text-xl">›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
