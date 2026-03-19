import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { TimelineRow, Badge, Card } from '@peptpal/ui';
import { detectSymptomPatterns } from '@peptpal/core';
import { getSymptomLogs, softDeleteSymptomLog } from '../../../src/db/symptomLog';
import { getInjectionLogs } from '../../../src/db/injectionLog';
import type { SymptomLog, InjectionLog } from '@peptpal/core';

export default function SymptomsScreen() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [injections, setInjections] = useState<InjectionLog[]>([]);

  const load = useCallback(async () => {
    const [s, i] = await Promise.all([getSymptomLogs(), getInjectionLogs()]);
    setSymptoms(s);
    setInjections(i);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Pattern detection
  const patterns = detectSymptomPatterns(
    injections.map((i) => ({
      peptideId: String(i.peptide_ref_id),
      peptideName: i.peptide_name,
      injectedAt: new Date(i.injected_at),
    })),
    symptoms.map((s) => ({
      symptom: s.symptom,
      occurredAt: new Date(s.occurred_at),
    })),
  );

  // Merge and sort by time
  type TimelineItem =
    | { type: 'injection'; data: InjectionLog; time: Date }
    | { type: 'symptom'; data: SymptomLog; time: Date };

  const timeline: TimelineItem[] = [
    ...injections.map((i) => ({ type: 'injection' as const, data: i, time: new Date(i.injected_at) })),
    ...symptoms.map((s) => ({ type: 'symptom' as const, data: s, time: new Date(s.occurred_at) })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-3 items-center mb-4 active:bg-primary-700"
          onPress={() => router.push('/(tabs)/symptoms/new')}
        >
          <Text className="text-white font-bold">+ Log Symptom</Text>
        </TouchableOpacity>

        {/* Pattern notices */}
        {patterns.length > 0 && (
          <Card className="mb-4 bg-warning-900/20 border border-warning-700/40">
            <Text className="text-warning-400 font-bold mb-2">⚠️ Patterns Detected</Text>
            {patterns.map((p, i) => (
              <Text key={i} className="text-warning-300 text-sm leading-relaxed mb-1">
                {p.message}
              </Text>
            ))}
          </Card>
        )}

        {/* Timeline */}
        <Text className="text-white font-bold text-base mb-3">Timeline</Text>
        {timeline.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-slate-500">No events logged yet</Text>
          </View>
        ) : (
          <View>
            {timeline.map((item, idx) => {
              if (item.type === 'injection') {
                const log = item.data as InjectionLog;
                return (
                  <TimelineRow
                    key={`inj-${log.id}`}
                    type="injection"
                    title={log.peptide_name}
                    subtitle={`${log.dose_mcg} mcg${log.injection_site ? ' · ' + log.injection_site.replace(/_/g, ' ') : ''}`}
                    timestamp={format(item.time, 'MMM d, h:mm a')}
                    isLast={idx === timeline.length - 1}
                  />
                );
              }
              const sym = item.data as SymptomLog;
              return (
                <TimelineRow
                  key={`sym-${sym.id}`}
                  type="symptom"
                  title={sym.symptom}
                  subtitle={`Severity: ${sym.severity}/10${sym.notes ? ' · ' + sym.notes : ''}`}
                  timestamp={format(item.time, 'MMM d, h:mm a')}
                  isLast={idx === timeline.length - 1}
                />
              );
            })}
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
