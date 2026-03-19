import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { InjectionSite } from '@peptpal/core';

interface InjectionSiteSelectorProps {
  value: InjectionSite | null;
  onChange: (site: InjectionSite) => void;
}

type SiteGroup = {
  label: string;
  sites: { key: InjectionSite; side: 'L' | 'R' }[];
};

const SITE_GROUPS: SiteGroup[] = [
  {
    label: 'Abdomen',
    sites: [
      { key: 'abdomen_left', side: 'L' },
      { key: 'abdomen_right', side: 'R' },
    ],
  },
  {
    label: 'Thigh',
    sites: [
      { key: 'thigh_left', side: 'L' },
      { key: 'thigh_right', side: 'R' },
    ],
  },
  {
    label: 'Glute',
    sites: [
      { key: 'glute_left', side: 'L' },
      { key: 'glute_right', side: 'R' },
    ],
  },
  {
    label: 'Deltoid',
    sites: [
      { key: 'deltoid_left', side: 'L' },
      { key: 'deltoid_right', side: 'R' },
    ],
  },
];

const SITE_LABELS: Record<InjectionSite, string> = {
  abdomen_left: 'Abd. Left',
  abdomen_right: 'Abd. Right',
  thigh_left: 'Thigh Left',
  thigh_right: 'Thigh Right',
  glute_left: 'Glute Left',
  glute_right: 'Glute Right',
  deltoid_left: 'Delt. Left',
  deltoid_right: 'Delt. Right',
};

export function InjectionSiteSelector({ value, onChange }: InjectionSiteSelectorProps) {
  return (
    <View className="gap-3">
      {SITE_GROUPS.map((group) => (
        <View key={group.label}>
          <Text className="text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            {group.label}
          </Text>
          <View className="flex-row gap-2">
            {group.sites.map(({ key }) => {
              const selected = value === key;
              return (
                <TouchableOpacity
                  key={key}
                  className={`flex-1 py-2.5 rounded-xl border items-center ${
                    selected
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-surface-elevated border-surface-border'
                  }`}
                  onPress={() => onChange(key)}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-sm font-medium ${selected ? 'text-white' : 'text-slate-300'}`}
                  >
                    {SITE_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
