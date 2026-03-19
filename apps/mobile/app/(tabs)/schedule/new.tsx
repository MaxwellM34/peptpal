import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { TextInput, Button } from '@peptpal/ui';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import { createSchedule } from '../../../src/db/schedules';

const FREQUENCY_OPTIONS = [
  { label: 'Daily', hours: 24 },
  { label: 'Twice Daily', hours: 12 },
  { label: 'Every Other Day', hours: 48 },
  { label: 'Weekly', hours: 168 },
  { label: 'Custom', hours: null },
];

export default function NewScheduleScreen() {
  const router = useRouter();
  const { data: peptideList } = usePeptideList();

  const [peptideRefId, setPeptideRefId] = useState<number | null>(null);
  const [peptideName, setPeptideName] = useState('');
  const [doseMcg, setDoseMcg] = useState('');
  const [selectedFreq, setSelectedFreq] = useState<number | null>(24);
  const [customHours, setCustomHours] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [reminders, setReminders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const peptides = peptideList?.items ?? [];
  const freqHours = selectedFreq ?? (customHours ? parseFloat(customHours) : null);

  function validate() {
    const errs: Record<string, string> = {};
    if (!peptideRefId) errs['peptide'] = 'Select a peptide';
    const d = parseFloat(doseMcg);
    if (isNaN(d) || d <= 0) errs['dose'] = 'Enter a valid dose';
    if (!startDate) errs['start'] = 'Enter a start date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const scheduleId = await createSchedule({
        peptide_ref_id: peptideRefId!,
        peptide_name: peptideName,
        frequency_hours: freqHours,
        dose_mcg: parseFloat(doseMcg),
        start_date: startDate,
        end_date: endDate || null,
        reminder_enabled: reminders,
      });

      // Schedule first notification if enabled
      if (reminders && freqHours) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Time to dose: ${peptideName}`,
              body: `Scheduled dose: ${doseMcg} mcg`,
              data: { scheduleId, screen: '/(tabs)/log/new' },
            },
            trigger: {
              seconds: freqHours * 3600,
              repeats: true,
            } as Notifications.TimeIntervalTriggerInput,
          });
        }
      }

      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New Schedule' }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">

            {/* Peptide */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Peptide *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {peptides.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      className={`px-4 py-2 rounded-xl border ${peptideRefId === p.id ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                      onPress={() => { setPeptideRefId(p.id); setPeptideName(p.name); }}
                    >
                      <Text className={`text-sm font-medium ${peptideRefId === p.id ? 'text-white' : 'text-slate-300'}`}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors['peptide'] && <Text className="text-danger-400 text-xs mt-1">{errors['peptide']}</Text>}
            </View>

            <TextInput
              label="Dose (mcg) *"
              placeholder="e.g. 250"
              keyboardType="decimal-pad"
              value={doseMcg}
              onChangeText={setDoseMcg}
              error={errors['dose']}
              className="mb-4"
            />

            {/* Frequency */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Frequency</Text>
              <View className="flex-row flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    className={`px-4 py-2 rounded-xl border ${selectedFreq === opt.hours ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                    onPress={() => setSelectedFreq(opt.hours)}
                  >
                    <Text className={`text-sm font-medium ${selectedFreq === opt.hours ? 'text-white' : 'text-slate-300'}`}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedFreq === null && (
                <TextInput
                  placeholder="Enter hours between doses"
                  keyboardType="decimal-pad"
                  value={customHours}
                  onChangeText={setCustomHours}
                  className="mt-2"
                />
              )}
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <TextInput label="Start Date" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} error={errors['start']} />
              </View>
              <View className="flex-1">
                <TextInput label="End Date (optional)" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
              </View>
            </View>

            {/* Reminders toggle */}
            <TouchableOpacity
              className={`mb-6 flex-row items-center gap-3 p-4 rounded-xl border ${reminders ? 'bg-primary-900/30 border-primary-700' : 'bg-surface-elevated border-surface-border'}`}
              onPress={() => setReminders(!reminders)}
            >
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${reminders ? 'bg-primary-600 border-primary-600' : 'border-surface-border'}`}>
                {reminders && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <View>
                <Text className="text-white font-medium">Enable Reminders</Text>
                <Text className="text-slate-400 text-xs">Push notifications for this schedule</Text>
              </View>
            </TouchableOpacity>

            <Button onPress={handleSave} loading={saving} size="lg" className="mb-8">
              Create Schedule
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
