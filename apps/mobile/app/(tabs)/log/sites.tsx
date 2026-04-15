import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { BodyMap, SiteRotationCard, type SiteInfo } from '@peptpal/ui';
import { getSiteRotationStatus, type SiteLastUsed } from '../../../src/db/injectionLog';

const ALL_SITES = [
  'abdomen_left',
  'abdomen_right',
  'thigh_left',
  'thigh_right',
  'deltoid_left',
  'deltoid_right',
  'glute_left',
  'glute_right',
];

export default function SitesScreen() {
  const [rows, setRows] = useState<SiteLastUsed[]>([]);

  const load = useCallback(async () => {
    setRows(await getSiteRotationStatus());
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const byKey = new Map(rows.map((r) => [r.site, r]));
  const sites: SiteInfo[] = ALL_SITES.map((key) => {
    const r = byKey.get(key);
    if (!r) return { site: key, status: 'unused' };
    return { site: key, status: r.status, daysSince: r.daysSince, peptideName: r.peptideName };
  });

  const ready = sites.filter((s) => s.status === 'ok').length;
  const avoid = sites.filter((s) => s.status === 'avoid').length;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-surface-card rounded-2xl p-4 mb-4 items-center">
          <BodyMap sites={sites} />
          <Text className="text-slate-400 text-xs mt-3 text-center">
            {ready} site{ready === 1 ? '' : 's'} ready · {avoid} resting
          </Text>
        </View>

        <Text className="text-slate-200 font-bold mb-2 text-base">All Sites</Text>
        {sites
          .sort((a, b) => {
            const order: Record<string, number> = { ok: 0, unused: 1, warning: 2, avoid: 3 };
            return order[a.status] - order[b.status];
          })
          .map((s) => (
            <SiteRotationCard key={s.site} siteName={s.site} info={s} />
          ))}

        <View className="bg-surface-card rounded-2xl p-4 mt-2">
          <Text className="text-slate-200 font-bold mb-2">Why rotate?</Text>
          <Text className="text-slate-400 text-xs leading-5">
            Repeated injection at the same site causes lipohypertrophy (subcutaneous fibrosis) and
            erratic absorption. Give each site at least 7 days to recover. Abdomen and thigh sites
            rotate most often; deltoid and glute sites are best for thicker oily blends.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
