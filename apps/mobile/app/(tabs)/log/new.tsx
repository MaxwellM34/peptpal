import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { TextInput, Button, InjectionSiteSelector, DoseWarningModal } from '@peptpal/ui';
import {
  checkDoseSafety,
  calcDrawVolume,
  remainingPotency,
  storageStateFromVial,
  doseCompensationMultiplier,
  PROTOCOL_SEEDS,
  scaleDose,
} from '@peptpal/core';
import { getUserProfile } from '../../../src/db/profile';
import { getActiveProtocolItems, type ProtocolItemRow } from '../../../src/db/protocols';
import { getSiteRotationStatus, type SiteLastUsed } from '../../../src/db/injectionLog';
import { hapticSuccess, hapticTap } from '../../../src/lib/haptics';
import type { InjectionSite } from '@peptpal/core';
import { usePeptideList } from '../../../src/hooks/usePeptides';
import { createInjectionLog } from '../../../src/db/injectionLog';
import {
  getInventoryItems,
  decrementVialCount,
  getOldestReconstitutedVial,
  getSealedVials,
} from '../../../src/db/inventory';
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
  const [suggestedVial, setSuggestedVial] = useState<InventoryItem | null>(null);
  const [sealedVials, setSealedVials] = useState<InventoryItem[]>([]);
  const [stabilityOverride, setStabilityOverride] = useState(false);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [activeProtocolItem, setActiveProtocolItem] = useState<ProtocolItemRow | null>(null);
  const [siteStatuses, setSiteStatuses] = useState<SiteLastUsed[]>([]);
  const [aeNausea, setAeNausea] = useState(0);
  const [aeFatigue, setAeFatigue] = useState(0);
  const [aeSite, setAeSite] = useState(0);
  const [aeOther, setAeOther] = useState('');
  const [showDoseWarning, setShowDoseWarning] = useState(false);
  const [safetyResult, setSafetyResult] = useState<ReturnType<typeof checkDoseSafety> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getInventoryItems().then((items) => {
      setInventoryItems(items.filter((i) => i.reconstituted));
    });
    getUserProfile().then((p) => setWeightKg(p?.weight_kg ?? null));
    getSiteRotationStatus().then(setSiteStatuses);
  }, []);

  // When peptide changes, look up active protocol item for this peptide.
  useEffect(() => {
    if (!peptideRefId) {
      setActiveProtocolItem(null);
      return;
    }
    void (async () => {
      const items = await getActiveProtocolItems();
      const match = items.find((i) => i.peptide_ref_id === peptideRefId);
      setActiveProtocolItem(match ?? null);
      // Pre-fill dose from protocol if user hasn't typed yet.
      if (match && !doseMcg) setDoseMcg(String(match.dose_mcg));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peptideRefId]);

  // When peptide is selected, find oldest reconstituted vial (FIFO) and sealed vials.
  useEffect(() => {
    if (!peptideRefId) {
      setSuggestedVial(null);
      setSealedVials([]);
      return;
    }
    void (async () => {
      const [oldest, sealed] = await Promise.all([
        getOldestReconstitutedVial(peptideRefId),
        getSealedVials(peptideRefId),
      ]);
      setSuggestedVial(oldest);
      setSealedVials(sealed);
      if (oldest && inventoryId == null) setInventoryId(oldest.id);
    })();
  }, [peptideRefId, inventoryId]);

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
        ae_nausea: aeNausea > 0 ? aeNausea : null,
        ae_fatigue: aeFatigue > 0 ? aeFatigue : null,
        ae_injection_site: aeSite > 0 ? aeSite : null,
        ae_other: aeOther.trim() || null,
      });
      if (inventoryId) {
        await decrementVialCount(inventoryId);
      }
      void hapticSuccess();
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

            {/* Vial suggestion */}
            {peptideRefId != null && (
              <VialSuggestion
                suggested={suggestedVial}
                sealedCount={sealedVials.length}
                peptideName={peptideName}
                stabilityOverride={stabilityOverride}
                onOverride={() => setStabilityOverride(true)}
              />
            )}

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

              <DoseFeedback
                doseMcg={parseFloat(doseMcg)}
                peptideName={peptideName}
                weightKg={weightKg}
                protocolDoseMcg={activeProtocolItem?.dose_mcg ?? null}
              />
            </View>

            {/* Site rotation suggestion */}
            {peptideRefId != null && siteStatuses.length > 0 && !site && (
              <SiteSuggestion
                sites={siteStatuses}
                onPick={(s) => setSite(s as InjectionSite)}
              />
            )}

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

            {/* Adverse Events */}
            <View className="mb-4">
              <Text className="text-slate-300 text-sm font-medium mb-2">Side Effects (optional)</Text>
              <Text className="text-slate-500 text-xs mb-3">
                Severity 0–10. Aggregated (anonymously) with community data to surface dose-specific patterns.
              </Text>
              <SeverityRow label="Nausea" value={aeNausea} onChange={setAeNausea} />
              <SeverityRow label="Fatigue" value={aeFatigue} onChange={setAeFatigue} />
              <SeverityRow label="Injection site" value={aeSite} onChange={setAeSite} />
              <TextInput
                label="Other"
                placeholder="e.g. headache, mood change"
                value={aeOther}
                onChangeText={setAeOther}
                className="mt-2"
              />
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

