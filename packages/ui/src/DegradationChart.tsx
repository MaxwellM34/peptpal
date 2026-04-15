import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { DegradationChartPoint } from '@peptpal/core';
import { variabilityFraction } from '@peptpal/core';

export interface DegradationChartProps {
  /** Points produced by buildDegradationCurve. */
  points: DegradationChartPoint[];
  /** Current potency (for marker dot). */
  currentPotency: number;
  /** Days since reconstituted (for x-axis placement of "now" marker). */
  daysInState: number;
  /** Days covered by the chart (total x-axis range). */
  totalDays: number;
  width?: number;
  height?: number;
  /** Show the ±variability envelope shaded around the deterministic curve. */
  showVariability?: boolean;
}

const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 22;

export function DegradationChart({
  points,
  currentPotency,
  daysInState,
  totalDays,
  width = 320,
  height = 160,
  showVariability = true,
}: DegradationChartProps) {
  const plotW = width - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;

  const xFor = (day: number) => PAD_L + (day / totalDays) * plotW;
  const yFor = (potency: number) => PAD_T + (1 - potency) * plotH;

  // Deterministic path
  const pathD = points
    .map((p, i) => {
      const day = (p.t - points[0]!.t) / 86_400_000;
      const x = xFor(day);
      const y = yFor(p.potency);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // Variability envelope — upper and lower bounds
  let envelopeD = '';
  if (showVariability) {
    const upperPts = points.map((p) => {
      const day = (p.t - points[0]!.t) / 86_400_000;
      const v = variabilityFraction(day);
      return { x: xFor(day), y: yFor(Math.min(1, p.potency + v * p.potency)) };
    });
    const lowerPts = points.map((p) => {
      const day = (p.t - points[0]!.t) / 86_400_000;
      const v = variabilityFraction(day);
      return { x: xFor(day), y: yFor(Math.max(0, p.potency - v * p.potency)) };
    });
    envelopeD =
      'M ' + upperPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ') +
      ' L ' + [...lowerPts].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ') +
      ' Z';
  }

  const nowX = xFor(Math.min(daysInState, totalDays));
  const nowY = yFor(currentPotency);

  // y-axis gridlines
  const gridlines = [0.25, 0.5, 0.75, 1.0];

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="degr-envelope" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3b82f6" stopOpacity={0.2} />
            <Stop offset="1" stopColor="#3b82f6" stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {/* Gridlines */}
        {gridlines.map((g) => (
          <React.Fragment key={g}>
            <Line
              x1={PAD_L}
              x2={width - PAD_R}
              y1={yFor(g)}
              y2={yFor(g)}
              stroke="#334155"
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
            <SvgText x={4} y={yFor(g) + 3} fill="#64748b" fontSize={9}>
              {Math.round(g * 100)}%
            </SvgText>
          </React.Fragment>
        ))}

        {/* Variability envelope */}
        {showVariability && envelopeD && (
          <Path d={envelopeD} fill="url(#degr-envelope)" />
        )}

        {/* Deterministic curve */}
        <Path d={pathD} stroke="#3b82f6" strokeWidth={2} fill="none" />

        {/* "Now" marker */}
        <Line x1={nowX} x2={nowX} y1={PAD_T} y2={height - PAD_B} stroke="#f59e0b" strokeWidth={1} strokeDasharray="2,2" />
        <Circle cx={nowX} cy={nowY} r={4} fill="#f59e0b" />
        <SvgText
          x={nowX}
          y={PAD_T - 2}
          fill="#f59e0b"
          fontSize={9}
          textAnchor="middle"
          fontWeight="bold"
        >
          now {Math.round(currentPotency * 100)}%
        </SvgText>

        {/* x-axis days */}
        {[0, Math.round(totalDays / 2), totalDays].map((d) => (
          <SvgText
            key={d}
            x={xFor(d)}
            y={height - 6}
            fill="#64748b"
            fontSize={9}
            textAnchor="middle"
          >
            {d === 0 ? 'open' : `+${d}d`}
          </SvgText>
        ))}
      </Svg>
      {showVariability && (
        <Text style={{ color: '#64748b', fontSize: 10, textAlign: 'center', marginTop: 4 }}>
          Shaded band = ±uncertainty (supplier purity, recon accuracy, absorption variance).
        </Text>
      )}
    </View>
  );
}
