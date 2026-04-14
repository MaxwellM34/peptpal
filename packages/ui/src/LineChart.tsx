import React from 'react';
import { View, Text } from 'react-native';
import Svg, {
  Line,
  Text as SvgText,
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';
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
  /** 0–100 percent-of-peak per series (useful when doses differ by orders of magnitude) */
  normalize?: boolean;
  /** Mark each series's peak with a dot + label */
  showPeaks?: boolean;
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
  yLabel,
  nowMs,
  normalize = false,
  showPeaks = false,
}: LineChartProps) {
  const plotW = Math.max(1, width - PADDING_LEFT - PADDING_RIGHT);
  const plotH = Math.max(1, height - PADDING_TOP - PADDING_BOTTOM);

  const normalized: PkSeries[] = normalize
    ? series.map((s) => {
        const peak = Math.max(0.0001, ...s.points.map((p) => p.mcg));
        return { ...s, points: s.points.map((p) => ({ t: p.t, mcg: (p.mcg / peak) * 100 })) };
      })
    : series;

  const maxY = Math.max(
    0.001,
    ...normalized.flatMap((s) => s.points.map((p) => p.mcg)),
  );
  const niceMax = normalize ? 100 : niceCeil(maxY);

  const xScale = (t: number) => PADDING_LEFT + ((t - startMs) / (endMs - startMs)) * plotW;
  const yScale = (v: number) => PADDING_TOP + plotH - (v / niceMax) * plotH;

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PADDING_TOP + plotH - f * plotH,
    label: normalize ? `${Math.round(f * 100)}%` : formatMcg(f * niceMax),
  }));

  const xTicks = buildTimeTicks(startMs, endMs, 4);
  const effectiveLabel = yLabel ?? (normalize ? '% of peak' : 'mcg');

  return (
    <View>
      {title ? (
        <Text className="text-white text-sm font-semibold px-1 pb-1">{title}</Text>
      ) : null}
      <Svg width={width} height={height}>
        <Defs>
          {normalized.map((s, i) => (
            <LinearGradient
              key={`grad-${i}`}
              id={`fill-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0" stopColor={s.color} stopOpacity="0.35" />
              <Stop offset="1" stopColor={s.color} stopOpacity="0.02" />
            </LinearGradient>
          ))}
        </Defs>
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
        {nowMs != null && nowMs >= startMs && nowMs <= endMs ? (
          <Line
            x1={xScale(nowMs)}
            x2={xScale(nowMs)}
            y1={PADDING_TOP}
            y2={PADDING_TOP + plotH}
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        ) : null}

        {normalized.map((s, i) => {
          const coords = s.points.map((p) => [xScale(p.t), yScale(p.mcg)] as const);
          const smoothD = smoothPath(coords);
          const baselineY = PADDING_TOP + plotH;
          const first = coords[0];
          const last = coords[coords.length - 1];
          const areaD =
            first && last
              ? `${smoothD} L ${last[0].toFixed(2)} ${baselineY.toFixed(2)} L ${first[0].toFixed(2)} ${baselineY.toFixed(2)} Z`
              : '';
          return (
            <React.Fragment key={`s-${i}`}>
              {areaD ? <Path d={areaD} fill={`url(#fill-${i})`} /> : null}
              <Path d={smoothD} fill="none" stroke={s.color} strokeWidth={2} />
            </React.Fragment>
          );
        })}

        {showPeaks
          ? normalized.map((s, i) => {
              const peak = s.points.reduce(
                (best, p) => (p.mcg > best.mcg ? p : best),
                s.points[0] ?? { t: startMs, mcg: 0 },
              );
              if (peak.mcg <= 0) return null;
              const px = xScale(peak.t);
              const py = yScale(peak.mcg);
              return (
                <React.Fragment key={`peak-${i}`}>
                  <Circle cx={px} cy={py} r={3} fill={s.color} stroke="#0f172a" strokeWidth={1.5} />
                </React.Fragment>
              );
            })
          : null}

        <SvgText x={PADDING_LEFT} y={12} fill="#94a3b8" fontSize={9}>
          {effectiveLabel}
        </SvgText>
      </Svg>
    </View>
  );
}

/** Centripetal Catmull-Rom → cubic Bézier smoothing. */
function smoothPath(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]![0]} ${points[0]![1]}`;
  const tension = 0.5;
  let d = `M ${points[0]![0].toFixed(2)} ${points[0]![1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
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
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i <= count; i++) {
    const t = startMs + i * step;
    const d = new Date(t);
    let label: string;
    if (spanH <= 36) label = `${d.getHours().toString().padStart(2, '0')}:00`;
    else if (spanH <= 24 * 14) label = days[d.getDay()] ?? '';
    else label = `${d.getMonth() + 1}/${d.getDate()}`;
    ticks.push({ t, label });
  }
  return ticks;
}
