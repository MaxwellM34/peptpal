import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Badge, Card, DisclaimerBanner, DoseScalingCard } from '@peptpal/ui';
import {
  getProtocolSeed,
  getCycleMetadata,
  getDegradationProfile,
  scaleDose,
  topTier,
} from '@peptpal/core';
import { usePeptideDetail } from '../../../src/hooks/usePeptides';
import { getUserProfile } from '../../../src/db/profile';

export default function PeptideDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: peptide, isLoading, isError } = usePeptideDetail(slug ?? '');
  const [weightKg, setWeightKg] = useState<number | null>(null);

  useEffect(() => {
    void getUserProfile().then((p) => setWeightKg(p?.weight_kg ?? null));
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (isError || !peptide) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <Text className="text-danger-400 text-center">Could not load peptide data.</Text>
      </View>
    );
  }

  const routeLabel: Record<string, string> = {
    subq: 'SubQ', im: 'IM', intranasal: 'Intranasal', topical: 'Topical',
  };

  return (
    <>
      <Stack.Screen options={{ title: peptide.name }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView className="flex-1 px-4 pt-4">
          <DisclaimerBanner />

          {/* Weight-scaled dose (if seed + profile weight present) */}
          <PeptideScaledDoseCard slug={peptide.slug} peptideName={peptide.name} weightKg={weightKg} />

          {/* Cycle + degradation summary */}
          <PeptideCycleDegradationCard slug={peptide.slug} />

          {/* Community link */}
          <TouchableOpacity
            className="bg-surface-card border border-surface-border rounded-xl py-3 px-4 mb-4 flex-row items-center justify-between active:bg-surface-elevated"
            onPress={() => router.push(`/(tabs)/community/${peptide.slug}`)}
          >
            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 18 }}>💬</Text>
              <Text className="text-slate-200 font-semibold text-sm">Open community consensus</Text>
            </View>
            <Text className="text-slate-500 text-xl">›</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-4">
            <View className="flex-row flex-wrap gap-2 mb-2">
              {peptide.routes.map((r) => (
                <Badge key={r} variant="info">{routeLabel[r] ?? r}</Badge>
              ))}
              <Badge variant={peptide.storage_temp === 'freezer' ? 'info' : 'success'}>
                {peptide.storage_temp === 'freezer' ? '❄ Freezer' : '🧊 Fridge'}
              </Badge>
            </View>
            {peptide.aliases.length > 0 && (
              <Text className="text-slate-400 text-sm">Also known as: {peptide.aliases.join(', ')}</Text>
            )}
          </View>

          {/* Description */}
          <Card className="mb-4">
            <Text className="text-white font-bold mb-2">About</Text>
            <Text className="text-slate-300 text-sm leading-relaxed">{peptide.description}</Text>
          </Card>

          {/* Dosing */}
          <Card className="mb-4">
            <Text className="text-white font-bold mb-3">Reference Dosing</Text>
            <View className="gap-2">
              {peptide.recommended_dose_mcg_min != null && (
                <InfoRow label="Typical Range" value={`${peptide.recommended_dose_mcg_min}–${peptide.recommended_dose_mcg_max} mcg`} />
              )}
              {peptide.max_dose_mcg != null && (
                <InfoRow label="Reference Max" value={`${peptide.max_dose_mcg} mcg`} highlight />
              )}
              {peptide.half_life_hours != null && (
                <InfoRow
                  label="Half-life"
                  value={
                    peptide.half_life_hours < 1
                      ? `${(peptide.half_life_hours * 60).toFixed(0)} minutes`
                      : `${peptide.half_life_hours} hours`
                  }
                />
              )}
              {peptide.frequency_notes && (
                <View className="mt-2 pt-2 border-t border-surface-border">
                  <Text className="text-slate-400 text-xs font-medium mb-1">Frequency Notes</Text>
                  <Text className="text-slate-300 text-sm leading-relaxed">{peptide.frequency_notes}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Common Protocols */}
          {peptide.common_protocols.length > 0 && (
            <Card className="mb-4">
              <Text className="text-white font-bold mb-3">Common Protocols</Text>
              <View className="gap-3">
                {peptide.common_protocols.map((p, i) => (
                  <View key={i} className="border-l-2 border-primary-600 pl-3">
                    <Text className="text-white font-semibold text-sm">{p.name}</Text>
                    <Text className="text-slate-400 text-xs mt-1 leading-relaxed">{p.description}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Side Effects */}
          {peptide.side_effects.length > 0 && (
            <Card className="mb-4">
              <Text className="text-white font-bold mb-3">Reported Side Effects</Text>
              <View className="flex-row flex-wrap gap-2">
                {peptide.side_effects.map((se) => (
                  <Badge key={se} variant="warning">{se}</Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Synergies */}
          {peptide.synergies.length > 0 && (
            <Card className="mb-4">
              <Text className="text-white font-bold mb-3">Common Synergies</Text>
              <View className="flex-row flex-wrap gap-2">
                {peptide.synergies.map((s) => (
                  <Badge key={s} variant="info">{s}</Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Actions */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              className="flex-1 bg-primary-600 rounded-xl py-3 items-center active:bg-primary-700"
              onPress={() => router.push('/modals/reconstitution-calc')}
            >
              <Text className="text-white font-semibold">🧮 Calc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface-card border border-surface-border rounded-xl py-3 items-center active:bg-surface-elevated"
              onPress={() => router.push({ pathname: '/(tabs)/library/compare', params: { a: peptide.slug } })}
            >
              <Text className="text-slate-200 font-semibold">⇆ Compare</Text>
            </TouchableOpacity>
          </View>

          {/* Suggest correction */}
          <TouchableOpacity
            className="border border-surface-border rounded-xl py-3 items-center mb-6 active:bg-surface-elevated"
            onPress={() => router.push({ pathname: '/(tabs)/settings', params: { suggest: peptide.id } })}
          >
            <Text className="text-slate-400 text-sm">Suggest a correction or addition</Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Card className="mb-8 bg-warning-900/20 border border-warning-700/40">
            <Text className="text-warning-400 text-xs leading-relaxed">{peptide.disclaimer}</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className={`font-semibold text-sm ${highlight ? 'text-warning-400' : 'text-white'}`}>
        {value}
      </Text>
    </View>
  );
}

function PeptideScaledDoseCard({
  slug,
  peptideName,
  weightKg,
}: {
  slug: string;
  peptideName: string;
  weightKg: number | null;
}) {
  const seed = getProtocolSeed(slug);
  if (!seed || weightKg == null) return null;
  const scaled = scaleDose(seed.startingDose, { weightKg });
  return (
    <View className="mb-4">
      <DoseScalingCard
        peptideName={peptideName}
        recommendation={seed.startingDose}
        scaled={scaled}
        topSourceTier={topTier(seed.sources)}
        sourceCount={seed.sources.length}
      />
    </View>
  );
}

function PeptideCycleDegradationCard({ slug }: { slug: string }) {
  const meta = getCycleMetadata(slug);
  const degr = getDegradationProfile(slug);
  return (
    <Card className="mb-4">
      <Text className="text-white font-bold text-sm mb-2">Cycle + degradation</Text>
      {meta.requiresCycling && (
        <View className="mb-2">
          <Text className="text-amber-300 text-xs font-semibold">Requires cycling</Text>
          <Text className="text-slate-300 text-xs leading-5 mt-0.5">
            {meta.cycleNote}
          </Text>
        </View>
      )}
      <View className="flex-row gap-3 mt-1">
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] uppercase font-semibold">Max weeks on</Text>
          <Text className="text-white font-bold">{meta.maxWeeksOn ?? '—'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] uppercase font-semibold">Off weeks</Text>
          <Text className="text-white font-bold">{meta.recommendedOffWeeks ?? '—'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] uppercase font-semibold">Recon fridge rate</Text>
          <Text className="text-white font-bold">
            {(degr.k_reconstituted_fridge * 100).toFixed(1)}% /day
          </Text>
        </View>
      </View>
      <Text className="text-slate-500 text-[10px] italic mt-2">
        {degr.source}
      </Text>
    </Card>
  );
}
