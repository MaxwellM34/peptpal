import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { TextInput, Button, Slider } from '@peptpal/ui';
import { createSymptomLog } from '../../../src/db/symptomLog';
import { getInjectionLogs } from '../../../src/db/injectionLog';
import type { InjectionLog } from '@peptpal/core';

const COMMON_SYMPTOMS = [
  'nausea', 'headache', 'fatigue', 'flushing', 'dizziness', 'injection site redness',
  'water retention', 'numbness/tingling', 'insomnia', 'increased hunger', 'lethargy',
  'irritability', 'mood changes', 'elevated heart rate', 'sweating',
];

export default function NewSymptomScreen() {
  const router = useRouter();
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState(5);
  const [occurredAt, setOccurredAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState('');
  const [linkedLogId, setLinkedLogId] = useState<number | null>(null);
  const [recentLogs, setRecentLogs] = useState<InjectionLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getInjectionLogs({ limit: 10 }).then(setRecentLogs);
  }, []);

  async function handleSubmit() {
    if (!symptom.trim()) { setError('Enter a symptom'); return; }
    setError('');
    setSaving(true);
    try {
      await createSymptomLog({
        symptom: symptom.trim().toLowerCase(),
        severity,
        occurred_at: new Date(occurredAt).toISOString(),
        notes: notes.trim() || null,
        peptide_log_id: linkedLogId,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Log Symptom' }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">

            {/* Common suggestions */}
            <Text className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">
              Common Symptoms
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {COMMON_SYMPTOMS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    className={`px-3 py-1.5 rounded-full border ${
                      symptom === s ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'
                    }`}
                    onPress={() => setSymptom(s)}
                  >
                    <Text className={`text-xs font-medium capitalize ${symptom === s ? 'text-white' : 'text-slate-300'}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              label="Symptom *"
              placeholder="Describe the symptom"
              value={symptom}
              onChangeText={setSymptom}
              error={error}
              className="mb-4"
            />

            <View className="mb-4">
              <Slider
                label="Severity"
                value={severity}
                min={1}
                max={10}
                step={1}
                onValueChange={setSeverity}
              />
            </View>

            <TextInput
              label="Timestamp"
              value={occurredAt}
              onChangeText={setOccurredAt}
              hint="Format: YYYY-MM-DDTHH:mm"
              className="mb-4"
            />

            {/* Link to injection */}
            {recentLogs.length > 0 && (
              <View className="mb-4">
                <Text className="text-slate-300 text-sm font-medium mb-1.5">
                  Link to Recent Injection (optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className={`px-3 py-2 rounded-xl border ${!linkedLogId ? 'bg-surface-elevated border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                      onPress={() => setLinkedLogId(null)}
                    >
                      <Text className="text-slate-400 text-xs">None</Text>
                    </TouchableOpacity>
                    {recentLogs.map((l) => (
                      <TouchableOpacity
                        key={l.id}
                        className={`px-3 py-2 rounded-xl border ${linkedLogId === l.id ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                        onPress={() => setLinkedLogId(l.id)}
                      >
                        <Text className={`text-xs font-medium ${linkedLogId === l.id ? 'text-white' : 'text-slate-300'}`}>
                          {l.peptide_name}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                          {format(new Date(l.injected_at), 'MMM d h:mm a')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <TextInput
              label="Notes (optional)"
              placeholder="Additional details..."
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              className="min-h-20 mb-6"
            />

            <Button onPress={handleSubmit} loading={saving} size="lg" className="mb-8">
              Save Symptom
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
