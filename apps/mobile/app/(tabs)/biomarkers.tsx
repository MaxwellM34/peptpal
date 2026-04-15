import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { TextInput, Button, LineChart } from '@peptpal/ui';
import {
  BIOMARKERS,
  PANELS,
  biomarkerStatus,
  type BiomarkerKey,
  type BiomarkerCategory,
  type BiomarkerDef,
} from '@peptpal/core';
import {
  createBiomarkerReading,
  getBiomarkerReadings,
  deleteBiomarkerReading,
  type BiomarkerRow,
} from '../../src/db/biomarkers';
import { getActiveProtocolItems } from '../../src/db/protocols';

export default function BiomarkersScreen() {
  const [rows, setRows] = useState<BiomarkerRow[]>([]);
  const [category, setCategory] = useState<BiomarkerCategory>('gh');
  const [selectedKey, setSelectedKey] = useState<BiomarkerKey | null>(null);
  const [value, setValue] = useState('');
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 10));
  const [recommendedCats, setRecommendedCats] = useState<BiomarkerCategory[]>([]);

  const load = useCallback(async () => {
    const [readings, items] = await Promise.all([
      getBiomarkerReadings(),
      getActiveProtocolItems(),
    ]);
    setRows(readings);
    // Compute which panels the user should be tracking based on their active protocols.
    const cats = new Set<BiomarkerCategory>();
    for (const p of items) {
      const slug = p.peptide_slug ?? '';
      if (['cjc-1295', 'ipamorelin', 'hexarelin', 'tesamorelin'].includes(slug)) cats.add('gh');
      else if (['semaglutide', 'tirzepatide', 'retatrutide'].includes(slug)) cats.add('glp1');
      else if (['bpc-157', 'tb-500', 'ghk-cu-injectable', 'glow'].includes(slug)) cats.add('healing');
    }
    setRecommendedCats(Array.from(cats));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function handleSave() {
    if (!selectedKey) return;
    const v = parseFloat(value);
    if (isNaN(v) || v < 0) {
      Alert.alert('Invalid value', 'Enter a numeric value.');
      return;
    }
    await createBiomarkerReading({
      biomarker_key: selectedKey,
      value: v,
      measured_at: measuredAt,
    });
    setValue('');
    setSelectedKey(null);
    await load();
  }

  async function handleDelete(id: number) {
    Alert.alert('Delete reading?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBiomarkerReading(id);
          await load();
        },
      },
    ]);
  }

  const panel = PANELS[category];
  const panelRows = rows.filter((r) => panel.recommended.includes(r.biomarker_key));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-slate-200 text-base font-bold mb-1">Biomarker Tracking</Text>
        <Text className="text-slate-500 text-xs mb-4">
          Trend labs relevant to what you're running. Panels are category-driven.
        </Text>

        {/* Panel selector */}
        <View className="flex-row gap-2 mb-4 flex-wrap">
          {(Object.values(PANELS)).map((p) => (
            <TouchableOpacity
              key={p.key}
              className={`px-3 py-1.5 rounded-full border ${
                category === p.key
                  ? 'bg-primary-600 border-primary-500'
                  : 'bg-surface-elevated border-surface-border'
              }`}
              onPress={() => setCategory(p.key)}
            >
              <Text
                className={`text-xs font-medium ${category === p.key ? 'text-white' : 'text-slate-300'}`}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-surface-card rounded-2xl p-3 mb-4 border border-surface-border">
          <Text className="text-slate-300 text-xs leading-5">{panel.description}</Text>
          <Text className="text-slate-500 text-[10px] mt-1 italic">Cadence: {panel.cadence}</Text>
        </View>

        {/* Recommended panel prompt for active-protocol categories */}
        {recommendedCats.length > 0 && (
          <View className="mb-4">
            {recommendedCats.map((c) => {
              if (c === category) return null;
              const pRows = rows.filter((r) => PANELS[c].recommended.includes(r.biomarker_key));
              if (pRows.length > 0) return null;
              return (
                <TouchableOpacity
                  key={c}
                  className="bg-amber-900/20 border border-amber-800 rounded-xl p-3 mb-2"
                  onPress={() => setCategory(c)}
                >
                  <Text className="text-amber-300 text-xs font-bold mb-0.5">
                    💡 Recommended: {PANELS[c].label}
                  </Text>
                  <Text className="text-amber-200/80 text-[11px] leading-4">
                    You have active protocols in this category but no readings yet. Tap to switch.
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Entry form */}
        <View className="bg-surface-card rounded-2xl p-4 mb-4 border border-surface-border">
          <Text className="text-slate-200 font-bold mb-3">+ Add reading</Text>

          <View className="flex-row gap-2 flex-wrap mb-3">
            {panel.recommended.map((k) => (
              <TouchableOpacity
                key={k}
                className={`px-2 py-1 rounded border ${
                  selectedKey === k ? 'bg-primary-900/60 border-primary-700' : 'bg-surface-elevated border-surface-border'
                }`}
                onPress={() => setSelectedKey(k)}
              >
                <Text className="text-slate-200 text-[11px]">{BIOMARKERS[k].label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedKey && (
            <>
              <TextInput
                label={`Value (${BIOMARKERS[selectedKey].unit})`}
                placeholder="e.g. 180"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={setValue}
              />
              <TextInput
                label="Measured date (YYYY-MM-DD)"
                value={measuredAt}
                onChangeText={setMeasuredAt}
                className="mt-3"
              />
              {BIOMARKERS[selectedKey].notes && (
                <Text className="text-slate-400 text-xs mt-2">
                  {BIOMARKERS[selectedKey].notes}
                </Text>
              )}
              <View className="mt-3">
                <Button onPress={handleSave}>Save Reading</Button>
              </View>
            </>
          )}
        </View>

        {/* Biomarker trendlines */}
        {panel.recommended.map((key) => {
          const def = BIOMARKERS[key];
          const readings = rows
            .filter((r) => r.biomarker_key === key)
            .sort((a, b) => a.measured_at.localeCompare(b.measured_at));
          if (readings.length === 0) return null;
          const latest = readings[readings.length - 1]!;
          const status = biomarkerStatus({
            key,
            value: latest.value,
            measuredAt: latest.measured_at,
          });
          return (
            <BiomarkerCard
              key={key}
              def={def}
              readings={readings}
              status={status}
              onDelete={handleDelete}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const STATUS_STYLE = {
  in_range: { bg: 'bg-emerald-900/20', border: 'border-emerald-800', text: 'text-emerald-300', label: 'In Range' },
  low: { bg: 'bg-amber-900/20', border: 'border-amber-800', text: 'text-amber-300', label: 'Low' },
  high: { bg: 'bg-amber-900/20', border: 'border-amber-800', text: 'text-amber-300', label: 'High' },
  critical: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-300', label: 'Critical' },
} as const;

function BiomarkerCard({
  def,
  readings,
  status,
  onDelete,
}: {
  def: BiomarkerDef;
  readings: BiomarkerRow[];
  status: keyof typeof STATUS_STYLE;
  onDelete: (id: number) => void;
}) {
  const s = STATUS_STYLE[status];
  const latest = readings[readings.length - 1]!;

  const series = [
    {
      peptideName: def.label,
      color: '#3b82f6',
      halfLifeHours: 0,
      points: readings.map((r) => ({
        t: new Date(r.measured_at).getTime(),
        mcg: r.value,
      })),
    },
  ];
  const startMs = Math.min(...series[0]!.points.map((p) => p.t));
  const endMs = Math.max(...series[0]!.points.map((p) => p.t));

  return (
    <View className={`${s.bg} rounded-2xl p-4 mb-3 border ${s.border}`}>
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-white font-bold text-base">{def.label}</Text>
          <Text className="text-slate-400 text-xs">
            Range: {def.low}–{def.high} {def.unit}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-white text-lg font-bold">
            {latest.value} <Text className="text-slate-400 text-xs">{def.unit}</Text>
          </Text>
          <View className={`${s.bg} ${s.border} border rounded-full px-2 py-0.5 mt-1`}>
            <Text className={`${s.text} text-[10px] font-semibold uppercase`}>{s.label}</Text>
          </View>
        </View>
      </View>

      {readings.length >= 2 && startMs < endMs && (
        <View className="mt-2">
          <LineChart
            series={series}
            width={300}
            height={120}
            startMs={startMs}
            endMs={endMs}
            yLabel={def.unit}
          />
        </View>
      )}

      <View className="mt-2">
        {readings.slice(-3).reverse().map((r) => (
          <TouchableOpacity
            key={r.id}
            onLongPress={() => onDelete(r.id)}
            className="flex-row justify-between py-1 border-b border-surface-border last:border-0"
          >
            <Text className="text-slate-400 text-xs">
              {format(new Date(r.measured_at), 'MMM d, yyyy')}
            </Text>
            <Text className="text-slate-200 text-xs">{r.value} {def.unit}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
