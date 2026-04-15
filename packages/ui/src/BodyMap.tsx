import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Ellipse, Path, Circle, Text as SvgText, G } from 'react-native-svg';

export type SiteStatus = 'ok' | 'warning' | 'avoid' | 'unused';

export interface SiteInfo {
  site: string;
  status: SiteStatus;
  daysSince?: number;
  peptideName?: string;
}

interface BodyMapProps {
  sites: SiteInfo[];
  onSitePress?: (site: string) => void;
}

const STATUS_COLORS: Record<SiteStatus, string> = {
  ok: '#10b981',      // green — ready
  warning: '#f59e0b', // amber — resting
  avoid: '#ef4444',   // red — too soon
  unused: '#334155',  // slate — never used
};

// Front-view body SVG anchors (within a 160×320 viewBox)
const SITE_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  abdomen_left:   { x: 68, y: 168, label: 'Abd L' },
  abdomen_right:  { x: 92, y: 168, label: 'Abd R' },
  thigh_left:     { x: 63, y: 234, label: 'Thigh L' },
  thigh_right:    { x: 97, y: 234, label: 'Thigh R' },
  deltoid_left:   { x: 44, y: 126, label: 'Delt L' },
  deltoid_right:  { x: 116, y: 126, label: 'Delt R' },
  glute_left:     { x: 66, y: 204, label: 'Glute L' },
  glute_right:    { x: 94, y: 204, label: 'Glute R' },
};

// Simple body silhouette path (front view, 160×320 canvas)
const BODY_PATH = `
  M 80 10
  C 80 10 62 8 58 22
  C 54 34 56 44 50 52
  C 44 60 34 66 32 80
  C 28 96 30 110 28 124
  C 26 138 24 144 28 152
  C 32 160 38 160 38 160
  L 38 260
  C 38 274 44 278 52 278
  C 60 278 62 272 62 260
  L 62 220
  L 98 220
  L 98 260
  C 98 272 100 278 108 278
  C 116 278 122 274 122 260
  L 122 160
  C 122 160 128 160 132 152
  C 136 144 134 138 132 124
  C 130 110 132 96 128 80
  C 126 66 116 60 110 52
  C 104 44 106 34 102 22
  C 98 8 80 10 80 10 Z
`;

const HEAD_CX = 80;
const HEAD_CY = 0;
const HEAD_RX = 18;
const HEAD_RY = 18;

export function BodyMap({ sites, onSitePress }: BodyMapProps) {
  const siteMap = new Map<string, SiteInfo>(sites.map((s) => [s.site, s]));

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={160} height={300} viewBox="0 0 160 300">
        {/* Body silhouette */}
        <Path d={BODY_PATH} fill="#1e293b" stroke="#334155" strokeWidth={1} />
        {/* Head */}
        <Ellipse
          cx={HEAD_CX}
          cy={22}
          rx={HEAD_RX}
          ry={HEAD_RY}
          fill="#1e293b"
          stroke="#334155"
          strokeWidth={1}
        />

        {/* Site dots */}
        {Object.entries(SITE_POSITIONS).map(([key, pos]) => {
          const info = siteMap.get(key);
          const status: SiteStatus = info?.status ?? 'unused';
          const color = STATUS_COLORS[status];
          return (
            <G key={key} onPress={() => onSitePress?.(key)}>
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={8}
                fill={color}
                opacity={0.9}
              />
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={8}
                fill="transparent"
                stroke={color}
                strokeWidth={2}
                opacity={0.4}
              />
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {([
          { s: 'ok', label: 'Ready (7d+)' },
          { s: 'warning', label: 'Resting (4–7d)' },
          { s: 'avoid', label: 'Too soon (<4d)' },
          { s: 'unused', label: 'Never used' },
        ] as { s: SiteStatus; label: string }[]).map(({ s, label }) => (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLORS[s] }} />
            <Text style={{ color: '#94a3b8', fontSize: 10 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function SiteRotationCard({
  siteName,
  info,
  onPress,
}: {
  siteName: string;
  info: SiteInfo;
  onPress?: () => void;
}) {
  const color = STATUS_COLORS[info.status];
  const label =
    info.status === 'unused'
      ? 'Never used'
      : info.daysSince != null
      ? `${info.daysSince < 1 ? 'Today' : `${Math.floor(info.daysSince)}d ago`}${info.peptideName ? ` · ${info.peptideName}` : ''}`
      : '';

  const readableKey = siteName
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: info.status === 'avoid' ? '#ef444433' : '#334155',
      }}
    >
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#f1f5f9', fontWeight: '600', fontSize: 14 }}>{readableKey}</Text>
        {label ? <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{label}</Text> : null}
      </View>
      {info.status === 'ok' && (
        <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '600' }}>Ready</Text>
      )}
      {info.status === 'warning' && (
        <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '600' }}>
          {info.daysSince != null ? `${(7 - info.daysSince).toFixed(0)}d left` : 'Resting'}
        </Text>
      )}
      {info.status === 'avoid' && (
        <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>Rest</Text>
      )}
    </TouchableOpacity>
  );
}
