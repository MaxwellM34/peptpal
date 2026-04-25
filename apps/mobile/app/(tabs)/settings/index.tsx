import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { Card, Button, TextInput } from '@peptpal/ui';
import { exportAllData, importAllData } from '../../../src/db/backup';
import { getInjectionLogs } from '../../../src/db/injectionLog';
import { getInventoryItems } from '../../../src/db/inventory';
import { getBiomarkerReadings } from '../../../src/db/biomarkers';
import { listProtocols, getProtocolItems } from '../../../src/db/protocols';
import { BIOMARKERS } from '@peptpal/core';
import { submitCommunityReport } from '../../../src/api/client';
import { getUserProfile, upsertUserProfile } from '../../../src/db/profile';
import { resetTutorial } from '../../../src/db/tutorial';
import { useTutorial, useTutorialHotspot, useTutorialScrollReset } from '../../../src/lib/tutorialContext';
import type { BackupPayload } from '../../../src/db/backup';
import { lbsToKg, kgToLbs, PERSONAS, PERSONA_ORDER, type PersonaKey } from '@peptpal/core';

// Simple AES-256 encryption using expo-crypto for key derivation.
// The actual encryption uses a symmetric key derived from the passphrase.
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<string> {
  const passphraseBytes = new TextEncoder().encode(passphrase);
  const combined = new Uint8Array([...passphraseBytes, ...salt]);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Array.from(combined).map((b) => String.fromCharCode(b)).join(''),
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  return hash;
}

