import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Card, Badge } from '@peptpal/ui';
import { getInjectionLogs } from '../../src/db/injectionLog';
import { getSymptomLogs } from '../../src/db/symptomLog';
import { getSchedules } from '../../src/db/schedules';
import { getInventoryItems } from '../../src/db/inventory';
import type { InjectionLog, SymptomLog, Schedule, InventoryItem } from '@peptpal/core';

export default function DashboardScreen() {
  const router = useRouter();
  const [recentLogs, setRecentLogs] = useState<InjectionLog[]>([]);
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomLog[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [logs, symptoms, scheds, inv] = await Promise.all([
      getInjectionLogs({ limit: 3 }),
      getSymptomLogs({ limit: 3 }),
      getSchedules(),
      getInventoryItems(),
    ]);
    setRecentLogs(logs);
    setRecentSymptoms(symptoms);
    setSchedules(scheds.filter((s) => !s.deleted_at));
    setInventory(inv);
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

        {/* Upcoming Schedules */}
        {schedules.length > 0 && (
          <Section title="Today's Schedule" onSeeAll={() => router.push('/(tabs)/schedule/index')}>
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
          <Section title="Active Vials" onSeeAll={() => router.push('/(tabs)/inventory/index')}>
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
        <Section title="Recent Injections" onSeeAll={() => router.push('/(tabs)/log/index')}>
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
        <Section title="Recent Symptoms" onSeeAll={() => router.push('/(tabs)/symptoms/index')}>
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
