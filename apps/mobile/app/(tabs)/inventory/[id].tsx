import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { TextInput, Button, Card } from '@peptpal/ui';
import { reconstitutionCalc, suggestExpiryDate } from '@peptpal/core';
import {
  getInventoryItemById,
  updateInventoryItem,
  softDeleteInventoryItem,
  createInventoryItem,
} from '../../../src/db/inventory';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import type { InventoryItem } from '@peptpal/core';

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const { data: peptideList } = usePeptideList();
  const [item, setItem] = useState<InventoryItem | null>(null);

  // Form state
  const [peptideRefId, setPeptideRefId] = useState<number | null>(null);
  const [peptideName, setPeptideName] = useState('');
  const [peptideSlug, setPeptideSlug] = useState('');
  const [vialCount, setVialCount] = useState('1');
  const [vialSizeMg, setVialSizeMg] = useState('');
  const [reconstituted, setReconstituted] = useState(false);
  const [bacWaterMl, setBacWaterMl] = useState('');
  const [concentrationMcgPerMl, setConcentrationMcgPerMl] = useState('');
  const [expiryAt, setExpiryAt] = useState('');
  const [storageLocation, setStorageLocation] = useState<'fridge' | 'freezer'>('fridge');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Reconstitution calc result
  const [calcResult, setCalcResult] = useState<ReturnType<typeof reconstitutionCalc> | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      getInventoryItemById(parseInt(id)).then((data) => {
        if (!data) return;
        setItem(data);
        setPeptideRefId(data.peptide_ref_id);
        setPeptideName(data.peptide_name);
        setVialCount(String(data.vial_count));
        setVialSizeMg(String(data.vial_size_mg));
        setReconstituted(data.reconstituted);
        setBacWaterMl(data.bac_water_added_ml != null ? String(data.bac_water_added_ml) : '');
        setConcentrationMcgPerMl(data.concentration_mcg_per_ml != null ? String(data.concentration_mcg_per_ml) : '');
        setExpiryAt(data.expiry_at ?? '');
        setStorageLocation(data.storage_location);
        setNotes(data.notes ?? '');
      });
    }
  }, [id, isNew]);

  // Auto-calc when reconstitution inputs change
  useEffect(() => {
    const vial = parseFloat(vialSizeMg);
    const conc = parseFloat(concentrationMcgPerMl);
    if (vial > 0 && conc > 0) {
      try {
        const result = reconstitutionCalc({ vialSizeMg: vial, desiredConcentrationMcgPerMl: conc });
        setCalcResult(result);
        setBacWaterMl(String(result.bacWaterMl));
      } catch (_) {
        setCalcResult(null);
      }
    }
  }, [vialSizeMg, concentrationMcgPerMl]);

  // Auto-suggest expiry when reconstituted + peptide known
  useEffect(() => {
    if (reconstituted && peptideSlug) {
      const suggested = suggestExpiryDate(peptideSlug, new Date(), storageLocation);
      setExpiryAt(format(suggested, 'yyyy-MM-dd'));
    }
  }, [reconstituted, peptideSlug, storageLocation]);

  async function handleSave() {
    if (!peptideRefId) return;
    setSaving(true);
    try {
      const payload = {
        peptide_ref_id: peptideRefId,
        peptide_name: peptideName,
        vial_count: parseInt(vialCount),
        vial_size_mg: parseFloat(vialSizeMg),
        reconstituted,
        bac_water_added_ml: bacWaterMl ? parseFloat(bacWaterMl) : null,
        concentration_mcg_per_ml: concentrationMcgPerMl ? parseFloat(concentrationMcgPerMl) : null,
        opened_at: reconstituted ? new Date().toISOString() : null,
        expiry_at: expiryAt || null,
        storage_location: storageLocation,
        notes: notes.trim() || null,
      };
      if (isNew) {
        await createInventoryItem(payload);
      } else {
        await updateInventoryItem(parseInt(id!), payload);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    await softDeleteInventoryItem(parseInt(id));
    router.back();
  }

  const peptides = peptideList?.items ?? [];

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Add Vial' : 'Edit Vial' }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">

            {/* Peptide picker */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Peptide *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {peptides.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      className={`px-4 py-2 rounded-xl border ${peptideRefId === p.id ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                      onPress={() => { setPeptideRefId(p.id); setPeptideName(p.name); setPeptideSlug(p.slug); }}
                    >
                      <Text className={`text-sm font-medium ${peptideRefId === p.id ? 'text-white' : 'text-slate-300'}`}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <TextInput label="Vial Size (mg)" placeholder="e.g. 5" keyboardType="decimal-pad" value={vialSizeMg} onChangeText={setVialSizeMg} />
              </View>
              <View className="flex-1">
                <TextInput label="Quantity" placeholder="1" keyboardType="number-pad" value={vialCount} onChangeText={setVialCount} />
              </View>
            </View>

            {/* Storage */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Storage</Text>
              <View className="flex-row gap-2">
                {(['fridge', 'freezer'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    className={`flex-1 py-2.5 rounded-xl border items-center ${storageLocation === s ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                    onPress={() => setStorageLocation(s)}
                  >
                    <Text className={`text-sm font-medium ${storageLocation === s ? 'text-white' : 'text-slate-300'}`}>
                      {s === 'fridge' ? '🧊 Fridge' : '❄ Freezer'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reconstituted toggle */}
            <TouchableOpacity
              className={`mb-4 flex-row items-center gap-3 p-4 rounded-xl border ${reconstituted ? 'bg-primary-900/30 border-primary-700' : 'bg-surface-elevated border-surface-border'}`}
              onPress={() => setReconstituted(!reconstituted)}
            >
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${reconstituted ? 'bg-primary-600 border-primary-600' : 'border-surface-border'}`}>
                {reconstituted && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-white font-medium">Reconstituted</Text>
            </TouchableOpacity>

            {reconstituted && (
              <Card className="mb-4 gap-4">
                <Text className="text-white font-bold">Reconstitution Details</Text>
                <TextInput
                  label="Desired Concentration (mcg/mL)"
                  placeholder="e.g. 500"
                  keyboardType="decimal-pad"
                  value={concentrationMcgPerMl}
                  onChangeText={setConcentrationMcgPerMl}
                />
                <TextInput
                  label="BAC Water Added (mL)"
                  placeholder="Auto-calculated"
                  keyboardType="decimal-pad"
                  value={bacWaterMl}
                  onChangeText={setBacWaterMl}
                  hint={calcResult ? `Auto-calculated: ${calcResult.bacWaterMl} mL → ${calcResult.dosesPerVial} doses` : undefined}
                />
                <TextInput
                  label="Expiry Date"
                  placeholder="YYYY-MM-DD"
                  value={expiryAt}
                  onChangeText={setExpiryAt}
                  hint={peptideSlug ? 'Auto-suggested based on peptide' : undefined}
                />
              </Card>
            )}

            <TextInput
              label="Notes (optional)"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              className="min-h-20 mb-6"
            />

            <Button onPress={handleSave} loading={saving} size="lg" className="mb-3">
              {isNew ? 'Add to Inventory' : 'Save Changes'}
            </Button>

            {!isNew && (
              <Button variant="danger" onPress={handleDelete} className="mb-8">
                Delete Vial
              </Button>
            )}
            <View className="h-4" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
