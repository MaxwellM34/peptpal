import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Card } from '@peptpal/ui';
import { getProtocolSeed, getCycleMetadata, getDegradationProfile } from '@peptpal/core';
import { usePeptideList } from '../../../src/hooks/usePeptides';

export default function CompareScreen() {
  const { a } = useLocalSearchParams<{ a?: string }>();
  const { data: list } = usePeptideList();
  const items = list?.items ?? [];
  const [slugA, setSlugA] = useState<string>(a ?? '');
  const [slugB, setSlugB] = useState<string>('');

  useEffect(() => {
    if (!slugA && items.length > 0) setSlugA(items[0]!.slug);
    if (!slugB && items.length > 1) setSlugB(items[1]!.slug);
  }, [items, slugA, slugB]);

  const seedA = slugA ? getProtocolSeed(slugA) : undefined;
  const seedB = slugB ? getProtocolSeed(slugB) : undefined;
  const metaA = slugA ? getCycleMetadata(slugA) : undefined;
  const metaB = slugB ? getCycleMetadata(slugB) : undefined;
  const degrA = slugA ? getDegradationProfile(slugA) : undefined;
  const degrB = slugB ? getDegradationProfile(slugB) : undefined;

  const peptideA = items.find((p) => p.slug === slugA);
  const peptideB = items.find((p) => p.slug === slugB);

  return (
    <>
      <Stack.Screen options={{ title: 'Compare' }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Picker label="Peptide A" value={slugA} options={items} onChange={setSlugA} />
          <Picker label="Peptide B" value={slugB} options={items} onChange={setSlugB} />

          <Card className="mt-4">
            <View className="flex-row mb-2">
              <Text className="flex-1 text-slate-400 text-[10px] uppercase font-semibold">Field</Text>
              <Text className="flex-1 text-primary-400 text-xs font-bold">{peptideA?.name ?? '—'}</Text>
              <Text className="flex-1 text-emerald-400 text-xs font-bold">{peptideB?.name ?? '—'}</Text>
            </View>
            <Row label="Storage" a={peptideA?.storage_temp} b={peptideB?.storage_temp} />
            <Row label="Half-life (h)" a={peptideA?.half_life_hours} b={peptideB?.half_life_hours} />
            <Row label="Routes" a={peptideA?.routes.join(', ')} b={peptideB?.routes.join(', ')} />
            <Row
              label="Starting dose (mcg)"
              a={seedA?.startingDose.doseMcg}
              b={seedB?.startingDose.doseMcg}
            />
            <Row
              label="Trial cohort (kg)"
              a={seedA?.startingDose.cohort.meanWeightKg}
              b={seedB?.startingDose.cohort.meanWeightKg}
            />
            <Row label="Hard ceiling (mcg)" a={seedA?.hardCeilingMcg} b={seedB?.hardCeilingMcg} />
            <Row label="Cycle required" a={metaA?.requiresCycling ? 'yes' : 'no'} b={metaB?.requiresCycling ? 'yes' : 'no'} />
            <Row label="Max weeks on" a={metaA?.maxWeeksOn ?? '—'} b={metaB?.maxWeeksOn ?? '—'} />
            <Row label="Off weeks" a={metaA?.recommendedOffWeeks ?? '—'} b={metaB?.recommendedOffWeeks ?? '—'} />
            <Row
              label="Recon fridge %/day"
              a={degrA ? (degrA.k_reconstituted_fridge * 100).toFixed(1) : undefined}
              b={degrB ? (degrB.k_reconstituted_fridge * 100).toFixed(1) : undefined}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ slug: string; name: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="text-slate-400 text-xs mb-1">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {options.map((o) => (
            <TouchableOpacity
              key={o.slug}
              className={`px-3 py-1.5 rounded-full border ${
                value === o.slug
                  ? 'bg-primary-600 border-primary-500'
                  : 'bg-surface-elevated border-surface-border'
              }`}
              onPress={() => onChange(o.slug)}
            >
              <Text className={`text-xs ${value === o.slug ? 'text-white' : 'text-slate-300'}`}>
                {o.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, a, b }: { label: string; a: unknown; b: unknown }) {
  return (
    <View className="flex-row py-1 border-b border-surface-border">
      <Text className="flex-1 text-slate-500 text-[11px]">{label}</Text>
      <Text className="flex-1 text-slate-200 text-xs">{a == null ? '—' : String(a)}</Text>
      <Text className="flex-1 text-slate-200 text-xs">{b == null ? '—' : String(b)}</Text>
    </View>
  );
}
