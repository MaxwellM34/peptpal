import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { Badge } from '@peptpal/ui';
import { estimateRemainingDoses } from '@peptpal/core';
import { getInventoryItems, softDeleteInventoryItem } from '../../../src/db/inventory';
import type { InventoryItem } from '@peptpal/core';

type InventoryStatus = 'Sealed' | 'Fresh' | 'Stable' | 'Aging' | 'Low' | 'Degraded' | 'Expired';

/** Reconstituted peptide stability in fridge (days). Community consensus: 28 days. */
const RECON_STABILITY_DAYS = 28;

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

function getStatus(item: InventoryItem): { status: InventoryStatus; daysRecon: number | null } {
  const daysRecon = daysSince(item.opened_at);
  if (item.expiry_at && new Date(item.expiry_at) < new Date()) {
    return { status: 'Expired', daysRecon };
  }
  if (!item.reconstituted) return { status: 'Sealed', daysRecon };

  if (daysRecon != null) {
    if (daysRecon >= RECON_STABILITY_DAYS) return { status: 'Degraded', daysRecon };
    if (daysRecon >= RECON_STABILITY_DAYS * 0.75) return { status: 'Aging', daysRecon };
  }

  if (item.concentration_mcg_per_ml && item.vial_count > 0) {
    const remaining = estimateRemainingDoses(item.concentration_mcg_per_ml, 2 * item.vial_count, 250);
    if (remaining < 3) return { status: 'Low', daysRecon };
  }

  if (daysRecon != null && daysRecon < 7) return { status: 'Fresh', daysRecon };
  return { status: 'Stable', daysRecon };
}

const statusBadgeVariant: Record<InventoryStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  Sealed: 'info',
  Fresh: 'success',
  Stable: 'success',
  Aging: 'warning',
  Low: 'warning',
  Degraded: 'danger',
  Expired: 'danger',
};

export default function InventoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);

  const load = useCallback(async () => {
    const data = await getInventoryItems();
    setItems(data);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              className="flex-1 bg-primary-600 rounded-xl py-3 items-center active:bg-primary-700"
              onPress={() => router.push('/(tabs)/inventory/receive' as never)}
            >
              <Text className="text-white font-bold">📦 Receive Shipment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface-card border border-surface-border rounded-xl py-3 px-3 items-center active:bg-surface-elevated"
              onPress={() => router.push('/(tabs)/inventory/new' as never)}
            >
              <Text className="text-slate-200 font-semibold">+ Single Vial</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const { status, daysRecon } = getStatus(item);
          const daysLeft = daysRecon != null ? Math.max(0, Math.ceil(RECON_STABILITY_DAYS - daysRecon)) : null;
          return (
            <TouchableOpacity
              className="bg-surface-card rounded-2xl mb-3 p-4 active:bg-surface-elevated"
              onPress={() => router.push(`/(tabs)/inventory/${item.id}`)}
              activeOpacity={0.85}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    {item.peptide_name}
                    {(item as InventoryItem & { label_number?: number | null }).label_number
                      ? ` #${(item as InventoryItem & { label_number?: number | null }).label_number}`
                      : ''}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    {item.vial_count} × {item.vial_size_mg}mg vial{item.vial_count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Badge variant={statusBadgeVariant[status]}>{status}</Badge>
              </View>

              {item.reconstituted && daysLeft != null && status !== 'Expired' && (
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-slate-500 text-[10px] uppercase font-semibold">
                      Reconstituted Stability
                    </Text>
                    <Text className={`text-[10px] font-bold ${
                      status === 'Degraded' ? 'text-red-400' :
                      status === 'Aging' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {status === 'Degraded' ? 'Past stability' : `${daysLeft}d left`}
                    </Text>
                  </View>
                  <View className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                    <View
                      className={`h-1 rounded-full ${
                        status === 'Degraded' ? 'bg-red-500' :
                        status === 'Aging' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, ((daysRecon ?? 0) / RECON_STABILITY_DAYS) * 100)}%`,
                      }}
                    />
                  </View>
                </View>
              )}

              <View className="mt-3 flex-row flex-wrap gap-3">
                {item.concentration_mcg_per_ml != null && (
                  <InfoChip label="Conc." value={`${item.concentration_mcg_per_ml} mcg/mL`} />
                )}
                <InfoChip label="Storage" value={item.storage_location === 'freezer' ? '❄ Freezer' : '🧊 Fridge'} />
                {item.expiry_at && (
                  <InfoChip
                    label="Expires"
                    value={format(new Date(item.expiry_at), 'MMM d, yyyy')}
                    alert={new Date(item.expiry_at) < new Date()}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-slate-500 text-base">No inventory yet</Text>
            <Text className="text-slate-600 text-sm mt-1">Add a vial to get started</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function InfoChip({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View>
      <Text className="text-slate-500 text-xs">{label}</Text>
      <Text className={`text-xs font-medium ${alert ? 'text-danger-400' : 'text-slate-300'}`}>{value}</Text>
    </View>
  );
}
