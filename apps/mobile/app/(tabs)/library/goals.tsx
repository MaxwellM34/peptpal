import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  GOAL_PROTOCOLS,
  PROTOCOL_SEEDS,
  scaleDose,
  topTier,
  type GoalProtocol,
} from '@peptpal/core';
import { DoseScalingCard } from '@peptpal/ui';
import { getUserProfile } from '../../../src/db/profile';

export default function GoalsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<GoalProtocol | null>(null);

  if (selected) {
    return <ProtocolDetail protocol={selected} onBack={() => setSelected(null)} onOpenPeptide={(slug) => router.push(`/(tabs)/library/${slug}`)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-slate-200 text-base font-bold mb-1">What's your goal?</Text>
        <Text className="text-slate-500 text-xs mb-4">
          Pick a goal to see evidence-based peptide stacks used by the community.
        </Text>

        {GOAL_PROTOCOLS.map((g) => (
          <TouchableOpacity
            key={g.key}
            className="bg-surface-card rounded-2xl p-4 mb-3 border border-surface-border active:bg-surface-elevated"
            onPress={() => setSelected(g)}
          >
            <View className="flex-row items-center gap-3 mb-1">
              <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
              <Text className="text-white font-bold text-base flex-1">{g.label}</Text>
              <Text className="text-slate-500 text-xl">›</Text>
            </View>
            <Text className="text-slate-400 text-xs ml-10">{g.description}</Text>
            <View className="flex-row flex-wrap gap-1 mt-2 ml-10">
              {g.peptides.filter((p) => p.role === 'primary').map((p) => (
                <View key={p.slug} className="bg-primary-900/40 border border-primary-800 rounded-full px-2 py-0.5">
                  <Text className="text-primary-300 text-[10px] font-semibold">{p.name}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProtocolDetail({
  protocol,
  onBack,
  onOpenPeptide,
}: {
  protocol: GoalProtocol;
  onBack: () => void;
  onOpenPeptide: (slug: string) => void;
}) {
  const [weightKg, setWeightKg] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const p = await getUserProfile();
      if (p?.weight_kg) setWeightKg(p.weight_kg);
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={onBack} className="mb-3">
          <Text className="text-primary-400">‹ All Goals</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-3 mb-3">
          <Text style={{ fontSize: 32 }}>{protocol.emoji}</Text>
          <Text className="text-white font-bold text-xl flex-1">{protocol.label}</Text>
        </View>
        <Text className="text-slate-400 text-sm mb-4">{protocol.description}</Text>

        {weightKg == null && (
          <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-4">
            <Text className="text-amber-300 text-xs leading-5">
              ⚠ Set your weight in Settings to get dose scaling. Trial cohorts averaged
              ~250 lb — copying flat doses as a lean user can be dangerous.
            </Text>
          </View>
        )}

        {weightKg != null && (
          <Section title="Weight-Scaled Starting Dose">
            {protocol.peptides
              .filter((p) => p.role === 'primary' && PROTOCOL_SEEDS[p.slug])
              .map((p) => {
                const seed = PROTOCOL_SEEDS[p.slug]!;
                const scaled = scaleDose(seed.startingDose, { weightKg });
                return (
                  <View key={p.slug} className="mb-3">
                    <DoseScalingCard
                      peptideName={p.name}
                      recommendation={seed.startingDose}
                      scaled={scaled}
                      topSourceTier={topTier(seed.sources)}
                      sourceCount={seed.sources.length}
                    />
                  </View>
                );
              })}
          </Section>
        )}

        <Section title="Recommended Stack">
          {protocol.peptides.map((p) => (
            <TouchableOpacity
              key={p.slug}
              onPress={() => onOpenPeptide(p.slug)}
              className="bg-surface-card rounded-xl p-3 mb-2 border border-surface-border"
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white font-bold">{p.name}</Text>
                <View className={`px-2 py-0.5 rounded-full ${
                  p.role === 'primary' ? 'bg-primary-900/50' :
                  p.role === 'synergy' ? 'bg-emerald-900/50' : 'bg-slate-800'
                }`}>
                  <Text className={`text-[10px] font-semibold uppercase ${
                    p.role === 'primary' ? 'text-primary-300' :
                    p.role === 'synergy' ? 'text-emerald-300' : 'text-slate-400'
                  }`}>{p.role}</Text>
                </View>
              </View>
              <Text className="text-slate-300 text-xs leading-5 mb-1">{p.rationale}</Text>
              <Text className="text-slate-500 text-xs">Dose: {p.typicalDose}</Text>
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="How to Stack">
          <Text className="text-slate-300 text-xs leading-5">{protocol.stackNote}</Text>
        </Section>

        <Section title="Cycle Protocol">
          <Text className="text-slate-300 text-xs leading-5">{protocol.cycleProtocol}</Text>
        </Section>

        <Section title="Expected Timeline">
          <Text className="text-slate-300 text-xs leading-5">{protocol.expectedTimeline}</Text>
        </Section>

        <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mt-2">
          <Text className="text-amber-300 font-bold text-xs mb-2">⚠ Warnings</Text>
          {protocol.warnings.map((w, i) => (
            <Text key={i} className="text-amber-200/80 text-xs leading-5 mb-1">• {w}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-slate-200 font-bold mb-2 text-sm">{title}</Text>
      {children}
    </View>
  );
}
