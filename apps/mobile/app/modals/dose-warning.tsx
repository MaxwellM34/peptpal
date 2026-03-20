import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@peptpal/ui';

export default function DoseWarningModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    peptide_name: string;
    dose_mcg: string;
    max_dose_mcg: string;
    percent_of_max: string;
  }>();

  const [checked, setChecked] = useState(false);

  const peptideName = params.peptide_name ?? 'Unknown';
  const doseMcg = parseFloat(params.dose_mcg ?? '0');
  const maxDoseMcg = parseFloat(params.max_dose_mcg ?? '0');
  const percentOfMax = parseFloat(params.percent_of_max ?? '0');

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ gap: 16 }}>
        <View className="bg-danger-900/40 border border-danger-700 rounded-xl p-4">
          <Text className="text-danger-400 font-bold text-base mb-1">
            Dose exceeds reference maximum
          </Text>
          <Text className="text-slate-300 text-sm leading-relaxed">
            The entered dose of{' '}
            <Text className="text-white font-bold">{doseMcg} mcg</Text> for{' '}
            <Text className="text-white font-bold">{peptideName}</Text> is{' '}
            <Text className="text-danger-400 font-bold">{percentOfMax.toFixed(0)}%</Text> of the
            documented maximum ({maxDoseMcg} mcg).
          </Text>
        </View>

        <Text className="text-slate-400 text-sm leading-relaxed">
          This information is for harm reduction purposes only. Reference maximums are
          community-sourced and not medical guidance. Exceeding them may carry unknown risks.
        </Text>

        <TouchableOpacity
          className="flex-row items-start gap-3 p-3 bg-surface-elevated rounded-xl"
          onPress={() => setChecked(!checked)}
          activeOpacity={0.8}
        >
          <View
            className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center flex-shrink-0 ${
              checked ? 'bg-danger-600 border-danger-600' : 'border-surface-border'
            }`}
          >
            {checked && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-slate-300 text-sm flex-1 leading-relaxed">
            I understand this dose exceeds the documented maximum. I take full responsibility for
            this decision.
          </Text>
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={() => router.back()}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={!checked}
            onPress={() => router.back()}
          >
            Acknowledge
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
