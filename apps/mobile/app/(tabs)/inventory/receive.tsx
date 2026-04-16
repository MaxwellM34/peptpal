import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { TextInput, Button, Card } from '@peptpal/ui';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import { createBatch } from '../../../src/db/batches';
import { createInventoryItem } from '../../../src/db/inventory';
import { nextLabelNumber } from '../../../src/db/batches';
import { pickFromLibrary, pickFromCamera, resolvePhotoUri } from '../../../src/lib/photos';

interface VialGroup {
  peptide_ref_id: number;
  peptide_name: string;
  peptide_slug: string;
  storage_temp: 'fridge' | 'freezer';
  vial_count: number;
  vial_size_mg: number;
}

type Step = 1 | 2 | 3 | 4;

export default function ReceiveShipment() {
  const router = useRouter();
  const { data: peptideList } = usePeptideList();
  const [step, setStep] = useState<Step>(1);

  const [vendor, setVendor] = useState('');
  const [receivedAt, setReceivedAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [groups, setGroups] = useState<VialGroup[]>([]);
  const [saving, setSaving] = useState(false);

  const peptides = peptideList?.items ?? [];

  async function handleAddPhoto(fromCamera: boolean) {
    const res = fromCamera ? await pickFromCamera() : await pickFromLibrary();
    if (!res) return;
    setPhotos((p) => [...p, res.filename]);
  }

  function removePhoto(filename: string) {
    setPhotos((p) => p.filter((f) => f !== filename));
  }

  function addGroup() {
    setGroups((g) => [
      ...g,
      {
        peptide_ref_id: 0,
        peptide_name: '',
        peptide_slug: '',
        storage_temp: 'fridge',
        vial_count: 1,
        vial_size_mg: 5,
      },
    ]);
  }

  function updateGroup(idx: number, updates: Partial<VialGroup>) {
    setGroups((g) => g.map((v, i) => (i === idx ? { ...v, ...updates } : v)));
  }

  function removeGroup(idx: number) {
    setGroups((g) => g.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (groups.length === 0) {
      Alert.alert('Add at least one peptide', '');
      return;
    }
    if (groups.some((g) => !g.peptide_ref_id || g.vial_count < 1 || g.vial_size_mg <= 0)) {
      Alert.alert('Fill in all vial details', '');
      return;
    }
    setSaving(true);
    try {
      const batchId = await createBatch({
        vendor: vendor.trim() || null,
        received_at: new Date(receivedAt).toISOString(),
        notes: notes.trim() || null,
        photo_paths: photos,
      });

      // For each group, create individual vial rows with sequential labels.
      for (const g of groups) {
        const firstLabel = await nextLabelNumber(g.peptide_ref_id);
        for (let i = 0; i < g.vial_count; i++) {
          await createInventoryItem({
            peptide_ref_id: g.peptide_ref_id,
            peptide_name: g.peptide_name,
            vial_count: 1,
            vial_size_mg: g.vial_size_mg,
            reconstituted: false,
            storage_location: g.storage_temp,
            batch_id: batchId,
            label_number: firstLabel + i,
            received_at: new Date(receivedAt).toISOString(),
            vendor: vendor.trim() || null,
          });
        }
      }

      setStep(4);
    } catch (e) {
      Alert.alert('Save failed', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Receive Shipment' }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <StepHeader step={step} />

            {step === 1 && (
              <Card className="gap-3">
                <Text className="text-white font-bold text-base">Where did it come from?</Text>
                <TextInput
                  label="Vendor (optional)"
                  placeholder="e.g. Janoshik-verified vendor"
                  value={vendor}
                  onChangeText={setVendor}
                />
                <TextInput
                  label="Date received"
                  placeholder="YYYY-MM-DD"
                  value={receivedAt}
                  onChangeText={setReceivedAt}
                />
                <TextInput
                  label="Notes (optional)"
                  multiline
                  numberOfLines={2}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Packaging condition, COA info, anything notable"
                />
                <View className="mt-2">
                  <Button onPress={() => setStep(2)}>Continue → Photos</Button>
                </View>
              </Card>
            )}

            {step === 2 && (
              <Card className="gap-3">
                <Text className="text-white font-bold text-base">Photos of the shipment</Text>
                <Text className="text-slate-400 text-xs">
                  Optional but recommended. Take shots of labels, COA, condition on arrival. Stored
                  on your device only.
                </Text>

                {photos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2 py-2">
                      {photos.map((filename) => (
                        <View key={filename} className="relative">
                          <Image
                            source={{ uri: resolvePhotoUri(filename) }}
                            style={{ width: 90, height: 90, borderRadius: 10 }}
                          />
                          <TouchableOpacity
                            onPress={() => removePhoto(filename)}
                            className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 items-center justify-center"
                          >
                            <Text className="text-white text-[10px] font-bold">×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button variant="secondary" onPress={() => handleAddPhoto(true)}>
                      📷 Camera
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button variant="secondary" onPress={() => handleAddPhoto(false)}>
                      🖼 Library
                    </Button>
                  </View>
                </View>

                <View className="mt-2">
                  <Button onPress={() => setStep(3)}>
                    {photos.length === 0 ? 'Skip photos →' : 'Continue → Vials'}
                  </Button>
                </View>
              </Card>
            )}

            {step === 3 && (
              <Card className="gap-3">
                <Text className="text-white font-bold text-base">Vials in this shipment</Text>
                <Text className="text-slate-400 text-xs">
                  Add one group per peptide type. Labels are auto-assigned (BPC-157 #3, #4…).
                </Text>

                {groups.map((g, idx) => (
                  <View key={idx} className="bg-surface-elevated rounded-xl p-3 gap-2 border border-surface-border">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-slate-300 text-xs">Group {idx + 1}</Text>
                      <TouchableOpacity onPress={() => removeGroup(idx)}>
                        <Text className="text-red-400 text-xs">Remove</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2">
                        {peptides.map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            className={`px-3 py-1.5 rounded-full border ${
                              g.peptide_ref_id === p.id
                                ? 'bg-primary-600 border-primary-500'
                                : 'bg-surface-card border-surface-border'
                            }`}
                            onPress={() =>
                              updateGroup(idx, {
                                peptide_ref_id: p.id,
                                peptide_name: p.name,
                                peptide_slug: p.slug,
                                storage_temp: p.storage_temp,
                              })
                            }
                          >
                            <Text
                              className={`text-xs font-medium ${
                                g.peptide_ref_id === p.id ? 'text-white' : 'text-slate-300'
                              }`}
                            >
                              {p.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <TextInput
                          label="# vials"
                          keyboardType="number-pad"
                          value={String(g.vial_count)}
                          onChangeText={(v) =>
                            updateGroup(idx, { vial_count: Math.max(1, parseInt(v, 10) || 1) })
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <TextInput
                          label="mg each"
                          keyboardType="decimal-pad"
                          value={String(g.vial_size_mg)}
                          onChangeText={(v) =>
                            updateGroup(idx, { vial_size_mg: parseFloat(v) || 0 })
                          }
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      {(['fridge', 'freezer'] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          className={`flex-1 py-2 rounded-lg border items-center ${
                            g.storage_temp === s
                              ? 'bg-primary-600 border-primary-500'
                              : 'bg-surface-card border-surface-border'
                          }`}
                          onPress={() => updateGroup(idx, { storage_temp: s })}
                        >
                          <Text
                            className={`text-xs ${g.storage_temp === s ? 'text-white' : 'text-slate-300'}`}
                          >
                            {s === 'fridge' ? '🧊 Fridge' : '❄ Freezer'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  className="py-3 rounded-xl border border-dashed border-primary-700 items-center"
                  onPress={addGroup}
                >
                  <Text className="text-primary-400 text-sm font-semibold">+ Add peptide</Text>
                </TouchableOpacity>

                <View className="mt-2">
                  <Button onPress={handleSave} loading={saving} disabled={groups.length === 0}>
                    Save Shipment
                  </Button>
                </View>
              </Card>
            )}

            {step === 4 && (
              <StorageGuidance
                groups={groups}
                onDone={() => router.replace('/(tabs)/inventory')}
              />
            )}

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function StepHeader({ step }: { step: Step }) {
  const labels = ['Vendor', 'Photos', 'Vials', 'Storage'];
  return (
    <View className="flex-row gap-1 mb-4">
      {labels.map((l, i) => {
        const done = i + 1 < step;
        const active = i + 1 === step;
        return (
          <View key={l} className="flex-1">
            <View
              className={`h-1 rounded-full ${
                done ? 'bg-emerald-500' : active ? 'bg-primary-500' : 'bg-surface-border'
              }`}
            />
            <Text
              className={`text-[10px] mt-1 text-center ${
                active ? 'text-white font-semibold' : 'text-slate-500'
              }`}
            >
              {l}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StorageGuidance({ groups, onDone }: { groups: VialGroup[]; onDone: () => void }) {
  const byStorage = {
    fridge: groups.filter((g) => g.storage_temp === 'fridge'),
    freezer: groups.filter((g) => g.storage_temp === 'freezer'),
  };

  return (
    <Card className="gap-3">
      <Text className="text-white font-bold text-base">✓ Shipment saved — store it now</Text>

      {byStorage.freezer.length > 0 && (
        <View className="bg-blue-900/20 border border-blue-800 rounded-xl p-3">
          <Text className="text-blue-300 font-bold text-sm mb-2">❄ Into the freezer</Text>
          {byStorage.freezer.map((g, i) => (
            <Text key={i} className="text-blue-200/90 text-xs leading-5">
              • {g.vial_count}× {g.peptide_name} ({g.vial_size_mg} mg vial)
            </Text>
          ))}
          <Text className="text-slate-400 text-xs leading-5 mt-2">
            Lyophilized peptides in the freezer stay viable for months to years. Keep them
            sealed and away from frost buildup. Thaw at room temp before reconstituting.
          </Text>
        </View>
      )}

      {byStorage.fridge.length > 0 && (
        <View className="bg-cyan-900/20 border border-cyan-800 rounded-xl p-3">
          <Text className="text-cyan-300 font-bold text-sm mb-2">🧊 Into the fridge</Text>
          {byStorage.fridge.map((g, i) => (
            <Text key={i} className="text-cyan-200/90 text-xs leading-5">
              • {g.vial_count}× {g.peptide_name} ({g.vial_size_mg} mg vial)
            </Text>
          ))}
          <Text className="text-slate-400 text-xs leading-5 mt-2">
            Lyophilized peptides in the fridge are stable for many months if kept dry and
            sealed. Protect from light. Reconstitute one at a time and keep the rest sealed.
          </Text>
        </View>
      )}

      <View className="bg-slate-800/40 border border-surface-border rounded-xl p-3">
        <Text className="text-slate-300 text-xs leading-5">
          💡 Labels have been auto-assigned in the app (e.g. "BPC-157 #1"). When you
          reconstitute a vial, PeptPal will tell you which number to use first (oldest
          first). You can write the label number on the vial with a marker — makes it
          obvious in the fridge.
        </Text>
      </View>

      <Button onPress={onDone}>Done</Button>
    </Card>
  );
}