function DoseFeedback({
  doseMcg,
  peptideName,
  weightKg,
  protocolDoseMcg,
}: {
  doseMcg: number;
  peptideName: string;
  weightKg: number | null;
  protocolDoseMcg: number | null;
}) {
  if (!doseMcg || !isFinite(doseMcg) || doseMcg <= 0) return null;

  const slug = peptideName
    ? peptideName.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-z0-9]+/g, '-')
    : '';
  const seed = slug ? PROTOCOL_SEEDS[slug] : undefined;

  let lines: Array<{ text: string; tone: 'muted' | 'amber' | 'red' | 'emerald' | 'primary' }> = [];

  if (protocolDoseMcg) {
    const ratio = doseMcg / protocolDoseMcg;
    if (Math.abs(ratio - 1) < 0.05) {
      lines.push({ text: `At your active protocol's target dose (${protocolDoseMcg} mcg).`, tone: 'emerald' });
    } else {
      lines.push({
        text: `${ratio.toFixed(2)}× your active protocol dose (${protocolDoseMcg} mcg).`,
        tone: ratio > 1.25 || ratio < 0.75 ? 'amber' : 'muted',
      });
    }
  }

  if (seed && weightKg != null) {
    const scaled = scaleDose(seed.startingDose, { weightKg });
    const ratioToScaled = doseMcg / scaled.scaledDoseMcg;
    if (ratioToScaled > 1.4) {
      lines.push({
        text: `⛔ ${ratioToScaled.toFixed(2)}× your weight-scaled starting dose — in the trial AE signal zone.`,
        tone: 'red',
      });
    } else if (ratioToScaled > 1.2) {
      lines.push({
        text: `⚠ ${ratioToScaled.toFixed(2)}× your weight-scaled starting dose.`,
        tone: 'amber',
      });
    } else if (ratioToScaled < 0.5) {
      lines.push({
        text: `ℹ Subtherapeutic (${ratioToScaled.toFixed(2)}× scaled starting dose).`,
        tone: 'primary',
      });
    }
  }

  if (seed && doseMcg > seed.hardCeilingMcg) {
    lines.push({
      text: `⛔ Above the ${seed.hardCeilingMcg} mcg hard ceiling for ${peptideName}.`,
      tone: 'red',
    });
  }

  if (lines.length === 0) return null;

  const toneColors = {
    muted: '#94a3b8',
    amber: '#fbbf24',
    red: '#f87171',
    emerald: '#34d399',
    primary: '#60a5fa',
  } as const;

  return (
    <View className="mt-2 gap-1">
      {lines.map((l, i) => (
        <Text key={i} style={{ fontSize: 11, lineHeight: 16, color: toneColors[l.tone] }}>
          {l.text}
        </Text>
      ))}
    </View>
  );
}

const SITE_LABELS: Record<string, string> = {
  abdomen_left: 'Abdomen L',
  abdomen_right: 'Abdomen R',
  thigh_left: 'Thigh L',
  thigh_right: 'Thigh R',
  deltoid_left: 'Deltoid L',
  deltoid_right: 'Deltoid R',
  glute_left: 'Glute L',
  glute_right: 'Glute R',
};

