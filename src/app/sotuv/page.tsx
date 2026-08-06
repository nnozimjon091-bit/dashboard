"use client";

import { ChartCard } from "@/components/chart-card";
import { CategoryBarChart, ColumnChart, TrendChart } from "@/components/charts";
import { NoData, NoDataInRange } from "@/components/no-data";
import { HeroStat, StatTile } from "@/components/stat-tile";
import { Card, DataTable, PageHeader, SectionTitle } from "@/components/ui";
import { num, pct, ratio, som, somCompact, usd, usdFine } from "@/lib/format";
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
  const outbound = outboundKpis(current.outbound);
  const prevOutbound = outboundKpis(previous.outbound);

  // Chiquvchi operator ham sotuv natijasi (lid/bitim/daromad) beradi —
  // shuning uchun sahifaning umumiy ko'rsatkichlariga qo'shiladi, xuddi
  // Umumiy ko'rinishdagi kabi (kpi.totalRevenue va h.k.).
  const totalRevenue = kpi.revenue + outbound.revenue;
  const totalLeads = kpi.leads + outbound.leads;
  const totalDeals = kpi.deals + outbound.deals;
  const totalConversion = safeDiv(totalDeals, totalLeads);
  const totalAvgCheck = safeDiv(totalRevenue, totalDeals);

  const prevTotalRevenue = prev.revenue + prevOutbound.revenue;
  const prevTotalLeads = prev.leads + prevOutbound.leads;
  const prevTotalDeals = prev.deals + prevOutbound.deals;
  const prevTotalConversion = safeDiv(prevTotalDeals, prevTotalLeads);
  const prevTotalAvgCheck = safeDiv(prevTotalRevenue, prevTotalDeals);

  const roas = safeDiv(totalRevenue, ads.spend);
  const prevRoas = safeDiv(prevTotalRevenue, prevAds.spend);
  const cac = safeDiv(ads.spend, totalDeals);
  const prevCac = safeDiv(prevAds.spend, prevTotalDeals);

  const color = (key: string) => seriesColor(tokens, key, SERIES_ORDER.funnel);

  const salesRevenue = buildSeries(current.sales, range, bucket, {
    revenue: (row) => row.revenue,
  });
  const outboundRevenue = buildSeries(current.outbound, range, bucket, {
    revenue: (row) => row.revenue,
  });
  const revenue: SeriesPoint[] = salesRevenue.map((point, index) => ({
    key: point.key,
    label: point.label,
    revenue: Number(point.revenue) + Number(outboundRevenue[index].revenue),
  }));

  const salesFunnel = buildSeries(current.sales, range, bucket, {
    leads: (row) => row.leads,
    deals: (row) => row.deals,
  });
  const outboundFunnel = buildSeries(current.outbound, range, bucket, {
    leads: (row) => row.leads,
    deals: (row) => row.deals,
  });
  const funnel: SeriesPoint[] = salesFunnel.map((point, index) => ({
    key: point.key,
    label: point.label,
    leads: Number(point.leads) + Number(outboundFunnel[index].leads),
    deals: Number(point.deals) + Number(outboundFunnel[index].deals),
  }));

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
            value={somCompact(totalRevenue)}
            delta={delta(totalRevenue, prevTotalRevenue)}
            caption="oldingi davrga nisbatan · sotuv + chiquvchi operator"
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
                  {som(totalRevenue - ads.spend)}
                </dd>
              </div>
            </dl>
          </HeroStat>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Lidlar"
              value={num(totalLeads)}
              delta={delta(totalLeads, prevTotalLeads)}
            />
            <StatTile
              label="Bitimlar"
              value={num(totalDeals)}
              delta={delta(totalDeals, prevTotalDeals)}
            />
            <StatTile
              label="Konversiya"
              value={pct(totalConversion)}
              delta={delta(totalConversion, prevTotalConversion)}
              hint="lid → bitim"
            />
            <StatTile
              label="O'rtacha chek"
              value={som(totalAvgCheck)}
              delta={delta(totalAvgCheck, prevTotalAvgCheck)}
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
              value={somCompact(totalRevenue - ads.spend)}
              delta={delta(
                totalRevenue - ads.spend,
                prevTotalRevenue - prevAds.spend,
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
              subtitle="so'm"
              table={{
                rows: revenue,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "revenue",
                    label: "Daromad",
                    align: "right",
                    render: (row) => som(Number(row.revenue)),
                  },
                ],
              }}
            >
              <TrendChart
                data={revenue}
                fill
                format={(value) => somCompact(value)}
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
                    render: (row) => som(row.value),
                  },
                ],
              }}
            >
              <CategoryBarChart
                data={revenueBySource}
                format={(value) => somCompact(value)}
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
                    render: (row) => som(row.revenue),
                  },
                  {
                    key: "avgCheck",
                    label: "O'rt. chek",
                    align: "right",
                    render: (row) => som(row.avgCheck),
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
