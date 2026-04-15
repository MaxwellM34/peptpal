import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Path, Text as SvgText, G } from 'react-native-svg';

export interface SyringeDiagramProps {
  /** Volume to draw in mL */
  volumeMl: number;
  /** Syringe capacity in mL (typical insulin syringe = 1.0 mL = 100 units) */
  capacityMl?: number;
  width?: number;
  height?: number;
}

/**
 * Renders an insulin syringe (U-100 scale) with a filled region showing the
 * exact draw volume in both units and mL. Insulin syringes are graduated
 * 100 units / mL — so 0.25 mL = 25 units on the barrel.
 */
export function SyringeDiagram({
  volumeMl,
  capacityMl = 1.0,
  width = 320,
  height = 100,
}: SyringeDiagramProps) {
  const clamped = Math.max(0, Math.min(volumeMl, capacityMl));
  const units = clamped * 100;
  const fillRatio = clamped / capacityMl;

  const barrelX = 40;
  const barrelY = 35;
  const barrelW = 220;
  const barrelH = 30;
  const fillW = barrelW * fillRatio;

  // Major tick every 10 units, minor every 2 units
  const majorTicks = Array.from({ length: 11 }, (_, i) => i * (capacityMl / 10));
  const minorTicks = Array.from({ length: 51 }, (_, i) => i * (capacityMl / 50));

  const overfill = volumeMl > capacityMl;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Plunger rod (left of barrel) */}
        <Rect x={5} y={40} width={30} height={20} fill="#475569" rx={2} />
        <Rect x={0} y={35} width={8} height={30} fill="#334155" rx={1} />

        {/* Barrel outline */}
        <Rect
          x={barrelX}
          y={barrelY}
          width={barrelW}
          height={barrelH}
          fill="#0f172a"
          stroke="#64748b"
          strokeWidth={1.5}
          rx={2}
        />

        {/* Liquid fill */}
        {fillW > 0 && (
          <Rect
            x={barrelX}
            y={barrelY + 2}
            width={fillW}
            height={barrelH - 4}
            fill={overfill ? '#ef4444' : '#3b82f6'}
            opacity={0.55}
          />
        )}
        {fillW > 0 && (
          <Line
            x1={barrelX + fillW}
            y1={barrelY + 1}
            x2={barrelX + fillW}
            y2={barrelY + barrelH - 1}
            stroke={overfill ? '#f87171' : '#60a5fa'}
            strokeWidth={2}
          />
        )}

        {/* Minor ticks */}
        {minorTicks.map((t, i) => {
          const x = barrelX + (t / capacityMl) * barrelW;
          return (
            <Line
              key={`min-${i}`}
              x1={x}
              y1={barrelY}
              x2={x}
              y2={barrelY + 5}
              stroke="#64748b"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Major ticks + labels (units) */}
        {majorTicks.map((t, i) => {
          const x = barrelX + (t / capacityMl) * barrelW;
          const unitVal = i * 10;
          return (
            <G key={`maj-${i}`}>
              <Line
                x1={x}
                y1={barrelY}
                x2={x}
                y2={barrelY + 8}
                stroke="#94a3b8"
                strokeWidth={1}
              />
              <SvgText
                x={x}
                y={barrelY - 4}
                fill="#94a3b8"
                fontSize={8}
                textAnchor="middle"
              >
                {unitVal}
              </SvgText>
            </G>
          );
        })}

        {/* Needle */}
        <Path
          d={`M ${barrelX + barrelW} ${barrelY + barrelH / 2 - 1} L ${barrelX + barrelW + 50} ${barrelY + barrelH / 2} L ${barrelX + barrelW} ${barrelY + barrelH / 2 + 1} Z`}
          fill="#cbd5e1"
        />

        {/* Draw-to-line marker */}
        {fillW > 0 && !overfill && (
          <G>
            <Line
              x1={barrelX + fillW}
              y1={barrelY + barrelH + 4}
              x2={barrelX + fillW}
              y2={barrelY + barrelH + 14}
              stroke="#3b82f6"
              strokeWidth={1.5}
            />
            <SvgText
              x={barrelX + fillW}
              y={barrelY + barrelH + 24}
              fill="#60a5fa"
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              {units.toFixed(units < 10 ? 1 : 0)} u
            </SvgText>
          </G>
        )}
      </Svg>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#64748b', fontSize: 10 }}>Draw to</Text>
          <Text style={{ color: overfill ? '#ef4444' : '#60a5fa', fontSize: 16, fontWeight: '700' }}>
            {units.toFixed(units < 10 ? 1 : 0)} units
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#64748b', fontSize: 10 }}>Volume</Text>
          <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: '700' }}>
            {clamped.toFixed(3)} mL
          </Text>
        </View>
      </View>
      {overfill && (
        <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>
          ⚠ Exceeds {capacityMl} mL syringe. Use a larger syringe or split the dose.
        </Text>
      )}
    </View>
  );
}