function SiteSuggestion({
  sites,
  onPick,
}: {
  sites: SiteLastUsed[];
  onPick: (site: string) => void;
}) {
  // Sort by most-rested (highest daysSince).
  const sorted = [...sites].sort((a, b) => b.daysSince - a.daysSince);
  const best = sorted[0];
  if (!best) return null;
  return (
    <View className="bg-emerald-900/15 border border-emerald-800 rounded-xl p-3 mb-4">
      <Text className="text-emerald-300 text-xs font-semibold mb-1">
        Suggested site: {SITE_LABELS[best.site] ?? best.site}
      </Text>
      <Text className="text-slate-300 text-xs leading-5 mb-2">
        Rested longest ({Math.floor(best.daysSince)} days). Rotate to avoid lipohypertrophy.
      </Text>
      <TouchableOpacity
        className="py-2 rounded-lg bg-emerald-700/40 items-center"
        onPress={() => onPick(best.site)}
      >
        <Text className="text-emerald-200 text-xs font-semibold">
          Use {SITE_LABELS[best.site] ?? best.site}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function VialSuggestion({
  suggested,
  sealedCount,
  peptideName,
  stabilityOverride,
  onOverride,
}: {
  suggested: InventoryItem | null;
  sealedCount: number;
  peptideName: string;
  stabilityOverride: boolean;
  onOverride: () => void;
}) {
  if (!suggested) {
    return (
      <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-4">
        <Text className="text-amber-300 font-semibold text-sm mb-1">
          No reconstituted {peptideName} available
        </Text>
        <Text className="text-amber-200/80 text-xs leading-5">
          {sealedCount > 0
            ? `You have ${sealedCount} sealed vial${sealedCount === 1 ? '' : 's'} in inventory. Reconstitute one before logging.`
            : 'You have no vials of this peptide. Add one via Inventory → Receive Shipment.'}
        </Text>
      </View>
    );
  }

  const labelNum = (suggested as InventoryItem & { label_number?: number | null }).label_number;
  const daysSinceOpen = suggested.opened_at
    ? (Date.now() - new Date(suggested.opened_at).getTime()) / 86_400_000
    : 0;
  const slug = slugifyPeptide(suggested.peptide_name);
  const state = storageStateFromVial({
    reconstituted: suggested.reconstituted,
    storage_location: suggested.storage_location,
  });
  const potency = remainingPotency(slug, state, daysSinceOpen);
  const pct = Math.round(potency * 100);

  const warn = potency < 0.6;

  if (warn && !stabilityOverride) {
    return (
      <View className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-4">
        <Text className="text-red-300 font-bold text-sm mb-1">
          ⚠ Oldest vial is estimated at {pct}% potency
        </Text>
        <Text className="text-red-200/80 text-xs leading-5 mb-2">
          Use <Text className="font-bold">{peptideName} #{labelNum ?? '?'}</Text>, opened{' '}
          {Math.floor(daysSinceOpen)} days ago.
        </Text>
        <Text className="text-slate-400 text-xs leading-5 mb-2">
          You could: reconstitute a fresher vial, compensate dose by{' '}
          {doseCompensationMultiplier(potency).toFixed(2)}×, or proceed anyway. Peptide
          degradation estimates are uncertain — ±30%+ is typical.
        </Text>
        <TouchableOpacity
          className="py-2 rounded-lg bg-red-900/50 border border-red-700 items-center"
          onPress={onOverride}
        >
          <Text className="text-red-200 text-xs font-semibold">I understand, proceed</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-3 mb-4">
      <Text className="text-emerald-300 font-semibold text-sm mb-1">
        Use {peptideName} #{labelNum ?? '?'} (oldest first)
      </Text>
      <Text className="text-slate-300 text-xs leading-5">
        Opened {Math.floor(daysSinceOpen)} days ago · est. {pct}% potency ·{' '}
        {suggested.concentration_mcg_per_ml ?? '?'} mcg/mL
      </Text>
    </View>
  );
}

function slugifyPeptide(name: string): string {
  return name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-z0-9]+/g, '-');
}

function SeverityRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-slate-400 text-xs">{label}</Text>
        <Text className="text-slate-300 text-xs font-semibold">
          {value === 0 ? 'None' : `${value}/10`}
        </Text>
      </View>
      <View className="flex-row gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const active = n <= value;
          const color =
            n === 0 ? 'bg-surface-elevated' :
            n <= 3 ? (active ? 'bg-emerald-600' : 'bg-surface-elevated') :
            n <= 6 ? (active ? 'bg-amber-600' : 'bg-surface-elevated') :
            (active ? 'bg-red-600' : 'bg-surface-elevated');
          return (
            <TouchableOpacity
              key={n}
              className={`flex-1 h-6 rounded ${color}`}
              onPress={() => onChange(n)}
            />
          );
        })}
      </View>
    </View>
  );
}
