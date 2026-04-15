import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Card, DisclaimerBanner, SyringeDiagram } from '@peptpal/ui';
import { reconstitutionCalc, reconstitutionCalcByDose } from '@peptpal/core';

type Mode = 'by_concentration' | 'by_dose';

export default function ReconstitutionCalcModal() {
  const [mode, setMode] = useState<Mode>('by_concentration');
  const [vialSizeMg, setVialSizeMg] = useState('');
  const [concentration, setConcentration] = useState('');
  const [desiredDose, setDesiredDose] = useState('');
  const [desiredVolume, setDesiredVolume] = useState('');
  const [result, setResult] = useState<{
    bacWaterMl: number;
    totalMcg: number;
    dosesPerVial: number;
    mlPerDose: number;
    concentrationMcgPerMl?: number;
    lowVolumeWarning: boolean;
  } | null>(null);
  const [error, setError] = useState('');

  function calculate() {
    setError('');
    setResult(null);
    try {
      const vial = parseFloat(vialSizeMg);
      if (isNaN(vial) || vial <= 0) throw new Error('Enter a valid vial size');

      if (mode === 'by_concentration') {
        const conc = parseFloat(concentration);
        if (isNaN(conc) || conc <= 0) throw new Error('Enter a valid concentration');
        setResult(reconstitutionCalc({ vialSizeMg: vial, desiredConcentrationMcgPerMl: conc }));
      } else {
        const dose = parseFloat(desiredDose);
        const vol = parseFloat(desiredVolume);
        if (isNaN(dose) || dose <= 0) throw new Error('Enter a valid dose');
        if (isNaN(vol) || vol <= 0) throw new Error('Enter a valid volume');
        setResult(reconstitutionCalcByDose({ vialSizeMg: vial, desiredDoseMcg: dose, desiredVolumeMl: vol }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation error');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
          <DisclaimerBanner />

          {/* Mode toggle */}
          <View className="flex-row gap-2 mb-4">
            {(['by_concentration', 'by_dose'] as Mode[]).map((m) => (
              <Button
                key={m}
                variant={mode === m ? 'primary' : 'secondary'}
                size="sm"
                className="flex-1"
                onPress={() => { setMode(m); setResult(null); setError(''); }}
              >
                {m === 'by_concentration' ? 'By Concentration' : 'By Dose & Volume'}
              </Button>
            ))}
          </View>

          <View className="gap-4">
            <TextInput
              label="Vial Size (mg)"
              placeholder="e.g. 5"
              keyboardType="decimal-pad"
              value={vialSizeMg}
              onChangeText={setVialSizeMg}
            />

            {mode === 'by_concentration' ? (
              <TextInput
                label="Desired Concentration (mcg/mL)"
                placeholder="e.g. 500"
                keyboardType="decimal-pad"
                value={concentration}
                onChangeText={setConcentration}
              />
            ) : (
              <>
                <TextInput
                  label="Desired Dose per Injection (mcg)"
                  placeholder="e.g. 250"
                  keyboardType="decimal-pad"
                  value={desiredDose}
                  onChangeText={setDesiredDose}
                />
                <TextInput
                  label="Desired Volume per Injection (mL)"
                  placeholder="e.g. 0.5"
                  keyboardType="decimal-pad"
                  value={desiredVolume}
                  onChangeText={setDesiredVolume}
                />
              </>
            )}

            {error ? <Text className="text-danger-400 text-sm">{error}</Text> : null}

            <Button onPress={calculate}>Calculate</Button>

            {result && (
              <Card className="gap-3">
                <Text className="text-white font-bold text-base mb-1">Results</Text>
                <ResultRow label="BAC Water to Add" value={`${result.bacWaterMl} mL`} highlight />
                <ResultRow label="Total Peptide" value={`${result.totalMcg.toLocaleString()} mcg`} />
                {result.concentrationMcgPerMl != null && (
                  <ResultRow label="Resulting Concentration" value={`${result.concentrationMcgPerMl} mcg/mL`} />
                )}
                <ResultRow label="Volume per Dose" value={`${result.mlPerDose} mL`} />
                <ResultRow label="Doses per Vial" value={`${result.dosesPerVial}`} />

                <View className="border-t border-surface-border pt-3 mt-1">
                  <Text className="text-slate-400 text-xs mb-2 font-semibold">U-100 Insulin Syringe</Text>
                  <SyringeDiagram volumeMl={result.mlPerDose} capacityMl={result.mlPerDose > 1 ? 3 : 1} />
                </View>

                {result.lowVolumeWarning && (
                  <View className="bg-warning-900/30 border border-warning-700/50 rounded-xl p-3 mt-1">
                    <Text className="text-warning-400 text-xs leading-relaxed">
                      ⚠️ Volume per dose is very small (&lt;0.05 mL). Consider a lower concentration for accurate dosing.
                    </Text>
                  </View>
                )}
              </Card>
            )}
          </View>
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className={`font-bold text-sm ${highlight ? 'text-primary-400 text-base' : 'text-white'}`}>
        {value}
      </Text>
    </View>
  );
}
