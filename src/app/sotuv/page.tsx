"use client";

import { ChartCard } from "@/components/chart-card";
import { CategoryBarChart, ColumnChart, TrendChart } from "@/components/charts";
import { NoData, NoDataInRange } from "@/components/no-data";
import { HeroStat, StatTile } from "@/components/stat-tile";
import { Card, DataTable, PageHeader, SectionTitle } from "@/components/ui";
import { num, pct, ratio, usd, usdCompact, usdFine } from "@/lib/format";
import {
  adsKpis,
  buildSeries,
  delta,
  outboundKpis,
  safeDiv,
  salesKpis,
  type SeriesPoint,
} from "@/lib/metrics";
import { seriesColor } from "@/lib/palette";
import { SERIES_ORDER } from "@/lib/series";
import { LEAD_DIRECTIONS, SALES_SOURCES } from "@/lib/types";
import { useDashboard } from "@/lib/use-dashboard";

export default function SalesPage() {
  const { current, previous, range, bucket, tokens, isEmpty, isRangeEmpty } =
    useDashboard();

  const kpi = salesKpis(current.sales);
  const prev = salesKpis(previous.sales);
  const ads = adsKpis(current.ads);
  const prevAds = adsKpis(previous.ads);

  const roas = safeDiv(kpi.revenue, ads.spend);
  const prevRoas = safeDiv(prev.revenue, prevAds.spend);
  const cac = safeDiv(ads.spend, kpi.deals);
  const prevCac = safeDiv(prevAds.spend, prev.deals);

  const color = (key: string) => seriesColor(tokens, key, SERIES_ORDER.funnel);

  const revenue = buildSeries(current.sales, range, bucket, {
    revenue: (row) => row.revenue,
  });

  const funnel = buildSeries(current.sales, range, bucket, {
    leads: (row) => row.leads,
    deals: (row) => row.deals,
  });

  const bySource = SALES_SOURCES.map((source) => {
    const rows = current.sales.filter((row) => row.source === source.value);
    return { source: source.label, ...salesKpis(rows) };
  }).filter((row) => row.leads > 0 || row.revenue > 0);

  const revenueBySource = bySource
    .map((row) => ({ label: row.source, value: row.revenue }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const outboundByDirection = LEAD_DIRECTIONS.map((direction) => {
    const rows = current.outbound.filter(
      (row) => row.direction === direction.value,
    );
    return { direction: direction.label, ...outboundKpis(rows) };
  }).filter((row) => row.leads > 0);

  const outboundLeadsByDirection = outboundByDirection
    .map((row) => ({ label: row.direction, value: row.leads }))
    .sort((a, b) => b.value - a.value);

  if (isEmpty) {
    return (
      <div className="space-y-5">
        <PageHeader title="Sotuv va lidlar" />
        <NoData />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sotuv va lidlar"
        description="Lidlardan bitimgacha bo'lgan yo'l va kanallarning daromadga hissasi."
      />

      {isRangeEmpty ? (
        <NoDataInRange />
      ) : (
        <>
          <HeroStat
            label="Daromad"
            value={usdCompact(kpi.revenue)}
            delta={delta(kpi.revenue, prev.revenue)}
            caption="oldingi davrga nisbatan"
          >
            <dl className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-ink-3">ROAS</dt>
                <dd className="mt-0.5 font-semibold">{ratio(roas)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Reklama xarajati</dt>
                <dd className="mt-0.5 font-semibold">{usd(ads.spend)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Sof foyda</dt>
                <dd className="mt-0.5 font-semibold">
                  {usd(kpi.revenue - ads.spend)}
                </dd>
              </div>
            </dl>
          </HeroStat>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Lidlar"
              value={num(kpi.leads)}
              delta={delta(kpi.leads, prev.leads)}
            />
            <StatTile
              label="Bitimlar"
              value={num(kpi.deals)}
              delta={delta(kpi.deals, prev.deals)}
            />
            <StatTile
              label="Konversiya"
              value={pct(kpi.conversion)}
              delta={delta(kpi.conversion, prev.conversion)}
              hint="lid → bitim"
            />
            <StatTile
              label="O'rtacha chek"
              value={usdFine(kpi.avgCheck)}
              delta={delta(kpi.avgCheck, prev.avgCheck)}
            />
            <StatTile
              label="ROAS"
              value={ratio(roas)}
              delta={delta(roas, prevRoas)}
              hint="daromad / reklama xarajati"
            />
            <StatTile
              label="Mijoz narxi (CAC)"
              value={usdFine(cac)}
              delta={delta(cac, prevCac)}
              goodWhen="down"
            />
            <StatTile
              label="Sof foyda"
              value={usdCompact(kpi.revenue - ads.spend)}
              delta={delta(
                kpi.revenue - ads.spend,
                prev.revenue - prevAds.spend,
              )}
            />
            <StatTile
              label="Faol kanallar"
              value={num(bySource.length)}
              hint="davr ichida lid bergan"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard<SeriesPoint>
              title="Daromad dinamikasi"
              subtitle="USD"
              table={{
                rows: revenue,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "revenue",
                    label: "Daromad",
                    align: "right",
                    render: (row) => usd(Number(row.revenue)),
                  },
                ],
              }}
            >
              <TrendChart
                data={revenue}
                fill
                format={(value) => usdCompact(value)}
                series={[
                  { key: "revenue", name: "Daromad", color: tokens.series[0] },
                ]}
              />
            </ChartCard>

            <ChartCard<{ label: string; value: number }>
              title="Kanallar bo'yicha daromad"
              subtitle="tanlangan davrdagi jami"
              table={{
                rows: revenueBySource,
                rowKey: (row) => row.label,
                columns: [
                  { key: "label", label: "Kanal", render: (row) => row.label },
                  {
                    key: "value",
                    label: "Daromad",
                    align: "right",
                    render: (row) => usd(row.value),
                  },
                ],
              }}
            >
              <CategoryBarChart
                data={revenueBySource}
                format={(value) => usdCompact(value)}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Lidlar va bitimlar"
              subtitle="soni"
              legend={[
                { name: "Lidlar", color: color("leads") },
                { name: "Bitimlar", color: color("deals") },
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
                format={(value) => num(value)}
                series={[
                  { key: "leads", name: "Lidlar", color: color("leads") },
                  { key: "deals", name: "Bitimlar", color: color("deals") },
                ]}
              />
            </ChartCard>

            <Card>
              <SectionTitle
                title="Kanallar kesimi"
                hint="tanlangan davr bo'yicha"
              />
              <DataTable
                rows={bySource}
                rowKey={(row) => row.source}
                columns={[
                  { key: "source", label: "Kanal", render: (row) => row.source },
                  {
                    key: "leads",
                    label: "Lid",
                    align: "right",
                    render: (row) => num(row.leads),
                  },
                  {
                    key: "deals",
                    label: "Bitim",
                    align: "right",
                    render: (row) => num(row.deals),
                  },
                  {
                    key: "conversion",
                    label: "Konversiya",
                    align: "right",
                    render: (row) => pct(row.conversion),
                  },
                  {
                    key: "revenue",
                    label: "Daromad",
                    align: "right",
                    render: (row) => usd(row.revenue),
                  },
                  {
                    key: "avgCheck",
                    label: "O'rt. chek",
                    align: "right",
                    render: (row) => usdFine(row.avgCheck),
                  },
                ]}
              />
            </Card>

            <ChartCard<{ label: string; value: number }>
              title="Chiquvchi lidlar — yo'nalish bo'yicha"
              subtitle="tanlangan davrdagi jami"
              table={{
                rows: outboundLeadsByDirection,
                rowKey: (row) => row.label,
                columns: [
                  {
                    key: "label",
                    label: "Yo'nalish",
                    render: (row) => row.label,
                  },
                  {
                    key: "value",
                    label: "Lid",
                    align: "right",
                    render: (row) => num(row.value),
                  },
                ],
              }}
            >
              <CategoryBarChart
                data={outboundLeadsByDirection}
                format={(value) => num(value)}
              />
            </ChartCard>

            <Card>
              <SectionTitle
                title="Chiquvchi — yo'nalish kesimi"
                hint="tanlangan davr bo'yicha"
              />
              <DataTable
                rows={outboundByDirection}
                rowKey={(row) => row.direction}
                columns={[
                  {
                    key: "direction",
                    label: "Yo'nalish",
                    render: (row) => row.direction,
                  },
                  {
                    key: "leads",
                    label: "Lid",
                    align: "right",
                    render: (row) => num(row.leads),
                  },
                  {
                    key: "deals",
                    label: "Bitim",
                    align: "right",
                    render: (row) => num(row.deals),
                  },
                  {
                    key: "conversion",
                    label: "Konversiya",
                    align: "right",
                    render: (row) => pct(row.conversion),
                  },
                ]}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
