import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LineChart } from '@peptpal/ui';
import { computePkSeries, expandBlendLogs, type PkSeries } from '@peptpal/core';
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

  const { series, startMs, endMs, nowMs } = useMemo(() => {
    const now = Date.now();
    const start = now - RANGE_HOURS[range] * 3_600_000;
    const end = now + 6 * 3_600_000;
    const injections = expandBlendLogs(logs, halfLives);
    const all = computePkSeries(injections, start, end, 120);
    return { series: all, startMs: start, endMs: end, nowMs: now };
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

        <View className="flex-row gap-2 mb-4">
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
        </View>

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
                      <Text
                        className="text-xs"
                        style={{ color: on ? '#e2e8f0' : '#64748b' }}
                      >
                        {s.peptideName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {series.map((s) => (
              <View key={s.peptideName} className="bg-surface-card rounded-2xl p-3 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
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
                  <Text className="text-slate-400 text-xs">
                    now: {formatNow(s)} mcg
                  </Text>
                </View>
                <LineChart
                  series={[s]}
                  width={chartWidth - 24}
                  height={140}
                  startMs={startMs}
                  endMs={endMs}
                  nowMs={nowMs}
                />
              </View>
            ))}
          </>
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatNow(s: PkSeries): string {
  const now = Date.now();
  const nearest = s.points.reduce((best, p) =>
    Math.abs(p.t - now) < Math.abs(best.t - now) ? p : best,
  );
  return nearest.mcg >= 10 ? nearest.mcg.toFixed(0) : nearest.mcg.toFixed(2);
}
