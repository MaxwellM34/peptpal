import React from 'react';
import { View, Text } from 'react-native';
import type { ScaledDose, DoseRecommendation, SourceTier } from '@peptpal/core';
import { TIER_DEFINITIONS } from '@peptpal/core';

export interface DoseScalingCardProps {
  peptideName: string;
  recommendation: DoseRecommendation;
  scaled: ScaledDose;
  /** Top-tier source backing the recommendation. */
  topSourceTier?: SourceTier | null;
  /** Number of sources cited. */
  sourceCount?: number;
}

const FLAG_STYLE: Record<
  ScaledDose['safetyFlag'],
  { bg: string; border: string; text: string; label: string; icon: string }
> = {
  safe: {
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-800',
    text: 'text-emerald-300',
    label: 'Safe range',
    icon: '✓',
  },
  elevated: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-800',
    text: 'text-amber-300',
    label: 'Elevated exposure',
    icon: '⚠',
  },
  dangerous: {
    bg: 'bg-red-900/30',
    border: 'border-red-700',
    text: 'text-red-300',
    label: 'Dangerous at trial dose',
    icon: '⛔',
  },
  subtherapeutic: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-800',
    text: 'text-blue-300',
    label: 'Below trial exposure',
    icon: 'ℹ',
  },
};

export function DoseScalingCard({
  peptideName,
  recommendation,
  scaled,
  topSourceTier,
  sourceCount,
}: DoseScalingCardProps) {
  const f = FLAG_STYLE[scaled.safetyFlag];
  const tierDef = topSourceTier ? TIER_DEFINITIONS[topSourceTier] : null;

  return (
    <View className={`rounded-2xl p-4 border ${f.bg} ${f.border}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-bold text-base">{peptideName} — scaled to you</Text>
        <View className={`${f.bg} ${f.border} border rounded-full px-2 py-0.5`}>
          <Text className={`${f.text} text-[10px] font-semibold uppercase`}>
            {f.icon} {f.label}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 mt-2">
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] uppercase font-semibold">Your dose</Text>
          <Text className="text-white text-xl font-bold">
            {Math.round(scaled.scaledDoseMcg).toLocaleString()} <Text className="text-slate-400 text-xs">mcg</Text>
          </Text>
          <Text className="text-slate-500 text-xs">{recommendation.frequency}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] uppercase font-semibold">Trial dose</Text>
          <Text className="text-slate-300 text-xl font-bold">
            {recommendation.doseMcg.toLocaleString()} <Text className="text-slate-500 text-xs">mcg</Text>
          </Text>
          <Text className="text-slate-500 text-xs">
            @ {recommendation.cohort.meanWeightKg.toFixed(0)} kg cohort
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] uppercase font-semibold">Exposure</Text>
          <Text className={`text-xl font-bold ${f.text}`}>
            {scaled.exposureRatio.toFixed(2)}×
          </Text>
          <Text className="text-slate-500 text-xs">of trial per-kg</Text>
        </View>
      </View>

      <Text className="text-slate-300 text-xs leading-5 mt-3">{scaled.explanation}</Text>

      {tierDef && (
        <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-surface-border">
          <View className="bg-primary-900/40 border border-primary-800 rounded-full px-2 py-0.5">
            <Text className="text-primary-300 text-[10px] font-semibold">
              Tier {tierDef.tier}
            </Text>
          </View>
          <Text className="text-slate-500 text-[10px] flex-1">
            {tierDef.label}
            {sourceCount != null && sourceCount > 1 ? ` · ${sourceCount} sources` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}
