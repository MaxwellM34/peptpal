import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { Badge, DegradationChart } from '@peptpal/ui';
import { useTutorialHotspot, useTutorialScrollReset } from '../../../src/lib/tutorialContext';
import {
  estimateRemainingDoses,
  remainingPotency,
  storageStateFromVial,
  buildDegradationCurve,
  doseCompensationMultiplier,
} from '@peptpal/core';
import { getInventoryItems } from '../../../src/db/inventory';
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

type SortKey = 'recent' | 'peptide' | 'status';

export default function InventoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const receiveHotspot = useTutorialHotspot('inventory.receive_button');
  const listRef = useRef<FlatList<InventoryItem>>(null);
  useTutorialScrollReset(listRef);

  const load = useCallback(async () => {
    const data = await getInventoryItems();
    setItems(data);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((i) => !i.deleted_at);
    if (q) {
      rows = rows.filter(
        (i) =>
          i.peptide_name.toLowerCase().includes(q) ||
          ((i as InventoryItem & { batch_number?: string | null }).batch_number ?? '').toLowerCase().includes(q) ||
          ((i as InventoryItem & { vendor?: string | null }).vendor ?? '').toLowerCase().includes(q),
      );
    }
    if (sortKey === 'peptide') {
      rows = [...rows].sort((a, b) => a.peptide_name.localeCompare(b.peptide_name));
    } else if (sortKey === 'status') {
      const order: Record<InventoryStatus, number> = {
        Degraded: 0,
        Expired: 0,
        Aging: 1,
        Low: 2,
        Fresh: 3,
        Stable: 4,
        Sealed: 5,
      };
      rows = [...rows].sort((a, b) => order[getStatus(a).status] - order[getStatus(b).status]);
    } else {
      rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return rows;
  }, [items, query, sortKey]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="mb-4">
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                className="flex-1 bg-primary-600 rounded-xl py-3 items-center active:bg-primary-700"
                ref={receiveHotspot.ref}
                onLayout={receiveHotspot.onLayout}
                onPress={() => {
                  receiveHotspot.onPress();
                  router.push('/(tabs)/inventory/receive' as never);
                }}
              >
                <Text className="text-white font-bold">📦 Receive Shipment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-surface-card border border-surface-border rounded-xl py-3 px-3 items-center active:bg-surface-elevated"
                onPress={() => router.push('/(tabs)/inventory/new' as never)}
              >
                <Text className="text-slate-200 font-semibold">+ Single</Text>
              </TouchableOpacity>
            </View>

            <RNTextInput
              className="bg-surface-elevated border border-surface-border rounded-xl px-4 py-2.5 text-white text-sm mb-2"
              placeholder="Search peptide, vendor, batch…"
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
            />

            <View className="flex-row gap-2">
              <Text className="text-slate-400 text-xs self-center">Sort:</Text>
              {(['recent', 'peptide', 'status'] as SortKey[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  className={`px-3 py-1 rounded-full border ${
                    sortKey === k
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-surface-elevated border-surface-border'
                  }`}
                  onPress={() => setSortKey(k)}
                >
                  <Text
                    className={`text-[11px] capitalize font-medium ${
                      sortKey === k ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

              {item.reconstituted && daysRecon != null && status !== 'Expired' && (
                <DegradationBlock
                  peptideSlug={slugifyName(item.peptide_name)}
                  reconstituted={item.reconstituted}
                  storage_location={item.storage_location}
                  daysRecon={daysRecon}
                />
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

function slugifyName(name: string): string {
  return name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-z0-9]+/g, '-');
}

function DegradationBlock({
  peptideSlug,
  reconstituted,
  storage_location,
  daysRecon,
}: {
  peptideSlug: string;
  reconstituted: boolean;
  storage_location: string;
  daysRecon: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const state = storageStateFromVial({ reconstituted, storage_location });
  const potency = remainingPotency(peptideSlug, state, daysRecon);
  const pct = Math.round(potency * 100);
  const mult = doseCompensationMultiplier(potency);

  let tone: 'emerald' | 'amber' | 'red' = 'emerald';
  if (potency < 0.6) tone = 'red';
  else if (potency < 0.8) tone = 'amber';

  return (
    <View className="mt-3">
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View className="flex-row justify-between mb-1">
          <Text className="text-slate-500 text-[10px] uppercase font-semibold">
            Est. potency (tap for chart)
          </Text>
          <Text className={`text-[10px] font-bold ${
            tone === 'red' ? 'text-red-400' : tone === 'amber' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {pct}% · ~day {Math.floor(daysRecon)}
          </Text>
        </View>
        <View className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
          <View
            className={`h-1.5 rounded-full ${
              tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="mt-3 bg-surface-elevated rounded-xl p-3 border border-surface-border">
          <DegradationChart
            points={buildDegradationCurve(peptideSlug, state, Date.now() - daysRecon * 86_400_000, 45, 45)}
            currentPotency={potency}
            daysInState={daysRecon}
            totalDays={45}
            width={280}
            height={150}
          />
          {tone !== 'emerald' && (
            <View className={`${tone === 'red' ? 'bg-red-900/30 border-red-800' : 'bg-amber-900/30 border-amber-800'} border rounded-lg p-2 mt-2`}>
              <Text className={`${tone === 'red' ? 'text-red-300' : 'text-amber-300'} text-xs font-semibold mb-1`}>
                Dose compensation estimate
              </Text>
              <Text className="text-slate-300 text-[11px] leading-5">
                To match original potency, multiply dose by {mult.toFixed(2)}×.
                E.g., a 250 mcg target → ~{Math.round(250 * mult)} mcg.
              </Text>
              <Text className="text-slate-500 text-[10px] mt-1 italic">
                Estimate only. Supplier purity variance + injection absorption variance
                likely exceed this correction. Prefer using a fresher vial when possible.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
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
