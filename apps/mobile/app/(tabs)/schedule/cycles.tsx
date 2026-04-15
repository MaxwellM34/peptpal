import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getCycleMetadata, computeCycleStatus, type CycleStatus } from '@peptpal/core';
import { getSchedules } from '../../../src/db/schedules';
import type { Schedule } from '@peptpal/core';

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-z0-9]+/g, '-');
}

const STATUS_STYLE: Record<CycleStatus['status'], { bg: string; border: string; text: string; label: string }> = {
  ok: { bg: 'bg-emerald-900/20', border: 'border-emerald-800', text: 'text-emerald-300', label: 'On Track' },
  warning: { bg: 'bg-amber-900/20', border: 'border-amber-800', text: 'text-amber-300', label: 'Approaching Break' },
  overdue: { bg: 'bg-red-900/20', border: 'border-red-800', text: 'text-red-300', label: 'Overdue Break' },
};

export default function CyclesScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const load = useCallback(async () => {
    const rows = await getSchedules();
    setSchedules(rows.filter((s) => !s.deleted_at));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const active = schedules.map((s) => {
    const meta = getCycleMetadata(slugify(s.peptide_name));
    const status = computeCycleStatus(s.start_date, meta);
    return { schedule: s, meta, status };
  });

  const overdue = active.filter((a) => a.status.status === 'overdue').length;
  const warnings = active.filter((a) => a.status.status === 'warning').length;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-slate-200 text-base font-bold mb-1">Cycle Planner</Text>
        <Text className="text-slate-500 text-xs mb-4">
          Tracks desensitisation risk on your active schedules. GH secretagogues require structured breaks.
        </Text>

        {active.length > 0 && (
          <View className="flex-row gap-2 mb-4">
            <Stat label="Active" value={active.length} />
            <Stat label="Warnings" value={warnings} tone={warnings > 0 ? 'warning' : 'ok'} />
            <Stat label="Overdue" value={overdue} tone={overdue > 0 ? 'danger' : 'ok'} />
          </View>
        )}

        {active.map(({ schedule, meta, status }) => {
          const s = STATUS_STYLE[status.status];
          const pct = meta.maxWeeksOn
            ? Math.min(100, (status.weeksOn / meta.maxWeeksOn) * 100)
            : 0;
          return (
            <View key={schedule.id} className={`${s.bg} rounded-2xl p-4 mb-3 border ${s.border}`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-bold text-base flex-1">{schedule.peptide_name}</Text>
                <View className={`${s.bg} ${s.border} border rounded-full px-2 py-0.5`}>
                  <Text className={`${s.text} text-[10px] font-semibold uppercase`}>{s.label}</Text>
                </View>
              </View>

              <Text className="text-slate-400 text-xs mb-2 capitalize">
                {meta.category.replace('_', ' ')} · {Math.floor(status.daysOn)} days on
              </Text>

              {meta.maxWeeksOn != null && (
                <View className="mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-slate-500 text-[10px]">
                      Week {Math.ceil(status.weeksOn)} of {meta.maxWeeksOn}
                    </Text>
                    <Text className="text-slate-500 text-[10px]">{pct.toFixed(0)}%</Text>
                  </View>
                  <View className="h-1.5 bg-surface-elevated rounded-full">
                    <View
                      className={`h-1.5 rounded-full ${
                        status.status === 'overdue' ? 'bg-red-500' :
                        status.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                </View>
              )}

              <Text className={`${s.text} text-xs font-semibold mb-2`}>{status.message}</Text>
              <Text className="text-slate-400 text-xs leading-5">{meta.cycleNote}</Text>

              {meta.pulsingOption && (
                <Text className="text-slate-500 text-[10px] mt-2 italic">
                  💡 5-on / 2-off pulsing can extend cycle length before desensitisation.
                </Text>
              )}
            </View>
          );
        })}

        {active.length === 0 && (
          <View className="bg-surface-card rounded-2xl p-6 items-center">
            <Text className="text-slate-400 text-sm">No active schedules.</Text>
            <Text className="text-slate-500 text-xs mt-1">
              Create a schedule to see cycle tracking.
            </Text>
          </View>
        )}

        <View className="bg-surface-card rounded-2xl p-4 mt-2 border border-surface-border">
          <Text className="text-slate-200 font-bold mb-2 text-sm">About Cycling</Text>
          <Text className="text-slate-400 text-xs leading-5 mb-2">
            <Text className="text-slate-300 font-semibold">GH secretagogues</Text> (CJC-1295, Ipamorelin, Hexarelin) cause
            pituitary receptor desensitisation. A mandatory 4-week break after 8–12 weeks restores sensitivity.
          </Text>
          <Text className="text-slate-400 text-xs leading-5 mb-2">
            <Text className="text-slate-300 font-semibold">Healing peptides</Text> (BPC-157, TB-500, GHK-Cu) don't cause
            receptor downregulation. Cycle length is goal-driven rather than mandatory.
          </Text>
          <Text className="text-slate-400 text-xs leading-5">
            <Text className="text-slate-300 font-semibold">GLP-1 agonists</Text> (semaglutide) are long-term maintenance
            medications — stopping typically causes rebound weight regain. Consult your provider before discontinuing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, tone = 'ok' }: { label: string; value: number; tone?: 'ok' | 'warning' | 'danger' }) {
  const color = tone === 'danger' ? 'text-red-400' : tone === 'warning' ? 'text-amber-400' : 'text-emerald-400';
  return (
    <View className="flex-1 bg-surface-card rounded-xl p-3 border border-surface-border">
      <Text className="text-slate-500 text-[10px] uppercase font-semibold">{label}</Text>
      <Text className={`${color} text-xl font-bold`}>{value}</Text>
    </View>
  );
}
