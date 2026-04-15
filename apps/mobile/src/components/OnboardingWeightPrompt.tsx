/**
 * First-run weight prompt. Shown before the tutorial launches if no weight
 * has been saved. Setting weight is effectively gating dose scaling, so
 * we ask for it up front rather than letting users wander into Settings.
 */
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput as RNTextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { lbsToKg } from '@peptpal/core';
import { upsertUserProfile } from '../db/profile';
import { PeptPalMascot } from './PeptPalMascot';

export function OnboardingWeightPrompt({
  visible,
  onDone,
  onSkip,
}: {
  visible: boolean;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [lbs, setLbs] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const n = parseFloat(lbs);
    if (!n || n < 60 || n > 500) {
      setLbs('');
      return;
    }
    setSaving(true);
    try {
      await upsertUserProfile({ weight_kg: lbsToKg(n) });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.8)', justifyContent: 'center', padding: 24 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ backgroundColor: '#0f172a', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#1e293b' }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <PeptPalMascot size={100} />
          </View>
          <Text style={{ color: '#f1f5f9', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
            Before we start…
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
            Drop your weight and I'll scale every dose in the app to you. Most clinical trials ran on ~250 lb cohorts — copying their flat doses as a leaner user can overshoot hard.
          </Text>
          <RNTextInput
            style={{
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#334155',
              borderRadius: 12,
              padding: 14,
              fontSize: 18,
              color: 'white',
              textAlign: 'center',
              marginBottom: 4,
            }}
            placeholder="170 (lb)"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
            value={lbs}
            onChangeText={setLbs}
          />
          <Text style={{ color: '#64748b', fontSize: 10, textAlign: 'center', marginBottom: 16 }}>
            Never leaves your device.
          </Text>

          <TouchableOpacity
            disabled={saving}
            onPress={handleSave}
            style={{ backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {saving ? 'Saving…' : 'Save + continue'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip} style={{ paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
