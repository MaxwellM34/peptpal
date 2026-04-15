import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BLEND_COMPAT, type CompatLevel } from '@peptpal/core';

const LEVEL_COLORS: Record<CompatLevel, { bg: string; border: string; text: string; label: string }> = {
  safe: { bg: 'bg-emerald-900/30', border: 'border-emerald-700', text: 'text-emerald-300', label: 'Safe' },
  caution: { bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-300', label: 'Caution' },
  avoid: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-300', label: 'Avoid' },
};

export default function BlendsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-slate-200 text-base font-bold mb-1">Blend Compatibility</Text>
        <Text className="text-slate-500 text-xs mb-4">
          Which peptides can share a syringe? Which can be stored pre-mixed? Community-sourced guidance.
        </Text>

        <View className="flex-row gap-2 mb-4">
          <LegendItem level="safe" />
          <LegendItem level="caution" />
          <LegendItem level="avoid" />
        </View>

        {BLEND_COMPAT.map((e, i) => (
          <View key={i} className="bg-surface-card rounded-2xl p-4 mb-3 border border-surface-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-bold text-base flex-1">
                {e.nameA} + {e.nameB}
              </Text>
              {e.synergy !== 'none' && (
                <View className="bg-primary-900/40 border border-primary-800 rounded-full px-2 py-0.5">
                  <Text className="text-primary-300 text-[10px] font-semibold uppercase">
                    {e.synergy} synergy
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-2 mb-3">
              <CompatPill label="Syringe" level={e.syringeSafe} />
              <CompatPill label="Storage" level={e.storageSafe} />
            </View>

            <Text className="text-slate-300 text-xs leading-5 mb-2">{e.notes}</Text>

            <View className="border-t border-surface-border pt-2 mt-1">
              <Text className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Draw Order</Text>
              <Text className="text-slate-300 text-xs">
                1. {e.drawOrder[0]}  →  2. {e.drawOrder[1]}
              </Text>
            </View>
          </View>
        ))}

        <View className="bg-surface-card rounded-2xl p-4 mt-2 border border-surface-border">
          <Text className="text-slate-200 font-bold mb-2">General Rules</Text>
          <Text className="text-slate-400 text-xs leading-5 mb-1">
            • Use a fresh drawing needle for each vial to prevent cross-contamination.
          </Text>
          <Text className="text-slate-400 text-xs leading-5 mb-1">
            • Swap to a fresh injection needle before injecting — drawing needles dull quickly.
          </Text>
          <Text className="text-slate-400 text-xs leading-5 mb-1">
            • "Syringe-safe" means mix and inject within ~5 minutes. Never store mixed peptides unless explicitly rated storage-safe.
          </Text>
          <Text className="text-slate-400 text-xs leading-5">
            • Draw the smallest-volume peptide first to avoid transferring droplets between vials.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CompatPill({ label, level }: { label: string; level: CompatLevel }) {
  const c = LEVEL_COLORS[level];
  return (
    <View className={`flex-1 ${c.bg} ${c.border} border rounded-lg p-2`}>
      <Text className="text-slate-500 text-[10px] uppercase font-semibold">{label}</Text>
      <Text className={`${c.text} text-xs font-bold`}>{c.label}</Text>
    </View>
  );
}

function LegendItem({ level }: { level: CompatLevel }) {
  const c = LEVEL_COLORS[level];
  return (
    <View className={`${c.bg} ${c.border} border rounded-full px-3 py-1`}>
      <Text className={`${c.text} text-[10px] font-semibold`}>{c.label}</Text>
    </View>
  );
}
