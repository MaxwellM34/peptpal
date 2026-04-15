import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listProtocolSeeds } from '@peptpal/core';

export default function CommunityIndex() {
  const router = useRouter();
  const seeds = listProtocolSeeds();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-slate-200 text-base font-bold mb-1">Community</Text>
        <Text className="text-slate-500 text-xs mb-4">
          Pseudonymous dose logs with weighted consensus. Bloodwork-attached posts count 5× more than anonymous text.
        </Text>

        <View className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-4">
          <Text className="text-amber-300 text-xs font-bold mb-1">Harm-reduction only</Text>
          <Text className="text-amber-200/80 text-xs leading-5">
            PeptPal aggregates what users report. We don't recommend doses, endorse protocols, or provide medical advice.
            Posts are moderated for vendor shilling; dangerous doses are flagged.
          </Text>
        </View>

        {seeds.map((s) => (
          <TouchableOpacity
            key={s.slug}
            className="bg-surface-card rounded-2xl p-4 mb-2 border border-surface-border active:bg-surface-elevated"
            onPress={() => router.push(`/(tabs)/community/${s.slug}`)}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white font-bold">{s.name}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  Trial cohort: {s.startingDose.cohort.meanWeightKg.toFixed(0)} kg avg
                  {s.startingDose.cohort.n ? ` · n=${s.startingDose.cohort.n}` : ''}
                </Text>
              </View>
              <Text className="text-slate-500 text-xl">›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
