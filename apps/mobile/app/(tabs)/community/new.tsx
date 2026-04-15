import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Button, TextInput } from '@peptpal/ui';
import { getProtocolSeed, lbsToKg } from '@peptpal/core';
import { createDoseLogPost } from '../../../src/api/client';
import { getUserProfile } from '../../../src/db/profile';
import { getClientUuid } from '../../../src/lib/clientId';

const GOALS = [
  'injury_recovery',
  'anti_aging',
  'body_composition',
  'gi_repair',
  'sleep_recovery',
  'skin_hair',
  'weight_loss',
  'sexual_health',
];

export default function NewPost() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const seed = slug ? getProtocolSeed(slug) : undefined;

  const [weightLbs, setWeightLbs] = useState('');
  const [doseMcg, setDoseMcg] = useState('');
  const [dosesPerWeek, setDosesPerWeek] = useState('');
  const [weeksOn, setWeeksOn] = useState('');
  const [goal, setGoal] = useState<string>(GOALS[0]!);
  const [outcome, setOutcome] = useState<number>(0);
  const [severity, setSeverity] = useState<number>(0);
  const [bloodwork, setBloodwork] = useState(false);
  const [bodyComp, setBodyComp] = useState(false);
  const [batchInfo, setBatchInfo] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const p = await getUserProfile();
      if (p?.weight_kg) setWeightLbs((p.weight_kg * 2.2046).toFixed(0));
    })();
  }, []);

  async function handleSubmit() {
    if (!slug) return;
    const w = parseFloat(weightLbs);
    const d = parseFloat(doseMcg);
    const f = parseFloat(dosesPerWeek);
    if (!w || w < 60) return Alert.alert('Weight required', 'Enter your weight in lb.');
    if (!d || d <= 0) return Alert.alert('Dose required', '');
    if (!f || f <= 0) return Alert.alert('Frequency required', '');

    if (seed && d > seed.hardCeilingMcg) {
      return Alert.alert(
        'Dose exceeds hard ceiling',
        `Community-enforced ceiling for ${seed.name} is ${seed.hardCeilingMcg} mcg per dose. Posts above this are not accepted.`,
      );
    }
    const weeks = weeksOn ? parseInt(weeksOn, 10) : undefined;
    setSaving(true);
    try {
      const uuid = await getClientUuid();
      await createDoseLogPost({
        client_uuid: uuid,
        peptide_slug: slug,
        dose_mcg: d,
        doses_per_week: f,
        weeks_on: weeks,
        user_weight_kg: lbsToKg(w),
        goal,
        outcome_score: outcome === 0 ? undefined : outcome,
        side_effect_severity: severity === 0 ? undefined : severity,
        bloodwork_attached: bloodwork,
        body_composition_attached: bodyComp,
        batch_info_attached: batchInfo,
        longitudinal: (weeks ?? 0) >= 8,
        body: body.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Post failed', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: `Share ${seed?.name ?? ''}` }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-4">
              <Text className="text-amber-300 text-xs leading-5">
                Evidence-tagged posts count 5× more in the consensus median. If you have bloodwork, body comp,
                or COA data, the community gets more from your post.
              </Text>
            </View>

            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <TextInput
                  label="Your weight (lb) *"
                  placeholder="170"
                  keyboardType="decimal-pad"
                  value={weightLbs}
                  onChangeText={setWeightLbs}
                />
              </View>
              <View className="flex-1">
                <TextInput
                  label="Weeks on"
                  placeholder="8"
                  keyboardType="number-pad"
                  value={weeksOn}
                  onChangeText={setWeeksOn}
                />
              </View>
            </View>

            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <TextInput
                  label="Dose per inj. (mcg) *"
                  placeholder={String(seed?.startingDose.doseMcg ?? 250)}
                  keyboardType="decimal-pad"
                  value={doseMcg}
                  onChangeText={setDoseMcg}
                  hint={seed ? `Hard ceiling: ${seed.hardCeilingMcg} mcg` : undefined}
                />
              </View>
              <View className="flex-1">
                <TextInput
                  label="Doses / week *"
                  placeholder="7"
                  keyboardType="decimal-pad"
                  value={dosesPerWeek}
                  onChangeText={setDosesPerWeek}
                />
              </View>
            </View>

            <Text className="text-slate-300 text-sm font-medium mb-2">Goal</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  className={`px-3 py-1 rounded-full border ${
                    goal === g
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-surface-elevated border-surface-border'
                  }`}
                  onPress={() => setGoal(g)}
                >
                  <Text
                    className={`text-xs ${goal === g ? 'text-white' : 'text-slate-300'} capitalize`}
                  >
                    {g.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-slate-300 text-sm font-medium mb-2">Outcome</Text>
            <View className="flex-row gap-2 mb-4">
              {[
                { v: -2, l: 'Worse' },
                { v: -1, l: 'Slight ↓' },
                { v: 0, l: 'Same' },
                { v: 1, l: 'Improved' },
                { v: 2, l: 'Strong ↑' },
              ].map((o) => (
                <TouchableOpacity
                  key={o.v}
                  className={`flex-1 py-2 rounded-lg border items-center ${
                    outcome === o.v
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-surface-elevated border-surface-border'
                  }`}
                  onPress={() => setOutcome(o.v)}
                >
                  <Text className={`text-[10px] ${outcome === o.v ? 'text-white' : 'text-slate-300'}`}>
                    {o.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-slate-300 text-sm font-medium mb-2">
              Side effect severity (0 = none, 10 = severe)
            </Text>
            <View className="flex-row gap-1 mb-4">
              {Array.from({ length: 11 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  className={`flex-1 h-8 rounded items-center justify-center ${
                    i <= severity
                      ? i <= 3
                        ? 'bg-emerald-600'
                        : i <= 6
                        ? 'bg-amber-600'
                        : 'bg-red-600'
                      : 'bg-surface-elevated'
                  }`}
                  onPress={() => setSeverity(i)}
                >
                  <Text className="text-white text-[10px]">{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-slate-300 text-sm font-medium mb-2">Evidence attached</Text>
            <View className="gap-2 mb-4">
              <EvidenceToggle
                label="Bloodwork (5× weight)"
                active={bloodwork}
                onToggle={() => setBloodwork(!bloodwork)}
              />
              <EvidenceToggle
                label="Body composition (DEXA, BodPod)"
                active={bodyComp}
                onToggle={() => setBodyComp(!bodyComp)}
              />
              <EvidenceToggle
                label="Batch / COA info"
                active={batchInfo}
                onToggle={() => setBatchInfo(!batchInfo)}
              />
            </View>

            <TextInput
              label="Notes (optional)"
              multiline
              numberOfLines={4}
              placeholder="Any context on your protocol, reactions, titration..."
              value={body}
              onChangeText={setBody}
              className="min-h-24 mb-6"
              hint="No vendor links, no affiliate codes — auto-flagged posts are excluded from consensus."
            />

            <Button onPress={handleSubmit} loading={saving} size="lg" className="mb-8">
              Publish Pseudonymously
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function EvidenceToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      className={`rounded-xl p-3 border flex-row items-center ${
        active
          ? 'bg-emerald-900/30 border-emerald-700'
          : 'bg-surface-elevated border-surface-border'
      }`}
      onPress={onToggle}
    >
      <View
        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
          active ? 'bg-emerald-600 border-emerald-500' : 'border-slate-500'
        }`}
      >
        {active && <Text className="text-white text-xs">✓</Text>}
      </View>
      <Text className={`text-sm ${active ? 'text-emerald-300' : 'text-slate-300'}`}>{label}</Text>
    </TouchableOpacity>
  );
}
