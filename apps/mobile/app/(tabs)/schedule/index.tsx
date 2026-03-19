import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@peptpal/ui';
import { getSchedules, softDeleteSchedule, updateScheduleReminder } from '../../../src/db/schedules';
import type { Schedule } from '@peptpal/core';

export default function ScheduleScreen() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const load = useCallback(async () => {
    const data = await getSchedules();
    setSchedules(data.filter((s) => !s.deleted_at));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function toggleReminder(id: number, enabled: boolean) {
    await updateScheduleReminder(id, enabled);
    await load();
  }

  async function handleDelete(id: number) {
    await softDeleteSchedule(id);
    await load();
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <FlatList
        data={schedules}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-3 items-center mb-4 active:bg-primary-700"
            onPress={() => router.push('/(tabs)/schedule/new')}
          >
            <Text className="text-white font-bold">+ New Schedule</Text>
          </TouchableOpacity>
        }
        renderItem={({ item: s }) => {
          const startDate = new Date(s.start_date);
          const daysSinceStart = differenceInDays(new Date(), startDate);
          const totalDays = s.end_date ? differenceInDays(new Date(s.end_date), startDate) : null;
          const progress = totalDays ? Math.min(100, (daysSinceStart / totalDays) * 100) : null;

          return (
            <View className="bg-surface-card rounded-2xl mb-3 p-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">{s.peptide_name}</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    {s.dose_mcg} mcg{s.frequency_hours ? ` · every ${s.frequency_hours}h` : ''}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-slate-400 text-xs">🔔</Text>
                  <Switch
                    value={s.reminder_enabled}
                    onValueChange={(v) => toggleReminder(s.id, v)}
                    trackColor={{ false: '#334155', true: '#1d4ed8' }}
                    thumbColor={s.reminder_enabled ? '#3b82f6' : '#64748b'}
                  />
                </View>
              </View>

              {/* Progress bar */}
              {progress !== null && (
                <View className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-slate-500 text-xs">Day {daysSinceStart + 1} of {totalDays}</Text>
                    <Text className="text-slate-500 text-xs">{progress.toFixed(0)}%</Text>
                  </View>
                  <View className="h-1.5 bg-surface-elevated rounded-full">
                    <View className="h-1.5 bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                  </View>
                </View>
              )}

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs">Started</Text>
                  <Text className="text-slate-300 text-xs">{format(startDate, 'MMM d, yyyy')}</Text>
                </View>
                {s.end_date && (
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs">Ends</Text>
                    <Text className="text-slate-300 text-xs">{format(new Date(s.end_date), 'MMM d, yyyy')}</Text>
                  </View>
                )}
                <TouchableOpacity
                  className="py-1.5 px-3 border border-danger-800 rounded-lg"
                  onPress={() => handleDelete(s.id)}
                >
                  <Text className="text-danger-400 text-xs">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-slate-500 text-base">No schedules yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
