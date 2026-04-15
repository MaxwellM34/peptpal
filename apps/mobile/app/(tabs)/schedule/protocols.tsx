import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';
import {
  listProtocols,
  getProtocolItems,
  setProtocolActive,
  softDeleteProtocol,
  type ProtocolRow,
  type ProtocolItemRow,
} from '../../../src/db/protocols';

export default function ProtocolsScreen() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<
    Array<ProtocolRow & { items: ProtocolItemRow[] }>
  >([]);

  const load = useCallback(async () => {
    const list = await listProtocols(false);
    const withItems = await Promise.all(
      list.map(async (p) => ({ ...p, items: await getProtocolItems(p.id) })),
    );
    setProtocols(withItems);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function handleToggle(id: number, next: boolean) {
    await setProtocolActive(id, next);
    await load();
  }

  async function handleDelete(id: number) {
    Alert.alert('Delete protocol?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await softDeleteProtocol(id);
          await load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-slate-200 text-base font-bold mb-1">Personal Protocols</Text>
        <Text className="text-slate-500 text-xs mb-4">
          Multi-peptide stacks with auto-computed reconstitution. Multiple protocols can be active; PeptPal will flag conflicts.
        </Text>

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-3 items-center mb-4 active:bg-primary-700"
          onPress={() => router.push('/(tabs)/schedule/protocol-new')}
        >
          <Text className="text-white font-bold">+ New Protocol</Text>
        </TouchableOpacity>

        {protocols.length === 0 && (
          <View className="bg-surface-card rounded-2xl p-6 items-center border border-surface-border">
            <Text className="text-slate-400 text-sm">No protocols yet.</Text>
            <Text className="text-slate-500 text-xs mt-1 text-center">
              Build one to get auto-computed reconstitution instructions
              and dose suggestions in the log flow.
            </Text>
          </View>
        )}

        {protocols.map((p) => (
          <View
            key={p.id}
            className={`rounded-2xl p-4 mb-3 border ${
              p.active
                ? 'bg-primary-900/15 border-primary-800'
                : 'bg-surface-card border-surface-border'
            }`}
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{p.name}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  {p.goal ? `Goal: ${p.goal.replace(/_/g, ' ')} · ` : ''}
                  Created {format(new Date(p.created_at), 'MMM d')}
                </Text>
              </View>
              <Switch
                value={p.active}
                onValueChange={(v) => handleToggle(p.id, v)}
                trackColor={{ false: '#334155', true: '#1d4ed8' }}
                thumbColor={p.active ? '#3b82f6' : '#64748b'}
              />
            </View>

            <View className="gap-1 mt-2">
              {p.items.map((i) => (
                <View key={i.id} className="flex-row justify-between">
                  <Text className="text-slate-300 text-xs">• {i.peptide_name}</Text>
                  <Text className="text-slate-400 text-xs">
                    {i.dose_mcg} mcg × {i.doses_per_week}/wk
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row gap-2 mt-3 pt-3 border-t border-surface-border">
              <TouchableOpacity
                className="py-1.5 px-3 border border-danger-800 rounded-lg"
                onPress={() => handleDelete(p.id)}
              >
                <Text className="text-danger-400 text-xs">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
