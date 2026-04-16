import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Badge } from '@peptpal/ui';
import { isDbAvailable } from '../../src/db/client';
import { getInjectionLogs } from '../../src/db/injectionLog';
import { getSymptomLogs } from '../../src/db/symptomLog';
import { getSchedules } from '../../src/db/schedules';
import { getInventoryItems } from '../../src/db/inventory';
import { computeDashboardAlerts, type DashboardAlert } from '../../src/lib/dashboardAlerts';
import { predictNextDose, formatTimeUntil, type NextDose } from '../../src/lib/nextDose';
import { listProtocols, getProtocolItems, type ProtocolRow, type ProtocolItemRow } from '../../src/db/protocols';
import { getCycleMetadata, computeCycleStatus } from '@peptpal/core';
import type { InjectionLog, SymptomLog, Schedule, InventoryItem } from '@peptpal/core';

export default function DashboardScreen() {
  const router = useRouter();
  const [recentLogs, setRecentLogs] = useState<InjectionLog[]>([]);
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomLog[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [nextDose, setNextDose] = useState<NextDose | null>(null);
  const [activeProtocols, setActiveProtocols] = useState<Array<ProtocolRow & { items: ProtocolItemRow[] }>>([]);
  const [weekStats, setWeekStats] = useState({ injections: 0, peptides: 0, totalMcg: 0 });
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isDbAvailable()) return;
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [logs, symptoms, scheds, inv, alertsData, nd, weekLogs, protocolsList] = await Promise.all([
      getInjectionLogs({ limit: 3 }),
      getSymptomLogs({ limit: 3 }),
      getSchedules(),
      getInventoryItems(),
      computeDashboardAlerts(),
      predictNextDose(),
      getInjectionLogs({ since: weekAgo, limit: 500 }),
      listProtocols(true),
    ]);
    setRecentLogs(logs);
    setRecentSymptoms(symptoms);
    setSchedules(scheds.filter((s) => !s.deleted_at));
    setInventory(inv);
    setAlerts(alertsData);
    setNextDose(nd);
    setWeekStats({
      injections: weekLogs.length,
      peptides: new Set(weekLogs.map((l) => l.peptide_name)).size,
      totalMcg: weekLogs.reduce((s, l) => s + l.dose_mcg, 0),
    });
    // Streak: consecutive days ending today with at least one injection.
    const daysWithLogs = new Set(
      weekLogs.map((l) => new Date(l.injected_at).toISOString().slice(0, 10)),
    );
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      if (daysWithLogs.has(day)) s++;
      else if (i === 0) continue; // allow today to not yet have an injection
      else break;
    }
    setStreak(s);
    const withItems = await Promise.all(
      protocolsList.map(async (p) => ({ ...p, items: await getProtocolItems(p.id) })),
    );
    setActiveProtocols(withItems);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const activeInventory = inventory.filter((i) => i.reconstituted && !i.deleted_at);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <View className="pt-4 pb-2">
          <Text className="text-slate-400 text-sm">
            {format(new Date(), 'EEEE, MMMM d')}
          </Text>
          <Text className="text-white text-2xl font-bold">Dashboard</Text>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-2 my-4">
          <QuickAction emoji="💉" label="Log Injection" onPress={() => router.push('/(tabs)/log/new')} />
          <QuickAction emoji="🔔" label="Log Symptom" onPress={() => router.push('/(tabs)/symptoms/new')} />
          <QuickAction emoji="🧮" label="Calculator" onPress={() => router.push('/modals/reconstitution-calc')} />
        </View>

        {/* Week-at-a-glance stats */}
        <View className="flex-row gap-2 mb-4">
          <StatTile label="7-day injections" value={String(weekStats.injections)} tone="primary" />
          <StatTile label="peptides" value={String(weekStats.peptides)} tone="default" />
          <StatTile
            label="streak (d)"
            value={String(streak)}
            tone={streak >= 3 ? 'emerald' : 'default'}
          />
        </View>

        {/* Active protocols summary */}
        {activeProtocols.length > 0 && (
          <TouchableOpacity
            className="bg-surface-card rounded-2xl p-3 mb-4 border border-surface-border"
            onPress={() => router.push('/(tabs)/schedule/protocols')}
            activeOpacity={0.85}
          >
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-slate-400 text-[10px] uppercase font-semibold">Active Protocols</Text>
              <Text className="text-primary-400 text-xs">Manage →</Text>
            </View>
            {activeProtocols.slice(0, 3).map((p) => (
              <View key={p.id} className="flex-row items-center justify-between py-1">
                <Text className="text-white font-semibold text-sm">{p.name}</Text>
                <Text className="text-slate-400 text-xs">{p.items.length} peptide{p.items.length === 1 ? '' : 's'}</Text>
              </View>
            ))}
            {activeProtocols.length > 3 && (
              <Text className="text-slate-500 text-xs mt-1">+ {activeProtocols.length - 3} more</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <View className="mb-4">
            {alerts.slice(0, 4).map((a, i) => (
              <AlertCard key={i} alert={a} onPress={() => a.route && router.push(a.route as never)} />
            ))}
            {alerts.length > 4 && (
              <Text className="text-slate-500 text-xs mt-1 px-1">
                + {alerts.length - 4} more alert{alerts.length - 4 === 1 ? '' : 's'}
              </Text>
            )}
          </View>
        )}

        {/* Cycle countdowns */}
        {schedules.length > 0 && (() => {
          const cycling = schedules
            .map((s) => {
              const slug = s.peptide_name
                .toLowerCase()
                .replace(/\s*\(.*?\)\s*/g, '')
                .trim()
                .replace(/[^a-z0-9]+/g, '-');
              const meta = getCycleMetadata(slug);
              if (!meta.requiresCycling || meta.maxWeeksOn == null) return null;
              const status = computeCycleStatus(s.start_date, meta);
              return { schedule: s, meta, status };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null);
          if (cycling.length === 0) return null;
          return (
            <TouchableOpacity
              className="bg-surface-card rounded-2xl p-3 mb-4 border border-surface-border"
              onPress={() => router.push('/(tabs)/schedule/cycles')}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-slate-400 text-[10px] uppercase font-semibold">Cycle countdowns</Text>
                <Text className="text-primary-400 text-xs">Open →</Text>
              </View>
              {cycling.slice(0, 3).map((c) => {
                const remaining = Math.max(0, (c.meta.maxWeeksOn ?? 0) - c.status.weeksOn);
                const tone =
                  c.status.status === 'overdue' ? 'text-red-300' :
                  c.status.status === 'warning' ? 'text-amber-300' : 'text-emerald-300';
                return (
                  <View key={c.schedule.id} className="flex-row justify-between py-1">
                    <Text className="text-slate-200 text-xs font-semibold">{c.schedule.peptide_name}</Text>
                    <Text className={`text-xs ${tone}`}>
                      {c.status.status === 'overdue'
                        ? `${Math.round(c.status.weeksOn - (c.meta.maxWeeksOn ?? 0))}w overdue`
                        : `${remaining.toFixed(1)}w remaining`}
                    </Text>
                  </View>
                );
              })}
            </TouchableOpacity>
          );
        })()}

        {/* Today's plan from active protocols */}
        {activeProtocols.length > 0 && (
          <View className="bg-surface-card rounded-2xl p-3 mb-4 border border-surface-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-[10px] uppercase font-semibold">Today's plan</Text>
              <Text className="text-slate-500 text-[10px]">
                from {activeProtocols.length} protocol{activeProtocols.length === 1 ? '' : 's'}
              </Text>
            </View>
            {activeProtocols
              .flatMap((p) => p.items.map((i) => ({ ...i, protocolName: p.name })))
              .filter((i) => i.doses_per_week >= 1) // weekly+ peptides show up daily-ish
              .slice(0, 6)
              .map((i, idx) => (
                <View key={idx} className="flex-row items-center justify-between py-1">
                  <View className="flex-1">
                    <Text className="text-slate-200 text-xs font-semibold">
                      {i.peptide_name}
                    </Text>
                    <Text className="text-slate-500 text-[10px]">
                      {i.protocolName} · {i.doses_per_week.toFixed(1)}×/wk
                    </Text>
                  </View>
                  <Text className="text-slate-300 text-xs font-semibold">{i.dose_mcg} mcg</Text>
                </View>
              ))}
          </View>
        )}

        {/* Next dose from active protocol */}
        {nextDose && (
          <TouchableOpacity
            className={`rounded-2xl p-4 mb-4 border ${
              nextDose.overdue
                ? 'bg-amber-900/20 border-amber-800'
                : 'bg-primary-900/20 border-primary-800'
            }`}
            onPress={() => router.push('/(tabs)/log/new')}
            activeOpacity={0.85}
          >
            <Text className={`text-[10px] uppercase font-semibold ${
              nextDose.overdue ? 'text-amber-300' : 'text-primary-300'
            }`}>
              {nextDose.overdue ? 'Overdue' : 'Next Dose'}
            </Text>
            <Text className="text-white font-bold text-base mt-1">
              {nextDose.peptideName} · {nextDose.doseMcg} mcg
            </Text>
            <Text className="text-slate-400 text-xs mt-0.5">
              From "{nextDose.protocolName}" · {formatTimeUntil(nextDose.dueAt)}
              {!nextDose.overdue ? ' from now' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Upcoming Schedules */}
        {schedules.length > 0 && (
          <Section title="Today's Schedule" onSeeAll={() => router.push('/(tabs)/schedule')}>
            {schedules.slice(0, 3).map((s) => (
              <View key={s.id} className="bg-surface-card rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-semibold text-sm">{s.peptide_name}</Text>
                  <Text className="text-slate-400 text-xs">{s.dose_mcg} mcg</Text>
                </View>
                {s.reminder_enabled && <Badge variant="info">🔔 Reminder</Badge>}
              </View>
            ))}
          </Section>
        )}

        {/* Active Inventory */}
        {activeInventory.length > 0 && (
          <Section title="Active Vials" onSeeAll={() => router.push('/(tabs)/inventory')}>
            {activeInventory.slice(0, 3).map((item) => (
              <View key={item.id} className="bg-surface-card rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-semibold text-sm">{item.peptide_name}</Text>
                  <Text className="text-slate-400 text-xs">
                    {item.concentration_mcg_per_ml} mcg/mL · {item.vial_count} vial{item.vial_count !== 1 ? 's' : ''}
                  </Text>
                </View>
                {item.expiry_at && (
                  <Badge variant={new Date(item.expiry_at) < new Date() ? 'danger' : 'success'}>
                    {new Date(item.expiry_at) < new Date() ? 'Expired' : 'Active'}
                  </Badge>
                )}
              </View>
            ))}
          </Section>
        )}

        {/* Recent Injections */}
        <Section title="Recent Injections" onSeeAll={() => router.push('/(tabs)/log')}>
          {recentLogs.length === 0 ? (
            <EmptyState message="No injections logged yet" />
          ) : (
            recentLogs.map((log) => (
              <View key={log.id} className="bg-surface-card rounded-xl px-4 py-3 mb-2">
                <View className="flex-row justify-between items-start">
                  <Text className="text-white font-semibold text-sm">{log.peptide_name}</Text>
                  <Text className="text-slate-400 text-xs">
                    {format(new Date(log.injected_at), 'MMM d, h:mm a')}
                  </Text>
                </View>
                <Text className="text-slate-400 text-xs mt-0.5">
                  {log.dose_mcg} mcg{log.dose_ml ? ` · ${log.dose_ml} mL` : ''}
                  {log.injection_site ? ` · ${log.injection_site.replace('_', ' ')}` : ''}
                </Text>
              </View>
            ))
          )}
        </Section>

        {/* Recent Symptoms */}
        <Section title="Recent Symptoms" onSeeAll={() => router.push('/(tabs)/symptoms')}>
          {recentSymptoms.length === 0 ? (
            <EmptyState message="No symptoms logged yet" />
          ) : (
            recentSymptoms.map((s) => (
              <View key={s.id} className="bg-surface-card rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
                <Text className="text-white text-sm font-medium capitalize">{s.symptom}</Text>
                <View className="flex-row items-center gap-2">
                  <Badge variant={s.severity >= 7 ? 'danger' : s.severity >= 4 ? 'warning' : 'default'}>
                    {s.severity}/10
                  </Badge>
                  <Text className="text-slate-500 text-xs">
                    {format(new Date(s.occurred_at), 'MMM d')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Section>
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      className="flex-1 bg-surface-card rounded-2xl py-4 items-center gap-1.5 active:bg-surface-elevated"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text className="text-slate-300 text-xs font-medium text-center">{label}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll: () => void; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-base">{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-primary-400 text-sm">See all</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="bg-surface-card rounded-xl px-4 py-6 items-center">
      <Text className="text-slate-500 text-sm">{message}</Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'primary' | 'emerald';
}) {
  const tones = {
    default: { bg: 'bg-surface-card', border: 'border-surface-border', text: 'text-white' },
    primary: { bg: 'bg-primary-900/20', border: 'border-primary-800', text: 'text-primary-300' },
    emerald: { bg: 'bg-emerald-900/20', border: 'border-emerald-800', text: 'text-emerald-300' },
  } as const;
  const t = tones[tone];
  return (
    <View className={`flex-1 ${t.bg} border ${t.border} rounded-xl p-3`}>
      <Text className="text-slate-500 text-[10px] uppercase font-semibold">{label}</Text>
      <Text className={`${t.text} font-bold text-lg mt-0.5`}>{value}</Text>
    </View>
  );
}

function AlertCard({ alert, onPress }: { alert: DashboardAlert; onPress: () => void }) {
  const tone = alert.severity === 'danger'
    ? { bg: 'bg-red-900/25', border: 'border-red-800', text: 'text-red-300', icon: '⛔' }
    : { bg: 'bg-amber-900/20', border: 'border-amber-800', text: 'text-amber-300', icon: '⚠' };
  return (
    <TouchableOpacity
      className={`${tone.bg} ${tone.border} border rounded-xl px-3 py-2 mb-2 active:opacity-80`}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="flex-row items-start gap-2">
        <Text style={{ fontSize: 14 }}>{tone.icon}</Text>
        <View className="flex-1">
          <Text className={`${tone.text} font-semibold text-xs`}>{alert.title}</Text>
          <Text className="text-slate-300 text-[11px] leading-4 mt-0.5">{alert.body}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
