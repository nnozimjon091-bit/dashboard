"use client";

import { useState } from "react";
import { ChartCard } from "@/components/chart-card";
import { ColumnChart, TrendChart } from "@/components/charts";
import { NoData, NoDataInRange } from "@/components/no-data";
import { StatTile } from "@/components/stat-tile";
import { Card, cx, DataTable, PageHeader, SectionTitle } from "@/components/ui";
import { num, pct, ratio, usd, usdCompact } from "@/lib/format";
import {
  buildSeries,
  catalogKpis,
  delta,
  type SeriesPoint,
} from "@/lib/metrics";
import { seriesColor } from "@/lib/palette";
import { SERIES_ORDER } from "@/lib/series";
import { CATALOG_SOURCES, labelFor, type CatalogSource } from "@/lib/types";
import { useDashboard } from "@/lib/use-dashboard";

type Filter = "all" | CatalogSource;

export default function ClinicCatalogsPage() {
  const { current, previous, range, bucket, tokens, isEmpty, isRangeEmpty } =
    useDashboard();
  const [filter, setFilter] = useState<Filter>("all");

  const color = (key: string) => seriesColor(tokens, key, SERIES_ORDER.catalog);
  const showAll = filter === "all";

  const rows = showAll
    ? current.catalogs
    : current.catalogs.filter((row) => row.catalog === filter);
  const prevRows = showAll
    ? previous.catalogs
    : previous.catalogs.filter((row) => row.catalog === filter);

  const kpi = catalogKpis(rows);
  const prev = catalogKpis(prevRows);

  const leadsSeries = showAll
    ? buildSeries(current.catalogs, range, bucket, {
        clinics_uz: (row) => (row.catalog === "clinics_uz" ? row.leads : 0),
        med24: (row) => (row.catalog === "med24" ? row.leads : 0),
      })
    : buildSeries(rows, range, bucket, { leads: (row) => row.leads });

  const revenueSeries = showAll
    ? buildSeries(current.catalogs, range, bucket, {
        clinics_uz: (row) => (row.catalog === "clinics_uz" ? row.revenue : 0),
        med24: (row) => (row.catalog === "med24" ? row.revenue : 0),
      })
    : buildSeries(rows, range, bucket, { revenue: (row) => row.revenue });

  const byCatalog = CATALOG_SOURCES.map((source) => {
    const catalogRows = current.catalogs.filter(
      (row) => row.catalog === source.value,
    );
    return { catalog: source.label, ...catalogKpis(catalogRows) };
  });

  if (isEmpty) {
    return (
      <div className="space-y-5">
        <PageHeader title="Klinikalar katalogi" />
        <NoData />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Klinikalar katalogi"
        description="Clinics.uz va Med24 kataloglaridan kelgan lidlar."
      />

      <div
        role="group"
        aria-label="Katalogni tanlash"
        className="flex w-fit overflow-hidden rounded-lg border border-line bg-surface"
      >
        {(["all", "clinics_uz", "med24"] as Filter[]).map((value) => {
          const active = value === filter;
          const label =
            value === "all" ? "Barchasi" : labelFor(CATALOG_SOURCES, value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(value)}
              className={cx(
                "min-h-9 border-r border-line px-3 text-sm font-medium transition last:border-r-0",
                active
                  ? "bg-accent-soft text-ink"
                  : "text-ink-2 hover:bg-surface-2",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isRangeEmpty ? (
        <NoDataInRange />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              label="Daromad"
              value={usdCompact(kpi.revenue)}
              delta={delta(kpi.revenue, prev.revenue)}
            />
            <StatTile
              label="Xarajat"
              value={usdCompact(kpi.spend)}
              delta={delta(kpi.spend, prev.spend)}
              goodWhen="neutral"
              hint="Clinics.uz oylik to'lov + Med24 lid narxi"
            />
            <StatTile
              label="ROAS"
              value={ratio(kpi.roas)}
              delta={delta(kpi.roas, prev.roas)}
              hint="daromad / xarajat"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard<SeriesPoint>
              title="Lidlar dinamikasi"
              subtitle="soni"
              legend={
                showAll
                  ? [
                      { name: "Clinics.uz", color: color("clinics_uz") },
                      { name: "Med24", color: color("med24") },
                    ]
                  : undefined
              }
              table={{
                rows: leadsSeries,
                rowKey: (row) => String(row.key),
                columns: showAll
                  ? [
                      { key: "label", label: "Davr", render: (row) => row.label },
                      {
                        key: "clinics_uz",
                        label: "Clinics.uz",
                        align: "right",
                        render: (row) => num(Number(row.clinics_uz)),
                      },
                      {
                        key: "med24",
                        label: "Med24",
                        align: "right",
                        render: (row) => num(Number(row.med24)),
                      },
                    ]
                  : [
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
              {showAll ? (
                <ColumnChart
                  data={leadsSeries}
                  format={(value) => num(value)}
                  series={[
                    {
                      key: "clinics_uz",
                      name: "Clinics.uz",
                      color: color("clinics_uz"),
                    },
                    { key: "med24", name: "Med24", color: color("med24") },
                  ]}
                />
              ) : (
                <TrendChart
                  data={leadsSeries}
                  fill
                  format={(value) => num(value)}
                  series={[{ key: "leads", name: "Lidlar", color: tokens.series[0] }]}
                />
              )}
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Daromad dinamikasi"
              subtitle="USD"
              legend={
                showAll
                  ? [
                      { name: "Clinics.uz", color: color("clinics_uz") },
                      { name: "Med24", color: color("med24") },
                    ]
                  : undefined
              }
              table={{
                rows: revenueSeries,
                rowKey: (row) => String(row.key),
                columns: showAll
                  ? [
                      { key: "label", label: "Davr", render: (row) => row.label },
                      {
                        key: "clinics_uz",
                        label: "Clinics.uz",
                        align: "right",
                        render: (row) => usd(Number(row.clinics_uz)),
                      },
                      {
                        key: "med24",
                        label: "Med24",
                        align: "right",
                        render: (row) => usd(Number(row.med24)),
                      },
                    ]
                  : [
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
              {showAll ? (
                <ColumnChart
                  data={revenueSeries}
                  format={(value) => usdCompact(value)}
                  series={[
                    {
                      key: "clinics_uz",
                      name: "Clinics.uz",
                      color: color("clinics_uz"),
                    },
                    { key: "med24", name: "Med24", color: color("med24") },
                  ]}
                />
              ) : (
                <TrendChart
                  data={revenueSeries}
                  fill
                  format={(value) => usdCompact(value)}
                  series={[
                    { key: "revenue", name: "Daromad", color: tokens.series[0] },
                  ]}
                />
              )}
            </ChartCard>
          </div>

          {showAll ? (
            <Card>
              <SectionTitle
                title="Kataloglar kesimi"
                hint="tanlangan davr bo'yicha"
              />
              <DataTable
                rows={byCatalog}
                rowKey={(row) => row.catalog}
                columns={[
                  {
                    key: "catalog",
                    label: "Katalog",
                    render: (row) => row.catalog,
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
                  {
                    key: "revenue",
                    label: "Daromad",
                    align: "right",
                    render: (row) => usd(row.revenue),
                  },
                  {
                    key: "spend",
                    label: "Xarajat",
                    align: "right",
                    render: (row) => usd(row.spend),
                  },
                  {
                    key: "roas",
                    label: "ROAS",
                    align: "right",
                    render: (row) => ratio(row.roas),
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