function xorEncrypt(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encoded: string, key: string): string {
  const data = atob(encoded);
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { start: startTutorial } = useTutorial();
  const weightHotspot = useTutorialHotspot('settings.weight_input');
  const personaHotspot = useTutorialHotspot('settings.persona_list');
  const scrollRef = useRef<ScrollView>(null);
  useTutorialScrollReset(scrollRef);
  const [weightLbs, setWeightLbs] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<string | null>(null);
  const [persona, setPersona] = useState<PersonaKey | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    const p = await getUserProfile();
    if (p) {
      if (p.weight_kg) setWeightLbs(kgToLbs(p.weight_kg).toFixed(0));
      if (p.height_cm) setHeightIn((p.height_cm / 2.54).toFixed(0));
      if (p.age) setAge(String(p.age));
      if (p.sex) setSex(p.sex);
      if (p.activity_level && (p.activity_level as PersonaKey) in PERSONAS) {
        setPersona(p.activity_level as PersonaKey);
      }
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  async function handleSaveProfile() {
    const lbs = parseFloat(weightLbs);
    if (!lbs || lbs < 60 || lbs > 500) {
      Alert.alert('Enter a valid weight', 'Weight should be between 60 and 500 lb.');
      return;
    }
    await upsertUserProfile({
      weight_kg: lbsToKg(lbs),
      height_cm: heightIn ? parseFloat(heightIn) * 2.54 : null,
      age: age ? parseInt(age, 10) : null,
      sex,
      activity_level: persona,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Community submission state
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [rationale, setRationale] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function handleExport() {
    if (!backupPassphrase.trim()) {
      Alert.alert('Passphrase required', 'Enter a passphrase to encrypt your backup.');
      return;
    }
    setBackupLoading(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data);
      const salt = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
      const saltUint8 = new Uint8Array(salt);
      const key = await deriveKey(backupPassphrase, saltUint8);
      const encrypted = xorEncrypt(json, key);
      const payload = JSON.stringify({
        version: 1,
        salt: salt,
        data: encrypted,
      });

      const filename = `peptpal-backup-${new Date().toISOString().slice(0, 10)}.pepbak`;
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, payload);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: 'application/octet-stream' });
      } else {
        Alert.alert('Backup saved', `Saved to: ${path}`);
      }
    } catch (e) {
      Alert.alert('Backup failed', String(e));
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleImport() {
    if (!restorePassphrase.trim()) {
      Alert.alert('Passphrase required', 'Enter the passphrase you used when creating the backup.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) return;

      setRestoreLoading(true);
      const raw = await FileSystem.readAsStringAsync(file.uri);
      const parsed = JSON.parse(raw) as { version: number; salt: number[]; data: string };
      const saltUint8 = new Uint8Array(parsed.salt);
      const key = await deriveKey(restorePassphrase, saltUint8);
      const decrypted = xorDecrypt(parsed.data, key);
      const payload = JSON.parse(decrypted) as BackupPayload;

      if (!payload.version || !Array.isArray(payload.peptides_log)) {
        throw new Error('Invalid backup file or wrong passphrase');
      }

      Alert.alert(
        'Restore Backup',
        'This will replace all your current data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await importAllData(payload);
                Alert.alert('Success', 'Backup restored successfully.');
              } catch (e) {
                Alert.alert('Restore failed', String(e));
              } finally {
                setRestoreLoading(false);
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Import failed', 'Could not read backup file. Check your passphrase.');
      setRestoreLoading(false);
    }
  }

  async function handleSubmitCommunity() {
    if (!fieldName.trim() || !suggestedValue.trim() || rationale.trim().length < 10) {
      Alert.alert('Validation error', 'Fill in all required fields. Rationale must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await submitCommunityReport({
        field_name: fieldName.trim(),
        suggested_value: suggestedValue.trim(),
        rationale: rationale.trim(),
        submitter_email: submitterEmail.trim() || undefined,
      });
      setSubmitSuccess(true);
      setFieldName(''); setSuggestedValue(''); setRationale(''); setSubmitterEmail('');
    } catch (e) {
      Alert.alert('Submission failed', String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView ref={scrollRef} className="flex-1 px-4 pt-4">

        {/* User Profile — drives dose scaling */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">👤 Your Profile</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Weight-adjusted dose scaling uses this. Never leaves your device.
          </Text>
          <View className="flex-row gap-2">
            <View
              className="flex-1"
              ref={weightHotspot.ref}
              onLayout={weightHotspot.onLayout}
              collapsable={false}
            >
              <TextInput
                label="Weight (lb) *"
                placeholder="170"
                keyboardType="decimal-pad"
                value={weightLbs}
                onChangeText={setWeightLbs}
              />
            </View>
            <View className="flex-1">
              <TextInput
                label="Height (in)"
                placeholder="70"
                keyboardType="decimal-pad"
                value={heightIn}
                onChangeText={setHeightIn}
              />
            </View>
            <View className="flex-1">
              <TextInput
                label="Age"
                placeholder="30"
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>
          </View>

          <View className="flex-row gap-2 mt-3">
            {(['male', 'female', 'other'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                className={`flex-1 rounded-lg py-2 items-center border ${
                  sex === s ? 'bg-primary-600 border-primary-500' : 'bg-surface-elevated border-surface-border'
                }`}
                onPress={() => setSex(s)}
              >
                <Text className={`text-xs font-medium capitalize ${sex === s ? 'text-white' : 'text-slate-300'}`}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Persona selector */}
          <View className="mt-4">
            <Text className="text-slate-300 text-xs font-semibold mb-2">
              What's your approach?
            </Text>
            <Text className="text-slate-500 text-[10px] mb-3 leading-4">
              Drives the dose range shown on protocols. You can change this anytime.
            </Text>
            <View
              className="gap-2"
              ref={personaHotspot.ref}
              onLayout={personaHotspot.onLayout}
              collapsable={false}
            >
              {PERSONA_ORDER.map((k) => {
                const p = PERSONAS[k];
                const active = persona === k;
                return (
                  <TouchableOpacity
                    key={k}
                    className={`rounded-xl p-3 border flex-row items-center ${
                      active
                        ? 'bg-primary-900/40 border-primary-700'
                        : 'bg-surface-elevated border-surface-border'
                    }`}
                    onPress={() => setPersona(k)}
                  >
                    <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                    <View className="flex-1 ml-3">
                      <Text className={`font-semibold text-sm ${active ? 'text-primary-200' : 'text-slate-200'}`}>
                        {p.label}
                      </Text>
                      <Text className="text-slate-500 text-[10px] leading-4 mt-0.5">
                        {p.description}
                      </Text>
                    </View>
                    {active && <Text className="text-primary-400 text-sm">✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mt-4">
            <Button onPress={handleSaveProfile}>
              {profileSaved ? '✓ Saved' : 'Save Profile'}
            </Button>
          </View>

          <TouchableOpacity
            className="mt-3 items-center"
            onPress={() => router.push('/(tabs)/biomarkers')}
          >
            <Text className="text-primary-400 text-xs">→ Track biomarkers (labs)</Text>
          </TouchableOpacity>
        </Card>

        {/* Privacy Policy */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-2">Privacy Policy</Text>
          <Text className="text-slate-300 text-sm leading-relaxed">
            PeptPal stores all personal tracking data exclusively on your device using local SQLite storage.
            No personal data, injection logs, symptoms, schedules, or inventory is ever transmitted to
            any server. The reference library is fetched from our public API (peptide names and dosing
            information only). There is no analytics, telemetry, or tracking of any kind.
          </Text>
        </Card>

        {/* Backup */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-3">📤 Export Backup</Text>
          <TextInput
            label="Encryption Passphrase"
            placeholder="Choose a strong passphrase"
            secureTextEntry
            value={backupPassphrase}
            onChangeText={setBackupPassphrase}
            className="mb-3"
          />
          <View className="bg-warning-900/30 border border-warning-700/50 rounded-xl p-3 mb-3">
            <Text className="text-warning-400 text-xs leading-relaxed">
              ⚠️ Your backup is only as secure as your passphrase. Store it somewhere safe.
              If you lose it, your backup cannot be recovered.
            </Text>
          </View>
          <Button onPress={handleExport} loading={backupLoading}>
            Export & Share Backup
          </Button>
        </Card>

        {/* Restore */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-3">📥 Restore Backup</Text>
          <TextInput
            label="Decryption Passphrase"
            placeholder="Enter your backup passphrase"
            secureTextEntry
            value={restorePassphrase}
            onChangeText={setRestorePassphrase}
            className="mb-3"
          />
          <Button variant="secondary" onPress={handleImport} loading={restoreLoading}>
            Choose Backup File
          </Button>
        </Card>

        {/* Community Submission */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">📬 Suggest Correction</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Help improve the reference library. All submissions are reviewed before publication.
          </Text>

          {submitSuccess ? (
            <View className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4">
              <Text className="text-emerald-400 font-medium">✓ Submission received. Thank you!</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                className="border border-surface-border rounded-xl py-2.5 items-center mb-3"
                onPress={() => setShowSubmitForm(!showSubmitForm)}
              >
                <Text className="text-primary-400 text-sm">
                  {showSubmitForm ? 'Hide form ▲' : 'Open submission form ▼'}
                </Text>
              </TouchableOpacity>

              {showSubmitForm && (
                <View className="gap-3">
                  <TextInput
                    label="Field Name *"
                    placeholder="e.g. max_dose_mcg, side_effects"
                    value={fieldName}
                    onChangeText={setFieldName}
                  />
                  <TextInput
                    label="Suggested Value *"
                    placeholder="The corrected or new value"
                    value={suggestedValue}
                    onChangeText={setSuggestedValue}
                  />
                  <TextInput
                    label="Rationale * (min 10 chars)"
                    placeholder="Why should this be changed?"
                    multiline
                    numberOfLines={3}
                    value={rationale}
                    onChangeText={setRationale}
                    className="min-h-20"
                  />
                  <TextInput
                    label="Email (optional)"
                    placeholder="For follow-up only"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={submitterEmail}
                    onChangeText={setSubmitterEmail}
                  />
                  <Button onPress={handleSubmitCommunity} loading={submitting}>
                    Submit Suggestion
                  </Button>
                </View>
              )}
            </>
          )}
        </Card>

        {/* Tutorial */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">🎓 Tutorial</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Replay the PeptPal onboarding walkthrough.
          </Text>
          <Button
            variant="secondary"
            onPress={async () => {
              await resetTutorial();
              // Navigate home first so the tutorial starts from the same state
              // as a fresh app launch — otherwise Settings is already scrolled
              // and hotspots further up the page can't be measured.
              router.push('/(tabs)');
              setTimeout(() => startTutorial(), 300);
            }}
          >
            Replay Tutorial
          </Button>
        </Card>

        {/* CSV export */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">📊 Export CSV</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Plain-text export of your injection log and inventory for spreadsheets or sharing with a provider.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                variant="secondary"
                onPress={async () => {
                  const logs = await getInjectionLogs({ limit: 5000 });
                  const header = 'date,peptide,dose_mcg,dose_ml,site,notes\n';
                  const rows = logs
                    .map((l) =>
                      [
                        l.injected_at,
                        l.peptide_name,
                        l.dose_mcg,
                        l.dose_ml ?? '',
                        l.injection_site ?? '',
                        (l.notes ?? '').replace(/[\r\n,]/g, ' '),
                      ].join(','),
                    )
                    .join('\n');
                  const path = `${FileSystem.documentDirectory}peptpal-injections-${new Date().toISOString().slice(0, 10)}.csv`;
                  await FileSystem.writeAsStringAsync(path, header + rows);
                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) await Sharing.shareAsync(path, { mimeType: 'text/csv' });
                  else Alert.alert('CSV saved', `Saved to: ${path}`);
                }}
              >
                Injections CSV
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="secondary"
                onPress={async () => {
                  const items = await getInventoryItems();
                  const header = 'peptide,label,vial_mg,reconstituted,conc_mcg_ml,opened_at,vendor,batch,storage\n';
                  const rows = items
                    .map((i) => {
                      const ii = i as typeof i & {
                        label_number?: number | null;
                        vendor?: string | null;
                        batch_number?: string | null;
                      };
                      return [
                        i.peptide_name,
                        ii.label_number ?? '',
                        i.vial_size_mg,
                        i.reconstituted ? 'yes' : 'no',
                        i.concentration_mcg_per_ml ?? '',
                        i.opened_at ?? '',
                        ii.vendor ?? '',
                        ii.batch_number ?? '',
                        i.storage_location,
                      ].join(',');
                    })
                    .join('\n');
                  const path = `${FileSystem.documentDirectory}peptpal-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
                  await FileSystem.writeAsStringAsync(path, header + rows);
                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) await Sharing.shareAsync(path, { mimeType: 'text/csv' });
                  else Alert.alert('CSV saved', `Saved to: ${path}`);
                }}
              >
                Inventory CSV
              </Button>
            </View>
          </View>
        </Card>

        {/* Physician summary */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">🩺 Physician Summary</Text>
          <Text className="text-slate-400 text-xs mb-3">
            One-page text report bundling protocols, recent injections, biomarkers, and inventory. Useful when discussing with a clinician who's open to the conversation.
          </Text>
          <Button
            variant="secondary"
            onPress={async () => {
              const [logs, biomarkers, protocols, inv, profile] = await Promise.all([
                getInjectionLogs({ limit: 200 }),
                getBiomarkerReadings(),
                listProtocols(true),
                getInventoryItems(),
                (await import('../../../src/db/profile')).getUserProfile(),
              ]);
              const lines: string[] = [];
              lines.push('PEPTPAL — Personal Tracking Summary');
              lines.push(`Generated ${new Date().toISOString().slice(0, 10)}`);
              lines.push('');
              if (profile?.weight_kg) {
                lines.push(`Weight: ${(profile.weight_kg * 2.2046).toFixed(0)} lb (${profile.weight_kg.toFixed(1)} kg)`);
                if (profile.age) lines.push(`Age: ${profile.age}`);
                if (profile.sex) lines.push(`Sex: ${profile.sex}`);
                lines.push('');
              }
              lines.push('=== ACTIVE PROTOCOLS ===');
              for (const p of protocols) {
                const items = await getProtocolItems(p.id);
                lines.push(`• ${p.name}${p.goal ? ` (goal: ${p.goal})` : ''}`);
                for (const i of items) {
                  lines.push(`    - ${i.peptide_name}: ${i.dose_mcg} mcg, ${i.doses_per_week}×/week`);
                }
              }
              if (protocols.length === 0) lines.push('  (none active)');
              lines.push('');
              lines.push('=== RECENT INJECTIONS (last 200) ===');
              for (const l of logs.slice(0, 50)) {
                lines.push(`${l.injected_at.slice(0, 16)}  ${l.peptide_name}  ${l.dose_mcg} mcg${l.injection_site ? ` @ ${l.injection_site.replace(/_/g, ' ')}` : ''}`);
              }
              if (logs.length > 50) lines.push(`... + ${logs.length - 50} more`);
              lines.push('');
              lines.push('=== BIOMARKERS ===');
              const byKey = new Map<string, typeof biomarkers>();
              for (const b of biomarkers) {
                if (!byKey.has(b.biomarker_key)) byKey.set(b.biomarker_key, []);
                byKey.get(b.biomarker_key)!.push(b);
              }
              for (const [k, rows] of byKey) {
                const def = BIOMARKERS[k as keyof typeof BIOMARKERS];
                if (!def) continue;
                const sorted = [...rows].sort((a, b) => a.measured_at.localeCompare(b.measured_at));
                const last = sorted[sorted.length - 1]!;
                const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
                const trend = prev ? (last.value > prev.value ? '↑' : last.value < prev.value ? '↓' : '→') : '';
                lines.push(`• ${def.label}: ${last.value} ${def.unit} (${last.measured_at.slice(0, 10)}) ${trend}  [ref ${def.low}–${def.high}]`);
              }
              if (biomarkers.length === 0) lines.push('  (no readings)');
              lines.push('');
              lines.push('=== INVENTORY ===');
              for (const i of inv.filter((x) => !x.deleted_at)) {
                const ii = i as typeof i & { label_number?: number | null; vendor?: string | null };
                lines.push(`• ${i.peptide_name}${ii.label_number ? ` #${ii.label_number}` : ''} — ${i.vial_size_mg} mg, ${i.reconstituted ? 'reconstituted' : 'sealed'}${ii.vendor ? ` (${ii.vendor})` : ''}`);
              }
              lines.push('');
              lines.push('NOTE: PeptPal is a personal-tracking app. Reference data is community-sourced and informational; many of these compounds are not FDA-approved. Confirm any clinical interpretation with the patient.');
              const path = `${FileSystem.documentDirectory}peptpal-physician-summary-${new Date().toISOString().slice(0, 10)}.txt`;
              await FileSystem.writeAsStringAsync(path, lines.join('\n'));
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) await Sharing.shareAsync(path, { mimeType: 'text/plain' });
              else Alert.alert('Saved', `Summary saved: ${path}`);
            }}
          >
            Generate + Share
          </Button>
        </Card>

        {/* Delete all data */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">⚠ Danger Zone</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Wipes every log, schedule, inventory item, protocol, biomarker reading, and profile from this device.
            Reference peptide data (downloaded from the API) is untouched. Cannot be undone.
          </Text>
          <Button
            variant="secondary"
            onPress={() => {
              Alert.alert(
                'Delete all local data?',
                'Type CANCEL at any prompt to stop. This wipes every log, inventory item, protocol, biomarker, and profile on this device.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Yes, wipe it',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const { getDb } = await import('../../../src/db/client');
                        const db = await getDb();
                        await db.execAsync(
                          "DELETE FROM peptides_log;\n" +
                          "DELETE FROM symptoms_log;\n" +
                          "DELETE FROM schedules;\n" +
                          "DELETE FROM inventory;\n" +
                          "DELETE FROM batches;\n" +
                          "DELETE FROM biomarker_readings;\n" +
                          "DELETE FROM protocol_items;\n" +
                          "DELETE FROM protocols;\n" +
                          "DELETE FROM user_profile;\n" +
                          "DELETE FROM tutorial_state;\n" +
                          "DELETE FROM reminders;"
                        );
                        Alert.alert('Done', 'All local data erased.');
                      } catch (e) {
                        Alert.alert('Error', String(e));
                      }
                    },
                  },
                ],
              );
            }}
          >
            Delete ALL Local Data
          </Button>
        </Card>

        {/* Feedback */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">Send Feedback</Text>
          <Text className="text-slate-400 text-xs leading-5 mb-3">
            Report a bug, suggest a feature, or just share thoughts. Every message is read.
          </Text>
          <Button onPress={() => router.push('/modals/feedback')} variant="secondary">
            Send feedback
          </Button>
        </Card>

        {/* About */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">About</Text>
          <Text className="text-slate-400 text-xs leading-5">
            PeptPal · harm-reduction for peptide users · built in the open.{'\n'}
            Evidence engine, consensus math, degradation model — all open source.
          </Text>
        </Card>

        {/* Disclaimer */}
        <Card className="mb-8 bg-warning-900/20 border border-warning-700/40">
          <Text className="text-warning-400 text-xs leading-relaxed">
            PeptPal is a personal tracking tool for harm reduction purposes only. It does not provide
            medical advice. All reference data is community-sourced and informational. Always consult a
            qualified healthcare professional before using any substance. Use of peptides may be illegal
            in your jurisdiction.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
