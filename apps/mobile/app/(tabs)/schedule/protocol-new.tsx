import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { TextInput, Button, SyringeDiagram } from '@peptpal/ui';
import {
  GOAL_PROTOCOLS,
  PROTOCOL_SEEDS,
  solveRecipe,
  detectProtocolConflicts,
  type GoalKey,
  type ProtocolItem,
  type ReconstitutionRecipe,
} from '@peptpal/core';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import { createProtocol, getActiveProtocolItems } from '../../../src/db/protocols';
import { createSchedule } from '../../../src/db/schedules';

interface DraftItem {
  peptide_ref_id: number;
  peptide_name: string;
  peptide_slug: string;
  vial_size_mg: number;
  dose_mcg: number;
  doses_per_week: number;
  target_volume_ml: number;
}

export default function ProtocolNew() {
  const router = useRouter();
  const { goal } = useLocalSearchParams<{ goal?: string }>();
  const { data: peptideList } = usePeptideList();

  const [name, setName] = useState('');
  const [goalKey, setGoalKey] = useState<GoalKey | null>((goal as GoalKey) ?? null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);

  const peptides = peptideList?.items ?? [];

  // Seed items from a selected goal.
  useEffect(() => {
    if (!goalKey) return;
    const gp = GOAL_PROTOCOLS.find((g) => g.key === goalKey);
    if (!gp) return;
    if (peptides.length === 0) return;
    const seeded: DraftItem[] = [];
    for (const pp of gp.peptides) {
      const ref = peptides.find((p) => p.slug === pp.slug);
      const seed = PROTOCOL_SEEDS[pp.slug];
      if (!ref) continue;
      seeded.push({
        peptide_ref_id: ref.id,
        peptide_name: ref.name,
        peptide_slug: ref.slug,
        vial_size_mg: 5,
        dose_mcg: seed?.startingDose.doseMcg ?? 250,
        doses_per_week: seed?.startingDose.dosesPerWeek ?? 7,
        target_volume_ml: 0.10,
      });
    }
    setItems(seeded);
    if (!name && gp.label) setName(gp.label);
  }, [goalKey, peptides]);

  function addItem() {
    if (peptides.length === 0) return;
    const first = peptides[0]!;
    setItems((v) => [
      ...v,
      {
        peptide_ref_id: first.id,
        peptide_name: first.name,
        peptide_slug: first.slug,
        vial_size_mg: 5,
        dose_mcg: 250,
        doses_per_week: 7,
        target_volume_ml: 0.10,
      },
    ]);
  }

  function updateItem(idx: number, updates: Partial<DraftItem>) {
    setItems((v) => v.map((i, ix) => (ix === idx ? { ...i, ...updates } : i)));
  }

  function removeItem(idx: number) {
    setItems((v) => v.filter((_, ix) => ix !== idx));
  }

  async function handleSave() {
    if (!name.trim()) return Alert.alert('Name required', 'Give this protocol a name.');
    if (items.length === 0) return Alert.alert('Add at least one peptide', '');

    // Check for conflicts.
    const existing = await getActiveProtocolItems();
    const existingAsItems = existing.map((e) => ({
      peptideSlug: e.peptide_slug ?? '',
      peptideName: e.peptide_name,
      doseMcg: e.dose_mcg,
      dosesPerWeek: e.doses_per_week,
      targetVolumeMl: e.target_volume_ml,
      vialSizeMg: 5,
      protocolName: e.protocolName,
    }));
    const newAsItems: ProtocolItem[] = items.map((i) => ({
      peptideSlug: i.peptide_slug,
      peptideName: i.peptide_name,
      doseMcg: i.dose_mcg,
      dosesPerWeek: i.doses_per_week,
      targetVolumeMl: i.target_volume_ml,
      vialSizeMg: i.vial_size_mg,
    }));
    const conflicts = detectProtocolConflicts(newAsItems, existingAsItems);

    const proceed = async (withSchedules: boolean) => {
      setSaving(true);
      try {
        await createProtocol({
          name: name.trim(),
          goal: goalKey,
          active: true,
          items: items.map((i) => ({
            peptide_ref_id: i.peptide_ref_id,
            peptide_name: i.peptide_name,
            peptide_slug: i.peptide_slug,
            dose_mcg: i.dose_mcg,
            doses_per_week: i.doses_per_week,
            target_volume_ml: i.target_volume_ml,
            notes: null,
          })),
        });
        if (withSchedules) {
          const today = new Date().toISOString().slice(0, 10);
          for (const i of items) {
            await createSchedule({
              peptide_ref_id: i.peptide_ref_id,
              peptide_name: i.peptide_name,
              dose_mcg: i.dose_mcg,
              frequency_hours: i.doses_per_week > 0 ? (7 * 24) / i.doses_per_week : null,
              start_date: today,
              reminder_enabled: true,
            });
          }
        }
        router.back();
      } finally {
        setSaving(false);
      }
    };

    // Ask: do you want matching schedules auto-created?
    const runSave = () =>
      Alert.alert(
        'Create matching schedules?',
        'PeptPal can auto-create per-peptide schedules with reminder cadence from this protocol.',
        [
          { text: 'Just protocol', onPress: () => void proceed(false) },
          { text: 'Create schedules', onPress: () => void proceed(true) },
        ],
      );

    if (conflicts.length > 0) {
      Alert.alert(
        'Conflicts with active protocols',
        conflicts.map((c) => `• ${c.message}`).join('\n\n'),
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save anyway', onPress: runSave },
        ],
      );
    } else {
      runSave();
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Build Protocol' }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            <TextInput
              label="Protocol name *"
              placeholder="e.g. Healing + Sleep Stack"
              value={name}
              onChangeText={setName}
              className="mb-4"
            />

            <Text className="text-slate-300 text-sm font-medium mb-2">Goal (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {GOAL_PROTOCOLS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    className={`px-3 py-1.5 rounded-full border ${
                      goalKey === g.key
                        ? 'bg-primary-600 border-primary-500'
                        : 'bg-surface-elevated border-surface-border'
                    }`}
                    onPress={() => setGoalKey(goalKey === g.key ? null : g.key)}
                  >
                    <Text className={`text-xs ${goalKey === g.key ? 'text-white' : 'text-slate-300'}`}>
                      {g.emoji} {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text className="text-slate-200 font-bold mb-2">Peptides</Text>

            {items.map((item, idx) => (
              <ItemEditor
                key={idx}
                item={item}
                peptides={peptides}
                onChange={(u) => updateItem(idx, u)}
                onRemove={() => removeItem(idx)}
              />
            ))}

            <TouchableOpacity
              className="py-3 rounded-xl border border-dashed border-primary-700 items-center mb-4"
              onPress={addItem}
            >
              <Text className="text-primary-400 text-sm font-semibold">+ Add peptide</Text>
            </TouchableOpacity>

            <Button onPress={handleSave} loading={saving} size="lg" className="mb-8">
              Save + Activate
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function ItemEditor({
  item,
  peptides,
  onChange,
  onRemove,
}: {
  item: DraftItem;
  peptides: Array<{ id: number; name: string; slug: string }>;
  onChange: (updates: Partial<DraftItem>) => void;
  onRemove: () => void;
}) {
  const recipe: ReconstitutionRecipe = solveRecipe({
    peptideSlug: item.peptide_slug,
    peptideName: item.peptide_name,
    doseMcg: item.dose_mcg,
    dosesPerWeek: item.doses_per_week,
    targetVolumeMl: item.target_volume_ml,
    vialSizeMg: item.vial_size_mg,
  });

  return (
    <View className="bg-surface-card rounded-2xl p-3 mb-3 border border-surface-border">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-sm">{item.peptide_name}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text className="text-red-400 text-xs">Remove</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-1">
          {peptides.map((p) => (
            <TouchableOpacity
              key={p.id}
              className={`px-2 py-1 rounded-full border ${
                item.peptide_ref_id === p.id
                  ? 'bg-primary-600 border-primary-500'
                  : 'bg-surface-elevated border-surface-border'
              }`}
              onPress={() =>
                onChange({
                  peptide_ref_id: p.id,
                  peptide_name: p.name,
                  peptide_slug: p.slug,
                })
              }
            >
              <Text className={`text-[10px] ${item.peptide_ref_id === p.id ? 'text-white' : 'text-slate-300'}`}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <TextInput
            label="Dose mcg"
            keyboardType="decimal-pad"
            value={String(item.dose_mcg)}
            onChangeText={(v) => onChange({ dose_mcg: parseFloat(v) || 0 })}
          />
        </View>
        <View className="flex-1">
          <TextInput
            label="×/week"
            keyboardType="decimal-pad"
            value={String(item.doses_per_week)}
            onChangeText={(v) => onChange({ doses_per_week: parseFloat(v) || 0 })}
          />
        </View>
        <View className="flex-1">
          <TextInput
            label="Vial mg"
            keyboardType="decimal-pad"
            value={String(item.vial_size_mg)}
            onChangeText={(v) => onChange({ vial_size_mg: parseFloat(v) || 0 })}
          />
        </View>
        <View className="flex-1">
          <TextInput
            label="Target mL"
            keyboardType="decimal-pad"
            value={String(item.target_volume_ml)}
            onChangeText={(v) => onChange({ target_volume_ml: parseFloat(v) || 0.10 })}
          />
        </View>
      </View>

      {/* Recipe preview */}
      <View className="mt-3 pt-3 border-t border-surface-border">
        <Text className="text-slate-400 text-[10px] uppercase font-semibold mb-2">
          Reconstitution recipe
        </Text>
        <Text className="text-slate-300 text-xs leading-5">
          Add <Text className="text-primary-400 font-bold">{recipe.bacWaterMl.toFixed(2)} mL</Text> BAC water to a{' '}
          {item.vial_size_mg} mg vial →{' '}
          <Text className="text-white font-bold">{recipe.concentrationMcgPerMl.toFixed(0)} mcg/mL</Text>. Each injection:{' '}
          <Text className="text-white font-bold">
            {recipe.actualVolumeMl.toFixed(3)} mL ({recipe.actualUnits.toFixed(1)} IU)
          </Text>
          . {recipe.dosesPerVial} doses/vial.
        </Text>
        <View className="mt-2">
          <SyringeDiagram volumeMl={recipe.actualVolumeMl} capacityMl={1} />
        </View>
        {recipe.warnings.map((w, i) => (
          <Text key={i} className="text-amber-400 text-[10px] leading-4 mt-1">
            ⚠ {w}
          </Text>
        ))}
      </View>
    </View>
  );
}
