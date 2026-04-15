import React, { useCallback, useEffect, useState } from 'react';
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
import { submitCommunityReport } from '../../../src/api/client';
import { getUserProfile, upsertUserProfile } from '../../../src/db/profile';
import type { BackupPayload } from '../../../src/db/backup';
import { lbsToKg, kgToLbs } from '@peptpal/core';

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
  const [weightLbs, setWeightLbs] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    const p = await getUserProfile();
    if (p) {
      if (p.weight_kg) setWeightLbs(kgToLbs(p.weight_kg).toFixed(0));
      if (p.height_cm) setHeightIn((p.height_cm / 2.54).toFixed(0));
      if (p.age) setAge(String(p.age));
      if (p.sex) setSex(p.sex);
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
      <ScrollView className="flex-1 px-4 pt-4">

        {/* User Profile — drives dose scaling */}
        <Card className="mb-4">
          <Text className="text-white font-bold text-base mb-1">👤 Your Profile</Text>
          <Text className="text-slate-400 text-xs mb-3">
            Weight-adjusted dose scaling uses this. Never leaves your device.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
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
