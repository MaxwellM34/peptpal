import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { TextInput, Button, Card, DegradationChart } from '@peptpal/ui';
import {
  reconstitutionCalc,
  suggestExpiryDate,
  remainingPotency,
  storageStateFromVial,
  buildDegradationCurve,
} from '@peptpal/core';
import {
  getInventoryItemById,
  updateInventoryItem,
  softDeleteInventoryItem,
  createInventoryItem,
} from '../../../src/db/inventory';
import { getInjectionLogs } from '../../../src/db/injectionLog';
import { resolvePhotoUri } from '../../../src/lib/photos';
import { PhotoViewerModal } from '../../../src/components/PhotoViewerModal';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import type { InventoryItem, InjectionLog } from '@peptpal/core';

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const { data: peptideList } = usePeptideList();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [vialLogs, setVialLogs] = useState<InjectionLog[]>([]);

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
      getInventoryItemById(parseInt(id)).then(async (data) => {
        if (!data) return;
        setItem(data);
        // Load injections drawn from this vial.
        const allLogs = await getInjectionLogs({ limit: 500 });
        setVialLogs(allLogs.filter((l) => (l as InjectionLog & { inventory_id?: number | null }).inventory_id === data.id));
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

            {/* Detail panel — only when viewing an existing vial */}
            {!isNew && item && <VialDetailPanel item={item} vialLogs={vialLogs} />}

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

function BatchLink({ batchId }: { batchId: number }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      className="mt-2 py-1.5 px-3 border border-primary-800 rounded-lg self-start bg-primary-900/20"
      onPress={() => router.push(`/(tabs)/inventory/batch/${batchId}`)}
    >
      <Text className="text-primary-300 text-xs">View batch #{batchId} →</Text>
    </TouchableOpacity>
  );
}

function slugifyPeptideName(name: string): string {
  return name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-z0-9]+/g, '-');
}

function VialDetailPanel({ item, vialLogs }: { item: InventoryItem; vialLogs: InjectionLog[] }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const photos = (() => {
    const raw = (item as InventoryItem & { photos_json?: string | null }).photos_json;
    if (!raw) return [] as string[];
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? (v as string[]) : [];
    } catch {
      return [];
    }
  })();

  const label = (item as InventoryItem & { label_number?: number | null }).label_number;
  const slug = slugifyPeptideName(item.peptide_name);

  const daysRecon =
    item.reconstituted && item.opened_at
      ? (Date.now() - new Date(item.opened_at).getTime()) / 86_400_000
      : null;
  const state = storageStateFromVial(item);
  const potency = daysRecon != null ? remainingPotency(slug, state, daysRecon) : 1;

  return (
    <Card className="mb-4">
      <Text className="text-white font-bold text-base mb-1">
        {item.peptide_name}{label ? ` #${label}` : ''}
      </Text>
      <Text className="text-slate-400 text-xs mb-3">
        {item.vial_size_mg} mg · {item.storage_location}
        {item.reconstituted ? ` · reconstituted ${daysRecon != null ? `${Math.floor(daysRecon)}d ago` : ''}` : ' · sealed'}
      </Text>

      {/* Photos */}
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {photos.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => setViewerIndex(i)}>
                <Image
                  source={{ uri: resolvePhotoUri(p) }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      <PhotoViewerModal
        visible={viewerIndex != null}
        photos={photos}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />

      {/* Degradation chart */}
      {item.reconstituted && daysRecon != null && (
        <View className="mt-2">
          <DegradationChart
            points={buildDegradationCurve(slug, state, Date.now() - daysRecon * 86_400_000, 60, 60)}
            currentPotency={potency}
            daysInState={daysRecon}
            totalDays={60}
            width={300}
            height={150}
          />
        </View>
      )}

      {/* Injection history */}
      {vialLogs.length > 0 && (
        <View className="mt-3 pt-3 border-t border-surface-border">
          <Text className="text-slate-400 text-[10px] uppercase font-semibold mb-2">
            Injections from this vial ({vialLogs.length})
          </Text>
          {vialLogs.slice(0, 5).map((log) => (
            <View key={log.id} className="flex-row justify-between py-1">
              <Text className="text-slate-300 text-xs">
                {format(new Date(log.injected_at), 'MMM d, h:mm a')}
              </Text>
              <Text className="text-slate-400 text-xs">{log.dose_mcg} mcg</Text>
            </View>
          ))}
          {vialLogs.length > 5 && (
            <Text className="text-slate-500 text-[10px] mt-1">+ {vialLogs.length - 5} more</Text>
          )}
        </View>
      )}

      {/* Batch / vendor */}
      {((item as InventoryItem & { vendor?: string | null }).vendor ||
        (item as InventoryItem & { batch_number?: string | null }).batch_number ||
        (item as InventoryItem & { batch_id?: number | null }).batch_id) && (
        <View className="mt-3 pt-3 border-t border-surface-border">
          <Text className="text-slate-400 text-[10px] uppercase font-semibold mb-1">Source</Text>
          {(item as InventoryItem & { vendor?: string | null }).vendor && (
            <Text className="text-slate-300 text-xs">
              Vendor: {(item as InventoryItem & { vendor?: string | null }).vendor}
            </Text>
          )}
          {(item as InventoryItem & { batch_number?: string | null }).batch_number && (
            <Text className="text-slate-300 text-xs">
              Batch: {(item as InventoryItem & { batch_number?: string | null }).batch_number}
            </Text>
          )}
          {(item as InventoryItem & { coa_purity_percent?: number | null }).coa_purity_percent != null && (
            <Text className="text-slate-300 text-xs">
              COA purity: {(item as InventoryItem & { coa_purity_percent?: number | null }).coa_purity_percent}%
            </Text>
          )}
          {(item as InventoryItem & { batch_id?: number | null }).batch_id != null && (
            <BatchLink batchId={(item as InventoryItem & { batch_id?: number | null }).batch_id!} />
          )}
        </View>
      )}
    </Card>
  );
}
