import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Rect } from 'react-native-svg';
import type { PkSeries } from '@peptpal/core';

export interface LineChartProps {
  series: PkSeries[];
  width: number;
  height: number;
  startMs: number;
  endMs: number;
  title?: string;
  yLabel?: string;
  nowMs?: number;
}

const PADDING_LEFT = 44;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

export function LineChart({
  series,
  width,
  height,
  startMs,
  endMs,
  title,
  yLabel = 'mcg',
  nowMs,
}: LineChartProps) {
  const plotW = Math.max(1, width - PADDING_LEFT - PADDING_RIGHT);
  const plotH = Math.max(1, height - PADDING_TOP - PADDING_BOTTOM);

  const maxY = Math.max(
    0.001,
    ...series.flatMap((s) => s.points.map((p) => p.mcg)),
  );
  const niceMax = niceCeil(maxY);

  const xScale = (t: number) => PADDING_LEFT + ((t - startMs) / (endMs - startMs)) * plotW;
  const yScale = (v: number) => PADDING_TOP + plotH - (v / niceMax) * plotH;

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PADDING_TOP + plotH - f * plotH,
    label: formatMcg(f * niceMax),
  }));

  const xTicks = buildTimeTicks(startMs, endMs, 4);

  return (
    <View>
      {title && (
        <Text className="text-white text-sm font-semibold px-1 pb-1">{title}</Text>
      )}
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill="#0f172a" rx={12} />
        {gridYs.map((g, i) => (
          <Line
            key={`gy-${i}`}
            x1={PADDING_LEFT}
            x2={width - PADDING_RIGHT}
            y1={g.y}
            y2={g.y}
            stroke="#1e293b"
            strokeWidth={1}
          />
        ))}
        {gridYs.map((g, i) => (
          <SvgText
            key={`gyl-${i}`}
            x={PADDING_LEFT - 4}
            y={g.y + 3}
            fill="#64748b"
            fontSize={9}
            textAnchor="end"
          >
            {g.label}
          </SvgText>
        ))}
        {xTicks.map((tick, i) => (
          <SvgText
            key={`xt-${i}`}
            x={xScale(tick.t)}
            y={height - 10}
            fill="#64748b"
            fontSize={9}
            textAnchor="middle"
          >
            {tick.label}
          </SvgText>
        ))}
        {nowMs != null && nowMs >= startMs && nowMs <= endMs && (
          <Line
            x1={xScale(nowMs)}
            x2={xScale(nowMs)}
            y1={PADDING_TOP}
            y2={PADDING_TOP + plotH}
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}
        {series.map((s, i) => {
          const pts = s.points
            .map((p) => `${xScale(p.t).toFixed(2)},${yScale(p.mcg).toFixed(2)}`)
            .join(' ');
          return (
            <Polyline
              key={`s-${i}`}
              points={pts}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
            />
          );
        })}
        <SvgText x={PADDING_LEFT} y={12} fill="#94a3b8" fontSize={9}>
          {yLabel}
        </SvgText>
      </Svg>
    </View>
  );
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const mult = v / base;
  const niceMult = mult <= 1 ? 1 : mult <= 2 ? 2 : mult <= 5 ? 5 : 10;
  return niceMult * base;
}

function formatMcg(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 100) return v.toFixed(0);
  if (v >= 10) return v.toFixed(0);
  if (v >= 1) return v.toFixed(1);
  return v.toFixed(2);
}

function buildTimeTicks(startMs: number, endMs: number, count: number) {
  const ticks: { t: number; label: string }[] = [];
  const step = (endMs - startMs) / count;
  const spanH = (endMs - startMs) / 3_600_000;
  for (let i = 0; i <= count; i++) {
    const t = startMs + i * step;
    const d = new Date(t);
    const label =
      spanH <= 36
        ? `${d.getHours().toString().padStart(2, '0')}:00`
        : `${d.getMonth() + 1}/${d.getDate()}`;
    ticks.push({ t, label });
  }
  return ticks;
}
