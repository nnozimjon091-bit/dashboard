"use client";

// Grafiklar. Umumiy qoidalar: ingichka belgilar, hairline to'r,
// bitta o'q (hech qachon ikkinchi Y o'qi), rang seriyaning o'ziga biriktirilgan.

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compact } from "@/lib/format";
import type { SeriesPoint } from "@/lib/metrics";
import { useChartTokens } from "@/lib/theme";
import type { ChartTokens } from "@/lib/palette";

export interface SeriesConfig {
  /** Ma'lumotdagi maydon nomi */
  key: string;
  /** Legendada ko'rinadigan nom */
  name: string;
  color: string;
}

export type ValueFormat = (value: number) => string;

const AXIS_FONT = 12;

function axisProps(tokens: ChartTokens) {
  return {
    tick: { fill: tokens.muted, fontSize: AXIS_FONT },
    tickLine: false,
  } as const;
}

// ── Tooltip ───────────────────────────────────────────────────────────

interface TooltipItem {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
  tokens,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  format: ValueFormat;
  tokens: ChartTokens;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
      style={{ background: tokens.surface }}
    >
      <p className="mb-1 font-medium text-ink">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((item, index) => (
          <li key={index} className="flex items-center gap-2 whitespace-nowrap">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
            />
            <span className="text-ink-2">{item.name}</span>
            <span className="ml-auto pl-3 font-medium text-ink tnum">
              {format(Number(item.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Vaqt bo'yicha trend (chiziq / yengil to'ldirish) ──────────────────

export function TrendChart({
  data,
  series,
  format = (value) => compact(value),
  height = 260,
  fill = false,
}: {
  data: SeriesPoint[];
  series: SeriesConfig[];
  format?: ValueFormat;
  height?: number;
  /** Bitta seriyada yengil to'ldirish (10%) mantiqiy; ko'p seriyada — yo'q. */
  fill?: boolean;
}) {
  const tokens = useChartTokens();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={tokens.grid} strokeWidth={1} />
        <XAxis
          dataKey="label"
          {...axisProps(tokens)}
          axisLine={{ stroke: tokens.axis }}
          minTickGap={24}
          interval="preserveStartEnd"
        />
        <YAxis
          {...axisProps(tokens)}
          axisLine={false}
          width={56}
          tickFormatter={(value: number) => format(value)}
        />
        <Tooltip
          cursor={{ stroke: tokens.axis, strokeWidth: 1 }}
          content={<ChartTooltip format={format} tokens={tokens} />}
        />
        {series.map((item) => (
          <Area
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.name}
            stroke={item.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={item.color}
            fillOpacity={fill && series.length === 1 ? 0.1 : 0}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: tokens.surface }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Vaqt bo'yicha ustunlar ────────────────────────────────────────────

export function ColumnChart({
  data,
  series,
  format = (value) => compact(value),
  height = 260,
}: {
  data: SeriesPoint[];
  series: SeriesConfig[];
  format?: ValueFormat;
  height?: number;
}) {
  const tokens = useChartTokens();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        barGap={2}
        barCategoryGap="22%"
      >
        <CartesianGrid vertical={false} stroke={tokens.grid} strokeWidth={1} />
        <XAxis
          dataKey="label"
          {...axisProps(tokens)}
          axisLine={{ stroke: tokens.axis }}
          minTickGap={16}
          interval="preserveStartEnd"
        />
        <YAxis
          {...axisProps(tokens)}
          axisLine={false}
          width={56}
          tickFormatter={(value: number) => format(value)}
        />
        <Tooltip
          cursor={{ fill: tokens.grid, fillOpacity: 0.45 }}
          content={<ChartTooltip format={format} tokens={tokens} />}
        />
        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.name}
            fill={item.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Kategoriyalar bo'yicha gorizontal ustunlar ────────────────────────

export interface CategoryRow {
  label: string;
  value: number;
}

/**
 * Bitta seriya — barcha ustunlar bir xil rangda (uzunlik allaqachon kattalikni
 * ko'rsatib turibdi, rangni ham shunga sarflash ortiqcha).
 */
export function CategoryBarChart({
  data,
  format = (value) => compact(value),
  height,
  color,
}: {
  data: CategoryRow[];
  format?: ValueFormat;
  height?: number;
  color?: string;
}) {
  const tokens = useChartTokens();
  const barColor = color ?? tokens.series[0];
  // Har bir qatorga 38px + o'q uchun joy; yonidagi grafiklar bilan bir
  // qatorda turgani uchun eng kamida 260px.
  const computed = height ?? Math.max(260, data.length * 38 + 28);

  return (
    <ResponsiveContainer width="100%" height={computed}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 56, bottom: 0, left: 0 }}
        barCategoryGap="24%"
      >
        <CartesianGrid horizontal={false} stroke={tokens.grid} strokeWidth={1} />
        <XAxis
          type="number"
          {...axisProps(tokens)}
          axisLine={{ stroke: tokens.axis }}
          tickFormatter={(value: number) => format(value)}
        />
        <YAxis
          type="category"
          dataKey="label"
          {...axisProps(tokens)}
          axisLine={false}
          width={92}
        />
        <Tooltip
          cursor={{ fill: tokens.grid, fillOpacity: 0.45 }}
          content={<ChartTooltip format={format} tokens={tokens} />}
        />
        <Bar
          dataKey="value"
          name="Qiymat"
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        >
          {data.map((row) => (
            <Cell key={row.label} fill={barColor} />
          ))}
          {/* Qiymat ustun uchidan tashqarida — kesilib qolmaydi */}
          <LabelList
            dataKey="value"
            position="right"
            offset={8}
            fill={tokens.ink2}
            fontSize={12}
            formatter={(value: number) => format(value)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
