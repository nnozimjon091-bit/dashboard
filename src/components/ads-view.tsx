"use client";

import type { ReactNode } from "react";

import { ChartCard } from "@/components/chart-card";
import { CategoryBarChart, ColumnChart, TrendChart } from "@/components/charts";
import { NoData, NoDataInRange } from "@/components/no-data";
import { StatTile } from "@/components/stat-tile";
import { Card, DataTable, PageHeader, SectionTitle } from "@/components/ui";
import { compact, num, pct, ratio, usd, usdCompact, usdFine } from "@/lib/format";
import {
  adsKpis,
  buildSeries,
  delta,
  outboundKpis,
  safeDiv,
  type SeriesPoint,
} from "@/lib/metrics";
import {
  ADS_PLATFORMS,
  labelFor,
  LEAD_DIRECTIONS,
  type AdEntry,
  type AdsPlatform,
} from "@/lib/types";
import { useDashboard } from "@/lib/use-dashboard";

interface CampaignRow {
  key: string;
  campaign: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

function groupByCampaign(rows: AdEntry[]): CampaignRow[] {
  const grouped = new Map<string, CampaignRow>();
  rows.forEach((row) => {
    const key = `${row.platform}|${row.campaign}`;
    const entry = grouped.get(key) ?? {
      key,
      campaign: row.campaign,
      platform: labelFor(ADS_PLATFORMS, row.platform),
      spend: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
    };
    entry.spend += row.spend;
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    entry.leads += row.leads;
    grouped.set(key, entry);
  });
  return [...grouped.values()].sort((a, b) => b.spend - a.spend);
}

/**
 * Reklama ko'rinishi. `platform` berilsa faqat shu platformaning yozuvlari
 * olinadi — Meta Ads sahifasi shu tariqa hosil bo'ladi.
 */
export function AdsView({
  platform,
  title,
  description,
  toolbar,
}: {
  platform?: AdsPlatform;
  title: string;
  description: string;
  /** Sarlavha ostiga qo'yiladigan qo'shimcha blok (masalan hisobot yuklash). */
  toolbar?: ReactNode;
}) {
  const { current, previous, range, bucket, tokens, isEmpty, isRangeEmpty } =
    useDashboard();

  const ads = platform
    ? current.ads.filter((row) => row.platform === platform)
    : current.ads;
  const prevAds = platform
    ? previous.ads.filter((row) => row.platform === platform)
    : previous.ads;

  const kpi = adsKpis(ads);
  const prev = adsKpis(prevAds);
  const accent = tokens.series[0];

  const spendSeries = buildSeries(ads, range, bucket, {
    spend: (row) => row.spend,
  });

  const leadsSeries = buildSeries(ads, range, bucket, {
    leads: (row) => row.leads,
  });

  // Xarajat (USD) va lidlar (dona) — o'lchov birligi har xil,
  // shuning uchun ikkinchi o'q emas, ikkita alohida grafik.
  const cplSeries = buildSeries(ads, range, bucket, {
    spend: (row) => row.spend,
    leads: (row) => row.leads,
  }).map((point) => ({
    ...point,
    cpl: Number(point.leads) ? Number(point.spend) / Number(point.leads) : 0,
  }));

  const spendByPlatform = ADS_PLATFORMS.map((entry) => ({
    label: entry.label,
    value: ads
      .filter((row) => row.platform === entry.value)
      .reduce((total, row) => total + row.spend, 0),
  }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const campaigns = groupByCampaign(ads);

  // Meta Ads'da lead yo'nalishi (Urolog, Dermatolog va h.k.) bo'yicha
  // chiquvchi operator ROMI hisobi — faqat Meta sahifasida ko'rinadi.
  const romiByDirection =
    platform === "meta"
      ? LEAD_DIRECTIONS.map((direction) => {
          const metaRows = ads.filter(
            (row) => row.direction === direction.value,
          );
          const metaSpend = metaRows.reduce(
            (total, row) => total + row.spend,
            0,
          );
          const metaLeads = metaRows.reduce(
            (total, row) => total + row.leads,
            0,
          );
          const out = outboundKpis(
            current.outbound.filter(
              (row) => row.direction === direction.value,
            ),
          );
          return {
            direction: direction.label,
            metaSpend,
            metaLeads,
            outboundDeals: out.deals,
            outboundRevenue: out.revenue,
            romi: safeDiv(out.revenue, metaSpend),
          };
        }).filter((row) => row.metaSpend > 0 || row.outboundDeals > 0)
      : [];

  const romiChart = romiByDirection
    .map((row) => ({ label: row.direction, value: row.romi }))
    .sort((a, b) => b.value - a.value);

  if (isEmpty) {
    return (
      <div className="space-y-5">
        <PageHeader title={title} />
        {toolbar}
        <NoData />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />

      {toolbar}

      {isRangeEmpty ? (
        <NoDataInRange />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Xarajat"
              value={usdCompact(kpi.spend)}
              delta={delta(kpi.spend, prev.spend)}
              goodWhen="neutral"
            />
            <StatTile
              label="Lidlar"
              value={num(kpi.leads)}
              delta={delta(kpi.leads, prev.leads)}
            />
            <StatTile
              label="Lid narxi (CPL)"
              value={usdFine(kpi.cpl)}
              delta={delta(kpi.cpl, prev.cpl)}
              goodWhen="down"
            />
            <StatTile
              label="CTR"
              value={pct(kpi.ctr, 2)}
              delta={delta(kpi.ctr, prev.ctr)}
              hint="klik / ko'rsatish"
            />
            <StatTile
              label="Ko'rsatishlar"
              value={compact(kpi.impressions)}
              delta={delta(kpi.impressions, prev.impressions)}
            />
            <StatTile
              label="Kliklar"
              value={compact(kpi.clicks)}
              delta={delta(kpi.clicks, prev.clicks)}
            />
            <StatTile
              label="Klik narxi (CPC)"
              value={usdFine(kpi.cpc)}
              delta={delta(kpi.cpc, prev.cpc)}
              goodWhen="down"
            />
            <StatTile
              label="CPM"
              value={usdFine(kpi.cpm)}
              delta={delta(kpi.cpm, prev.cpm)}
              goodWhen="down"
              hint="1000 ko'rsatish narxi"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard<SeriesPoint>
              title="Reklama xarajati"
              subtitle="USD"
              table={{
                rows: spendSeries,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
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
                data={spendSeries}
                fill
                format={(value) => usdCompact(value)}
                series={[{ key: "spend", name: "Xarajat", color: accent }]}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Reklamadan kelgan lidlar"
              subtitle="soni"
              table={{
                rows: leadsSeries,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "leads",
                    label: "Lidlar",
                    align: "right",
                    render: (row) => num(Number(row.leads)),
                  },
                ],
              }}
            >
              <ColumnChart
                data={leadsSeries}
                format={(value) => num(value)}
                series={[{ key: "leads", name: "Lidlar", color: accent }]}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Lid narxi (CPL) dinamikasi"
              subtitle="pastga tushgani yaxshi"
              table={{
                rows: cplSeries,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "cpl",
                    label: "CPL",
                    align: "right",
                    render: (row) => usdFine(Number(row.cpl)),
                  },
                  {
                    key: "spend",
                    label: "Xarajat",
                    align: "right",
                    render: (row) => usd(Number(row.spend)),
                  },
                  {
                    key: "leads",
                    label: "Lidlar",
                    align: "right",
                    render: (row) => num(Number(row.leads)),
                  },
                ],
              }}
            >
              <TrendChart
                data={cplSeries}
                fill
                format={(value) => usdFine(value)}
                series={[{ key: "cpl", name: "CPL", color: accent }]}
              />
            </ChartCard>

            {platform ? null : (
            <ChartCard<{ label: string; value: number }>
              title="Platformalar bo'yicha xarajat"
              subtitle="tanlangan davrdagi jami"
              table={{
                rows: spendByPlatform,
                rowKey: (row) => row.label,
                columns: [
                  {
                    key: "label",
                    label: "Platforma",
                    render: (row) => row.label,
                  },
                  {
                    key: "value",
                    label: "Xarajat",
                    align: "right",
                    render: (row) => usd(row.value),
                  },
                ],
              }}
            >
              <CategoryBarChart
                data={spendByPlatform}
                format={(value) => usdCompact(value)}
              />
            </ChartCard>
            )}

            {platform === "meta" ? (
            <ChartCard<{ label: string; value: number }>
              title="ROMI — yo'nalish bo'yicha"
              subtitle="chiquvchi operator daromadi / Meta xarajat"
              table={{
                rows: romiChart,
                rowKey: (row) => row.label,
                columns: [
                  {
                    key: "label",
                    label: "Yo'nalish",
                    render: (row) => row.label,
                  },
                  {
                    key: "value",
                    label: "ROMI",
                    align: "right",
                    render: (row) => ratio(row.value),
                  },
                ],
              }}
            >
              <CategoryBarChart
                data={romiChart}
                format={(value) => ratio(value)}
              />
            </ChartCard>
            ) : null}
          </div>

          <Card>
            <SectionTitle
              title="Kampaniyalar"
              hint="xarajat bo'yicha kamayish tartibida"
            />
            <DataTable
              rows={campaigns}
              rowKey={(row) => row.key}
              columns={[
                {
                  key: "campaign",
                  label: "Kampaniya",
                  render: (row) => row.campaign,
                },
                {
                  key: "platform",
                  label: "Platforma",
                  render: (row) => row.platform,
                },
                {
                  key: "spend",
                  label: "Xarajat",
                  align: "right",
                  render: (row) => usd(row.spend),
                },
                {
                  key: "impressions",
                  label: "Ko'rsatish",
                  align: "right",
                  render: (row) => num(row.impressions),
                },
                {
                  key: "clicks",
                  label: "Klik",
                  align: "right",
                  render: (row) => num(row.clicks),
                },
                {
                  key: "ctr",
                  label: "CTR",
                  align: "right",
                  render: (row) => pct(safeDiv(row.clicks, row.impressions), 2),
                },
                {
                  key: "leads",
                  label: "Lid",
                  align: "right",
                  render: (row) => num(row.leads),
                },
                {
                  key: "cpl",
                  label: "CPL",
                  align: "right",
                  render: (row) => usdFine(safeDiv(row.spend, row.leads)),
                },
              ]}
            />
          </Card>

          {platform === "meta" ? (
          <Card>
            <SectionTitle
              title="Yo'nalish bo'yicha ROMI — batafsil"
              hint="Meta xarajat va chiquvchi operator natijasi"
            />
            <DataTable
              rows={romiByDirection}
              rowKey={(row) => row.direction}
              columns={[
                {
                  key: "direction",
                  label: "Yo'nalish",
                  render: (row) => row.direction,
                },
                {
                  key: "metaSpend",
                  label: "Meta xarajat",
                  align: "right",
                  render: (row) => usd(row.metaSpend, 2),
                },
                {
                  key: "metaLeads",
                  label: "Meta lid",
                  align: "right",
                  render: (row) => num(row.metaLeads),
                },
                {
                  key: "outboundDeals",
                  label: "Bitim",
                  align: "right",
                  render: (row) => num(row.outboundDeals),
                },
                {
                  key: "outboundRevenue",
                  label: "Daromad",
                  align: "right",
                  render: (row) => usd(row.outboundRevenue, 2),
                },
                {
                  key: "romi",
                  label: "ROMI",
                  align: "right",
                  render: (row) => ratio(row.romi),
                },
              ]}
            />
          </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
