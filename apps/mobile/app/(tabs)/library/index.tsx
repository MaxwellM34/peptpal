import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PeptideCard } from '@peptpal/ui';
import { usePeptideList, usePeptideSearch } from '../../../src/hooks/usePeptides';

type RouteFilter = 'all' | 'subq' | 'im' | 'intranasal' | 'topical';
type StorageFilter = 'all' | 'fridge' | 'freezer';

export default function LibraryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<RouteFilter>('all');
  const [storageFilter, setStorageFilter] = useState<StorageFilter>('all');

  const listQuery = usePeptideList();
  const searchQuery = usePeptideSearch(query);

  const isSearching = query.length >= 2;
  const data = isSearching ? searchQuery.data?.items : listQuery.data?.items;
  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading;
  const isError = isSearching ? searchQuery.isError : listQuery.isError;

  const filtered = (data ?? []).filter((p) => {
    if (routeFilter !== 'all' && !p.routes.includes(routeFilter)) return false;
    if (storageFilter !== 'all' && p.storage_temp !== storageFilter) return false;
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      {/* Search bar */}
      <View className="px-4 pt-3 pb-2">
        <TextInput
          className="bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-white text-base"
          placeholder="Search peptides..."
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Filters */}
      <View className="px-4 pb-2 gap-2">
        <ScrollChips
          label="Route:"
          options={[
            { key: 'all', label: 'All' },
            { key: 'subq', label: 'SubQ' },
            { key: 'im', label: 'IM' },
            { key: 'intranasal', label: 'Intranasal' },
            { key: 'topical', label: 'Topical' },
          ]}
          selected={routeFilter}
          onSelect={(v) => setRouteFilter(v as RouteFilter)}
        />
        <ScrollChips
          label="Storage:"
          options={[
            { key: 'all', label: 'All' },
            { key: 'fridge', label: '🧊 Fridge' },
            { key: 'freezer', label: '❄ Freezer' },
          ]}
          selected={storageFilter}
          onSelect={(v) => setStorageFilter(v as StorageFilter)}
        />
      </View>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      {isError && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-danger-400 text-center text-base">
            Could not load peptides. Check your connection.
          </Text>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <PeptideCard
              name={item.name}
              aliases={item.aliases}
              storageTemp={item.storage_temp}
              routes={item.routes}
              halfLifeHours={item.half_life_hours}
              onPress={() => router.push(`/(tabs)/library/${item.slug}`)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-slate-500 text-base">No peptides found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ScrollChips({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View className="flex-row items-center gap-2 flex-wrap">
      <Text className="text-slate-400 text-xs font-medium">{label}</Text>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          className={`px-3 py-1 rounded-full border ${
            selected === o.key
              ? 'bg-primary-600 border-primary-500'
              : 'bg-surface-elevated border-surface-border'
          }`}
          onPress={() => onSelect(o.key)}
        >
          <Text
            className={`text-xs font-medium ${selected === o.key ? 'text-white' : 'text-slate-300'}`}
          >
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
