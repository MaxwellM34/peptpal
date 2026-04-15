import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LineChart } from '@peptpal/ui';
import {
  computePkSeries,
  computeSeriesStats,
  expandBlendLogs,
  type PkSeriesStats,
} from '@peptpal/core';
import { getInjectionLogs } from '../../../src/db/injectionLog';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import type { InjectionLog } from '@peptpal/core';

type RangeKey = '24h' | '7d' | '30d';

const RANGE_HOURS: Record<RangeKey, number> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

export default function PkChartScreen() {
  const { width } = useWindowDimensions();
  const [logs, setLogs] = useState<InjectionLog[]>([]);
  const [range, setRange] = useState<RangeKey>('7d');
  const [normalize, setNormalize] = useState(false);
  const [showVariability, setShowVariability] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const peptideListQuery = usePeptideList();

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 60 * 24 * 3_600_000).toISOString();
    setLogs(await getInjectionLogs({ since }));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { void load(); }, [load]);

  const halfLives = useMemo<Record<string, number | null>>(() => {
    const map: Record<string, number | null> = {};
    for (const p of peptideListQuery.data?.items ?? []) {
      map[p.name] = p.half_life_hours;
      map[p.slug] = p.half_life_hours;
    }
    return map;
  }, [peptideListQuery.data]);

  const { series, startMs, endMs, nowMs, stats } = useMemo(() => {
    const now = Date.now();
    const start = now - RANGE_HOURS[range] * 3_600_000;
    const end = now + 6 * 3_600_000;
    const injections = expandBlendLogs(logs, halfLives);
    const all = computePkSeries(injections, start, end, 120);
    const s = all.map((ser) => computeSeriesStats(ser, injections, now));
    return { series: all, startMs: start, endMs: end, nowMs: now, stats: s };
  }, [logs, halfLives, range]);

  const visibleSeries = useMemo(
    () => series.filter((s) => !hidden.has(s.peptideName)),
    [series, hidden],
  );

  function toggle(name: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const chartWidth = width - 32;
  const hasData = series.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-white text-xl font-bold mb-1">Peptide Levels</Text>
        <Text className="text-slate-400 text-xs mb-4">
          Estimated from your injection log and published half-lives. Exponential decay model.
        </Text>

        <View className="flex-row gap-2 mb-2">
          {(Object.keys(RANGE_HOURS) as RangeKey[]).map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setRange(k)}
              className={`px-4 py-2 rounded-full border ${
                range === k
                  ? 'bg-primary-600 border-primary-500'
                  : 'bg-surface-card border-surface-border'
              }`}
            >
              <Text className={`text-xs font-semibold ${range === k ? 'text-white' : 'text-slate-300'}`}>
                {k}
              </Text>
            </TouchableOpacity>
          ))}
          <View className="flex-1" />
          <TouchableOpacity
            onPress={() => setNormalize((v) => !v)}
            className={`px-3 py-2 rounded-full border ${
              normalize
                ? 'bg-primary-600 border-primary-500'
                : 'bg-surface-card border-surface-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${normalize ? 'text-white' : 'text-slate-300'}`}>
              {normalize ? '% peak' : 'mcg'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowVariability((v) => !v)}
            className={`px-3 py-2 rounded-full border ${
              showVariability
                ? 'bg-amber-900/30 border-amber-700'
                : 'bg-surface-card border-surface-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${showVariability ? 'text-amber-300' : 'text-slate-300'}`}>
              ±band
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-slate-500 text-[10px] mb-2">
          {normalize
            ? 'Each curve scaled to its own peak — compare shapes across peptides with very different doses.'
            : 'Absolute concentrations in mcg.'}
        </Text>

        {showVariability && (
          <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-4">
            <Text className="text-amber-300 text-xs font-bold mb-1">
              ⚠ Variability band is shown (±30%)
            </Text>
            <Text className="text-amber-200/80 text-xs leading-5">
              Even with a good supplier, actual blood levels can vary ±30%+ from the curve.
              Peptides are not calibrated pharmaceuticals — injections, reconstitution
              technique, absorption, and purity all introduce uncertainty. These lines are
              estimates, not measurements.
            </Text>
          </View>
        )}

        {!hasData ? (
          <View className="bg-surface-card rounded-2xl py-12 items-center">
            <Text className="text-slate-400 text-sm">No data in this range</Text>
            <Text className="text-slate-500 text-xs mt-1">Log an injection to see levels</Text>
          </View>
        ) : (
          <>
            <View className="bg-surface-card rounded-2xl p-3 mb-4">
              <Text className="text-white text-sm font-semibold mb-2">All peptides</Text>
              <LineChart
                series={visibleSeries}
                width={chartWidth - 24}
                height={220}
                startMs={startMs}
                endMs={endMs}
                nowMs={nowMs}
                normalize={normalize}
                showPeaks
                variabilityFraction={showVariability ? 0.30 : undefined}
              />
              <View className="flex-row flex-wrap gap-2 mt-3">
                {series.map((s) => {
                  const on = !hidden.has(s.peptideName);
                  return (
                    <TouchableOpacity
                      key={s.peptideName}
                      onPress={() => toggle(s.peptideName)}
                      className="flex-row items-center gap-2 px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: on ? `${s.color}22` : 'transparent',
                        borderWidth: 1,
                        borderColor: on ? s.color : '#334155',
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: on ? s.color : '#475569',
                        }}
                      />
                      <Text className="text-xs" style={{ color: on ? '#e2e8f0' : '#64748b' }}>
                        {s.peptideName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {series.map((s) => {
              const stat = stats.find((st) => st.peptideName === s.peptideName);
              return (
                <View key={s.peptideName} className="bg-surface-card rounded-2xl p-3 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: s.color,
                        }}
                      />
                      <Text className="text-white text-sm font-semibold">{s.peptideName}</Text>
                    </View>
                    <Text className="text-slate-500 text-[10px]">
                      t½ {formatHours(s.halfLifeHours)}
                    </Text>
                  </View>
                  {stat ? <MetricsRow stat={stat} /> : null}
                  <LineChart
                    series={[s]}
                    width={chartWidth - 24}
                    height={140}
                    startMs={startMs}
                    endMs={endMs}
                    nowMs={nowMs}
                    normalize={false}
                    showPeaks
                    variabilityFraction={showVariability ? 0.30 : undefined}
                  />
                </View>
              );
            })}
          </>
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricsRow({ stat }: { stat: PkSeriesStats }) {
  return (
    <View className="flex-row justify-between bg-surface-elevated rounded-lg px-3 py-2 mb-2">
      <Metric label="now" value={formatMcg(stat.currentMcg)} />
      <Metric label="peak" value={formatMcg(stat.peakMcg)} />
      <Metric
        label="since dose"
        value={
          stat.lastInjectedAt == null
            ? '—'
            : formatDuration(Date.now() - stat.lastInjectedAt)
        }
      />
      <Metric
        label="half-lives"
        value={
          stat.halfLivesSinceLastDose == null ? '—' : stat.halfLivesSinceLastDose.toFixed(1)
        }
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-white font-semibold text-sm">{value}</Text>
      <Text className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</Text>
    </View>
  );
}

function formatMcg(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k mcg`;
  if (v >= 100) return `${v.toFixed(0)} mcg`;
  if (v >= 10) return `${v.toFixed(0)} mcg`;
  if (v >= 1) return `${v.toFixed(1)} mcg`;
  if (v > 0) return `${v.toFixed(2)} mcg`;
  return '0 mcg';
}

function formatHours(h: number): string {
  if (h < 1) return `${(h * 60).toFixed(0)}m`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function formatDuration(ms: number): string {
  const h = ms / 3_600_000;
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}
