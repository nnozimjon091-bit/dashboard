"use client";

import { ChartCard } from "@/components/chart-card";
import { CategoryBarChart, ColumnChart, TrendChart } from "@/components/charts";
import { NoData, NoDataInRange } from "@/components/no-data";
import { HeroStat, StatTile } from "@/components/stat-tile";
import { PageHeader } from "@/components/ui";
import { compact, num, pct, ratio, usd, usdCompact, usdFine } from "@/lib/format";
import {
  buildSeries,
  buildStockSeries,
  delta,
  mergeSeries,
  overviewKpis,
  sum,
  type SeriesPoint,
} from "@/lib/metrics";
import { seriesColor } from "@/lib/palette";
import { SERIES_ORDER } from "@/lib/series";
import { SALES_SOURCES } from "@/lib/types";
import { useDashboard } from "@/lib/use-dashboard";

export default function OverviewPage() {
  const { current, previous, range, bucket, tokens, isEmpty, isRangeEmpty } =
    useDashboard();

  const kpi = overviewKpis(current);
  const prev = overviewKpis(previous);

  const color = (group: keyof typeof SERIES_ORDER, key: string) =>
    seriesColor(tokens, key, SERIES_ORDER[group]);

  // Daromad va xarajat — ikkalasi ham USD, shuning uchun bitta o'qda.
  const money = mergeSeries(
    buildSeries(current.sales, range, bucket, { revenue: (row) => row.revenue }),
    buildSeries(current.ads, range, bucket, { spend: (row) => row.spend }),
  );

  const funnel = buildSeries(current.sales, range, bucket, {
    leads: (row) => row.leads,
    deals: (row) => row.deals,
  });

  const audience = mergeSeries(
    buildStockSeries(current.social, range, bucket, {
      instagram: {
        match: (row) => row.platform === "instagram",
        value: (row) => row.followers,
      },
      telegram: {
        match: (row) => row.platform === "telegram",
        value: (row) => row.followers,
      },
    }),
    buildStockSeries(current.video, range, bucket, {
      youtube: {
        match: (row) => row.platform === "youtube",
        value: (row) => row.subscribers,
      },
      tiktok: {
        match: (row) => row.platform === "tiktok",
        value: (row) => row.subscribers,
      },
    }),
  );

  const leadsBySource = SALES_SOURCES.map((source) => ({
    label: source.label,
    value: sum(
      current.sales.filter((row) => row.source === source.value),
      (row) => row.leads,
    ),
  }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalAudience = kpi.social.followers + kpi.video.subscribers;
  const prevAudience = prev.social.followers + prev.video.subscribers;

  if (isEmpty) {
    return (
      <div className="space-y-5">
        <PageHeader title="Umumiy ko'rinish" />
        <NoData />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Umumiy ko'rinish"
        description="Barcha kanallar bo'yicha asosiy ko'rsatkichlar. Solishtirish — oldingi teng davr bilan."
      />

      {isRangeEmpty ? (
        <NoDataInRange />
      ) : (
        <>
          <HeroStat
            label="Umumiy daromad"
            value={usdCompact(kpi.sales.revenue)}
            delta={delta(kpi.sales.revenue, prev.sales.revenue)}
            caption="oldingi davrga nisbatan"
          >
            <dl className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
              <Mini label="Sof foyda" value={usd(kpi.profit)} />
              <Mini label="ROAS" value={ratio(kpi.roas)} />
              <Mini label="CAC" value={usdFine(kpi.cac)} />
            </dl>
          </HeroStat>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Reklama xarajati"
              value={usdCompact(kpi.ads.spend)}
              delta={delta(kpi.ads.spend, prev.ads.spend)}
              goodWhen="neutral"
            />
            <StatTile
              label="Lidlar"
              value={num(kpi.sales.leads)}
              delta={delta(kpi.sales.leads, prev.sales.leads)}
            />
            <StatTile
              label="Bitimlar"
              value={num(kpi.sales.deals)}
              delta={delta(kpi.sales.deals, prev.sales.deals)}
            />
            <StatTile
              label="Konversiya"
              value={pct(kpi.sales.conversion)}
              delta={delta(kpi.sales.conversion, prev.sales.conversion)}
              hint="lid → bitim"
            />
            <StatTile
              label="Lid narxi (CPL)"
              value={usdFine(kpi.ads.cpl)}
              delta={delta(kpi.ads.cpl, prev.ads.cpl)}
              goodWhen="down"
              hint="reklama lidlari"
            />
            <StatTile
              label="O'rtacha chek"
              value={usdFine(kpi.sales.avgCheck)}
              delta={delta(kpi.sales.avgCheck, prev.sales.avgCheck)}
            />
            <StatTile
              label="Jami auditoriya"
              value={compact(totalAudience)}
              delta={delta(totalAudience, prevAudience)}
              hint="4 ta kanal"
            />
            <StatTile
              label="Video ko'rishlar"
              value={compact(kpi.video.views)}
              delta={delta(kpi.video.views, prev.video.views)}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard<SeriesPoint>
              title="Daromad va reklama xarajati"
              subtitle="USD"
              legend={[
                { name: "Daromad", color: color("money", "revenue") },
                { name: "Reklama xarajati", color: color("money", "spend") },
              ]}
              table={{
                rows: money,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "revenue",
                    label: "Daromad",
                    align: "right",
                    render: (row) => usd(Number(row.revenue)),
                  },
                  {
                    key: "spend",
                    label: "Xarajat",
                    align: "right",
                    render: (row) => usd(Number(row.spend)),
                  },
                ],
              }}
            >
              <TrendChart
                data={money}
                format={(value) => usdCompact(value)}
                series={[
                  {
                    key: "revenue",
                    name: "Daromad",
                    color: color("money", "revenue"),
                  },
                  {
                    key: "spend",
                    name: "Reklama xarajati",
                    color: color("money", "spend"),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Lidlar va bitimlar"
              subtitle="soni"
              legend={[
                { name: "Lidlar", color: color("funnel", "leads") },
                { name: "Bitimlar", color: color("funnel", "deals") },
              ]}
              table={{
                rows: funnel,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "leads",
                    label: "Lidlar",
                    align: "right",
                    render: (row) => num(Number(row.leads)),
                  },
                  {
                    key: "deals",
                    label: "Bitimlar",
                    align: "right",
                    render: (row) => num(Number(row.deals)),
                  },
                ],
              }}
            >
              <ColumnChart
                data={funnel}
                series={[
                  {
                    key: "leads",
                    name: "Lidlar",
                    color: color("funnel", "leads"),
                  },
                  {
                    key: "deals",
                    name: "Bitimlar",
                    color: color("funnel", "deals"),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard<{ label: string; value: number }>
              title="Lidlar manba bo'yicha"
              subtitle="tanlangan davrdagi jami"
              table={{
                rows: leadsBySource,
                rowKey: (row) => row.label,
                columns: [
                  { key: "label", label: "Manba", render: (row) => row.label },
                  {
                    key: "value",
                    label: "Lidlar",
                    align: "right",
                    render: (row) => num(row.value),
                  },
                ],
              }}
            >
              <CategoryBarChart
                data={leadsBySource}
                format={(value) => num(value)}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Auditoriya o'sishi"
              subtitle="kanal obunachilari"
              legend={[
                { name: "Instagram", color: color("platform", "instagram") },
                { name: "Telegram", color: color("platform", "telegram") },
                { name: "YouTube", color: color("platform", "youtube") },
                { name: "TikTok", color: color("platform", "tiktok") },
              ]}
              table={{
                rows: audience,
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
                  {
                    key: "youtube",
                    label: "YouTube",
                    align: "right",
                    render: (row) => num(Number(row.youtube)),
                  },
                  {
                    key: "tiktok",
                    label: "TikTok",
                    align: "right",
                    render: (row) => num(Number(row.tiktok)),
                  },
                ],
              }}
            >
              <TrendChart
                data={audience}
                series={[
                  {
                    key: "instagram",
                    name: "Instagram",
                    color: color("platform", "instagram"),
                  },
                  {
                    key: "telegram",
                    name: "Telegram",
                    color: color("platform", "telegram"),
                  },
                  {
                    key: "youtube",
                    name: "YouTube",
                    color: color("platform", "youtube"),
                  },
                  {
                    key: "tiktok",
                    name: "TikTok",
                    color: color("platform", "tiktok"),
                  },
                ]}
              />
            </ChartCard>
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
