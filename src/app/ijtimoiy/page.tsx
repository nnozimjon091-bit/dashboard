"use client";

import { ChartCard } from "@/components/chart-card";
import { ColumnChart, TrendChart } from "@/components/charts";
import { NoData, NoDataInRange } from "@/components/no-data";
import { StatTile } from "@/components/stat-tile";
import { Card, DataTable, PageHeader, SectionTitle } from "@/components/ui";
import { compact, num, pct } from "@/lib/format";
import {
  buildSeries,
  buildStockSeries,
  delta,
  mergeSeries,
  socialKpis,
  type SeriesPoint,
} from "@/lib/metrics";
import { seriesColor } from "@/lib/palette";
import { SERIES_ORDER } from "@/lib/series";
import { SOCIAL_PLATFORMS } from "@/lib/types";
import { useDashboard } from "@/lib/use-dashboard";

export default function SocialPage() {
  const { current, previous, range, bucket, tokens, isEmpty, isRangeEmpty } =
    useDashboard();

  const kpi = socialKpis(current.social);
  const prev = socialKpis(previous.social);

  const color = (key: string) =>
    seriesColor(tokens, key, SERIES_ORDER.platform);

  const followers = buildStockSeries(current.social, range, bucket, {
    instagram: {
      match: (row) => row.platform === "instagram",
      value: (row) => row.followers,
    },
    telegram: {
      match: (row) => row.platform === "telegram",
      value: (row) => row.followers,
    },
  });

  const reach = buildSeries(current.social, range, bucket, {
    instagram: (row) => (row.platform === "instagram" ? row.reach : 0),
    telegram: (row) => (row.platform === "telegram" ? row.reach : 0),
  });

  // Faollik darajasi — nisbat, shuning uchun avval jamlanadi, keyin bo'linadi.
  const engagementRate = mergeSeries(
    buildSeries(current.social, range, bucket, {
      engagement: (row) => row.engagement,
      reach: (row) => row.reach,
    }),
  ).map((point) => ({
    ...point,
    er: Number(point.reach) ? Number(point.engagement) / Number(point.reach) : 0,
  }));

  const byPlatform = SOCIAL_PLATFORMS.map((platform) => {
    const rows = current.social.filter((row) => row.platform === platform.value);
    return { platform: platform.label, ...socialKpis(rows) };
  });

  const storyKpi = socialKpis(
    current.social.filter((row) => row.platform === "instagram_story"),
  );

  if (isEmpty) {
    return (
      <div className="space-y-5">
        <PageHeader title="Ijtimoiy tarmoq" />
        <NoData />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ijtimoiy tarmoq"
        description="Instagram, Telegram va Instagram Story: auditoriya, qamrov va faollik."
      />

      {isRangeEmpty ? (
        <NoDataInRange />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Obunachilar"
              value={compact(kpi.followers)}
              delta={delta(kpi.followers, prev.followers)}
              hint="davr oxiriga"
            />
            <StatTile
              label="Davr ichidagi o'sish"
              value={(kpi.followerGrowth >= 0 ? "+" : "") + num(kpi.followerGrowth)}
              delta={delta(kpi.followerGrowth, prev.followerGrowth)}
            />
            <StatTile
              label="Qamrov"
              value={compact(kpi.reach)}
              delta={delta(kpi.reach, prev.reach)}
            />
            <StatTile
              label="Faollik (ER)"
              value={pct(kpi.er)}
              delta={delta(kpi.er, prev.er)}
              hint="faollik / qamrov"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard<SeriesPoint>
              title="Obunachilar"
              subtitle="davr oxiridagi holat"
              legend={[
                { name: "Instagram", color: color("instagram") },
                { name: "Telegram", color: color("telegram") },
              ]}
              table={{
                rows: followers,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "instagram",
                    label: "Instagram",
                    align: "right",
                    render: (row) => num(Number(row.instagram)),
                  },
                  {
                    key: "telegram",
                    label: "Telegram",
                    align: "right",
                    render: (row) => num(Number(row.telegram)),
                  },
                ],
              }}
            >
              <TrendChart
                data={followers}
                series={[
                  {
                    key: "instagram",
                    name: "Instagram",
                    color: color("instagram"),
                  },
                  { key: "telegram", name: "Telegram", color: color("telegram") },
                ]}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Qamrov"
              subtitle="ko'rgan odamlar soni"
              legend={[
                { name: "Instagram", color: color("instagram") },
                { name: "Telegram", color: color("telegram") },
              ]}
              table={{
                rows: reach,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "instagram",
                    label: "Instagram",
                    align: "right",
                    render: (row) => num(Number(row.instagram)),
                  },
                  {
                    key: "telegram",
                    label: "Telegram",
                    align: "right",
                    render: (row) => num(Number(row.telegram)),
                  },
                ],
              }}
            >
              <ColumnChart
                data={reach}
                series={[
                  {
                    key: "instagram",
                    name: "Instagram",
                    color: color("instagram"),
                  },
                  { key: "telegram", name: "Telegram", color: color("telegram") },
                ]}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Faollik darajasi (ER)"
              subtitle="ikki kanal bo'yicha birgalikda"
              table={{
                rows: engagementRate,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "er",
                    label: "ER",
                    align: "right",
                    render: (row) => pct(Number(row.er)),
                  },
                  {
                    key: "engagement",
                    label: "Faollik",
                    align: "right",
                    render: (row) => num(Number(row.engagement)),
                  },
                  {
                    key: "reach",
                    label: "Qamrov",
                    align: "right",
                    render: (row) => num(Number(row.reach)),
                  },
                ],
              }}
            >
              <TrendChart
                data={engagementRate}
                fill
                format={(value) => pct(value)}
                series={[{ key: "er", name: "ER", color: tokens.series[0] }]}
              />
            </ChartCard>

            <Card>
              <SectionTitle
                title="Platformalar kesimi"
                hint="tanlangan davr bo'yicha"
              />
              <DataTable
                rows={byPlatform}
                rowKey={(row) => row.platform}
                columns={[
                  {
                    key: "platform",
                    label: "Platforma",
                    render: (row) => row.platform,
                  },
                  {
                    key: "followers",
                    label: "Obunachilar",
                    align: "right",
                    render: (row) => num(row.followers),
                  },
                  {
                    key: "growth",
                    label: "O'sish",
                    align: "right",
                    render: (row) =>
                      (row.followerGrowth >= 0 ? "+" : "") +
                      num(row.followerGrowth),
                  },
                  {
                    key: "reach",
                    label: "Qamrov",
                    align: "right",
                    render: (row) => num(row.reach),
                  },
                  {
                    key: "engagement",
                    label: "Faollik",
                    align: "right",
                    render: (row) => num(row.engagement),
                  },
                  {
                    key: "er",
                    label: "ER",
                    align: "right",
                    render: (row) => pct(row.er),
                  },
                  {
                    key: "posts",
                    label: "Postlar",
                    align: "right",
                    render: (row) => num(row.posts),
                  },
                ]}
              />
            </Card>

            <Card>
              <SectionTitle
                title="Instagram Story"
                hint="tanlangan davr bo'yicha"
              />
              <dl className="grid grid-cols-2 gap-4">
                <Mini label="Storieslar soni" value={num(storyKpi.posts)} />
                <Mini label="Qamrov" value={compact(storyKpi.reach)} />
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
