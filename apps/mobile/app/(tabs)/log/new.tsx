import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { TextInput, Button, InjectionSiteSelector, DoseWarningModal } from '@peptpal/ui';
import { checkDoseSafety, calcDrawVolume } from '@peptpal/core';
import type { InjectionSite } from '@peptpal/core';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import { createInjectionLog } from '../../../src/db/injectionLog';
import { getInventoryItems, decrementVialCount } from '../../../src/db/inventory';
import type { InventoryItem } from '@peptpal/core';

export default function NewInjectionScreen() {
  const router = useRouter();
  const { data: peptideList } = usePeptideList();

  const [peptideRefId, setPeptideRefId] = useState<number | null>(null);
  const [peptideName, setPeptideName] = useState('');
  const [peptideMaxDose, setPeptideMaxDose] = useState<number | null>(null);
  const [doseMcg, setDoseMcg] = useState('');
  const [injectedAt, setInjectedAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [site, setSite] = useState<InjectionSite | null>(null);
  const [notes, setNotes] = useState('');
  const [inventoryId, setInventoryId] = useState<number | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showDoseWarning, setShowDoseWarning] = useState(false);
  const [safetyResult, setSafetyResult] = useState<ReturnType<typeof checkDoseSafety> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getInventoryItems().then((items) => {
      setInventoryItems(items.filter((i) => i.reconstituted));
    });
  }, []);

  // Auto-calculate draw volume
  const selectedInventory = inventoryItems.find((i) => i.id === inventoryId);
  const doseMl =
    selectedInventory?.concentration_mcg_per_ml && parseFloat(doseMcg) > 0
      ? calcDrawVolume(parseFloat(doseMcg), selectedInventory.concentration_mcg_per_ml)
      : null;

  function validate() {
    const errs: Record<string, string> = {};
    if (!peptideRefId) errs['peptide'] = 'Select a peptide';
    const d = parseFloat(doseMcg);
    if (isNaN(d) || d <= 0) errs['dose'] = 'Enter a valid dose';
    if (!injectedAt) errs['time'] = 'Enter a time';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const dose = parseFloat(doseMcg);
    if (peptideMaxDose != null) {
      const safety = checkDoseSafety(dose, peptideMaxDose);
      if (!safety.safe) {
        setSafetyResult(safety);
        setShowDoseWarning(true);
        return;
      }
    }
    void doSave();
  }

  async function doSave() {
    setSaving(true);
    try {
      const dose = parseFloat(doseMcg);
      await createInjectionLog({
        peptide_ref_id: peptideRefId!,
        peptide_name: peptideName,
        injected_at: new Date(injectedAt).toISOString(),
        dose_mcg: dose,
        dose_ml: doseMl,
        injection_site: site,
        notes: notes.trim() || null,
        inventory_id: inventoryId,
      });
      if (inventoryId) {
        await decrementVialCount(inventoryId);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const peptides = peptideList?.items ?? [];

  return (
    <>
      <Stack.Screen options={{ title: 'Log Injection' }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">

            {/* Peptide Picker */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Peptide *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                <View className="flex-row gap-2 pb-1">
                  {peptides.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      className={`px-4 py-2 rounded-xl border ${
                        peptideRefId === p.id
                          ? 'bg-primary-600 border-primary-500'
                          : 'bg-surface-elevated border-surface-border'
                      }`}
                      onPress={() => {
                        setPeptideRefId(p.id);
                        setPeptideName(p.name);
                      }}
                    >
                      <Text className={`text-sm font-medium ${peptideRefId === p.id ? 'text-white' : 'text-slate-300'}`}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors['peptide'] && <Text className="text-danger-400 text-xs mt-1">{errors['peptide']}</Text>}
            </View>

            {/* Dose */}
            <View className="mb-4">
              <TextInput
                label="Dose (mcg) *"
                placeholder="e.g. 250"
                keyboardType="decimal-pad"
                value={doseMcg}
                onChangeText={setDoseMcg}
                error={errors['dose']}
              />
              {doseMl != null && (
                <Text className="text-primary-400 text-xs mt-1">
                  = {doseMl} mL at {selectedInventory?.concentration_mcg_per_ml} mcg/mL
                </Text>
              )}
            </View>

            {/* Inventory picker */}
            {inventoryItems.length > 0 && (
              <View className="mb-4">
                <Text className="text-slate-300 text-sm font-medium mb-1.5">Use from Inventory (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className={`px-3 py-2 rounded-xl border ${!inventoryId ? 'bg-surface-elevated border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                      onPress={() => setInventoryId(null)}
                    >
                      <Text className="text-slate-300 text-xs">None</Text>
                    </TouchableOpacity>
                    {inventoryItems.map((i) => (
                      <TouchableOpacity
                        key={i.id}
                        className={`px-3 py-2 rounded-xl border ${inventoryId === i.id ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'}`}
                        onPress={() => setInventoryId(i.id)}
                      >
                        <Text className={`text-xs font-medium ${inventoryId === i.id ? 'text-white' : 'text-slate-300'}`}>
                          {i.peptide_name} {i.concentration_mcg_per_ml}mcg/mL
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Timestamp */}
            <View className="mb-4">
              <TextInput
                label="Timestamp *"
                value={injectedAt}
                onChangeText={setInjectedAt}
                error={errors['time']}
                hint="Format: YYYY-MM-DDTHH:mm"
              />
            </View>

            {/* Injection site */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-2">Injection Site</Text>
              <InjectionSiteSelector value={site} onChange={setSite} />
            </View>

            {/* Notes */}
            <View className="mb-6">
              <TextInput
                label="Notes (optional)"
                placeholder="Any observations..."
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                className="min-h-20"
              />
            </View>

            <Button onPress={handleSubmit} loading={saving} size="lg" className="mb-8">
              Save Injection
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {safetyResult && (
        <DoseWarningModal
          visible={showDoseWarning}
          peptideName={peptideName}
          doseMcg={parseFloat(doseMcg)}
          maxDoseMcg={peptideMaxDose!}
          percentOfMax={safetyResult.percentOfMax}
          onAcknowledge={() => { setShowDoseWarning(false); void doSave(); }}
          onCancel={() => setShowDoseWarning(false)}
        />
      )}
    </>
  );
}
