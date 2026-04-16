import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { format } from 'date-fns';
import { Badge } from '@peptpal/ui';
import { useTutorialHotspot, useTutorialScrollReset } from '../../../src/lib/tutorialContext';
import { getInjectionLogs, softDeleteInjectionLog } from '../../../src/db/injectionLog';
import { hapticWarn, hapticSuccess } from '../../../src/lib/haptics';
import type { InjectionLog } from '@peptpal/core';

export default function LogHistoryScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<InjectionLog[]>([]);
  const [peptideFilter, setPeptideFilter] = useState<string | null>(null);
  const levelsHotspot = useTutorialHotspot('log.levels_button');
  const listRef = useRef<FlatList<InjectionLog>>(null);
  useTutorialScrollReset(listRef);

  const peptideOptions = useMemo(() => {
    const names = new Set<string>();
    for (const l of logs) names.add(l.peptide_name);
    return Array.from(names).sort();
  }, [logs]);

  const visible = useMemo(() => {
    if (!peptideFilter) return logs;
    return logs.filter((l) => l.peptide_name === peptideFilter);
  }, [logs, peptideFilter]);

  const load = useCallback(async () => {
    const data = await getInjectionLogs();
    setLogs(data);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function handleDelete(id: number) {
    await softDeleteInjectionLog(id);
    void hapticSuccess();
    await load();
  }

  function confirmDelete(id: number, peptideName: string) {
    void hapticWarn();
    Alert.alert(
      `Delete ${peptideName}?`,
      'Soft-deleted; can be recovered manually from SQLite if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              className="flex-1 bg-primary-600 rounded-xl py-3 items-center active:bg-primary-700"
              onPress={() => router.push('/(tabs)/log/new')}
            >
              <Text className="text-white font-bold">+ Log Injection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface-card border border-surface-border rounded-xl py-3 px-3 items-center active:bg-surface-elevated"
              ref={levelsHotspot.ref}
              onLayout={levelsHotspot.onLayout}
              onPress={() => {
                levelsHotspot.onPress();
                router.push('/(tabs)/log/chart');
              }}
            >
              <Text className="text-slate-200 font-semibold">📈 Levels</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface-card border border-surface-border rounded-xl py-3 px-3 items-center active:bg-surface-elevated"
              onPress={() => router.push('/(tabs)/log/sites')}
            >
              <Text className="text-slate-200 font-semibold">🎯 Sites</Text>
            </TouchableOpacity>
          </View>
          {peptideOptions.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`px-3 py-1 rounded-full border ${
                    peptideFilter === null
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-surface-elevated border-surface-border'
                  }`}
                  onPress={() => setPeptideFilter(null)}
                >
                  <Text className={`text-[11px] font-medium ${peptideFilter === null ? 'text-white' : 'text-slate-300'}`}>
                    All
                  </Text>
                </TouchableOpacity>
                {peptideOptions.map((n) => (
                  <TouchableOpacity
                    key={n}
                    className={`px-3 py-1 rounded-full border ${
                      peptideFilter === n
                        ? 'bg-primary-600 border-primary-500'
                        : 'bg-surface-elevated border-surface-border'
                    }`}
                    onPress={() => setPeptideFilter(n)}
                  >
                    <Text className={`text-[11px] font-medium ${peptideFilter === n ? 'text-white' : 'text-slate-300'}`}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
          </View>
        }
        renderItem={({ item }) => (
          <LogItem
            log={item}
            onDelete={() => handleDelete(item.id)}
            onSwipeDelete={() => confirmDelete(item.id, item.peptide_name)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-slate-500 text-base">No injections logged yet</Text>
            <Text className="text-slate-600 text-sm mt-1">Tap the button above to get started</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function LogItem({
  log,
  onDelete,
  onSwipeDelete,
}: {
  log: InjectionLog;
  onDelete: () => void;
  onSwipeDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Swipeable
      friction={2}
      rightThreshold={48}
      renderRightActions={(progress) => {
        const scale = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
          extrapolate: 'clamp',
        });
        return (
          <View
            style={{
              backgroundColor: '#7f1d1d',
              justifyContent: 'center',
              alignItems: 'center',
              width: 100,
              marginBottom: 12,
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
            }}
          >
            <Animated.Text
              style={{ color: 'white', fontWeight: '700', fontSize: 13, transform: [{ scale }] }}
            >
              Delete
            </Animated.Text>
          </View>
        );
      }}
      onSwipeableOpen={() => onSwipeDelete()}
    >
    <TouchableOpacity
      className="bg-surface-card rounded-2xl mb-3 overflow-hidden"
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View className="px-4 py-3 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-white font-bold">{log.peptide_name}</Text>
          <Text className="text-slate-400 text-xs mt-0.5">
            {format(new Date(log.injected_at), 'MMM d, yyyy · h:mm a')}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-primary-400 font-bold">{log.dose_mcg} mcg</Text>
          {log.dose_ml != null && (
            <Text className="text-slate-500 text-xs">{log.dose_ml} mL</Text>
          )}
        </View>
      </View>

      {expanded && (
        <View className="px-4 pb-4 border-t border-surface-border pt-3 gap-2">
          {log.injection_site && (
            <DetailRow label="Site" value={log.injection_site.replace(/_/g, ' ')} />
          )}
          {log.notes && <DetailRow label="Notes" value={log.notes} />}
          <TouchableOpacity
            className="mt-2 py-2 border border-danger-700 rounded-xl items-center"
            onPress={onDelete}
          >
            <Text className="text-danger-400 text-sm">Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
    </Swipeable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-slate-500 text-xs w-14 flex-shrink-0">{label}</Text>
      <Text className="text-slate-300 text-xs flex-1 capitalize">{value}</Text>
    </View>
  );
}
