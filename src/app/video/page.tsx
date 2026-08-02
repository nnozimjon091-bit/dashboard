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
  safeDiv,
  videoKpis,
  type SeriesPoint,
} from "@/lib/metrics";
import { seriesColor } from "@/lib/palette";
import { SERIES_ORDER } from "@/lib/series";
import { VIDEO_PLATFORMS } from "@/lib/types";
import { useDashboard } from "@/lib/use-dashboard";

export default function VideoPage() {
  const { current, previous, range, bucket, tokens, isEmpty, isRangeEmpty } =
    useDashboard();

  const kpi = videoKpis(current.video);
  const prev = videoKpis(previous.video);

  const color = (key: string) =>
    seriesColor(tokens, key, SERIES_ORDER.platform);

  const views = buildSeries(current.video, range, bucket, {
    youtube: (row) => (row.platform === "youtube" ? row.views : 0),
    tiktok: (row) => (row.platform === "tiktok" ? row.views : 0),
  });

  const subscribers = buildStockSeries(current.video, range, bucket, {
    youtube: {
      match: (row) => row.platform === "youtube",
      value: (row) => row.subscribers,
    },
    tiktok: {
      match: (row) => row.platform === "tiktok",
      value: (row) => row.subscribers,
    },
  });

  const watchHours = buildSeries(current.video, range, bucket, {
    youtube: (row) => (row.platform === "youtube" ? row.watchHours : 0),
    tiktok: (row) => (row.platform === "tiktok" ? row.watchHours : 0),
  });

  const byPlatform = VIDEO_PLATFORMS.map((platform) => {
    const rows = current.video.filter((row) => row.platform === platform.value);
    return { platform: platform.label, ...videoKpis(rows) };
  });

  const ytKpi = videoKpis(current.video.filter((row) => row.platform === "youtube"));
  const prevYtKpi = videoKpis(
    previous.video.filter((row) => row.platform === "youtube"),
  );

  if (isEmpty) {
    return (
      <div className="space-y-5">
        <PageHeader title="Video" />
        <NoData />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Video"
        description="YouTube va TikTok: ko'rishlar, obunachilar va ko'rish vaqti."
      />

      {isRangeEmpty ? (
        <NoDataInRange />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Ko'rishlar"
              value={compact(kpi.views)}
              delta={delta(kpi.views, prev.views)}
            />
            <StatTile
              label="Obunachilar"
              value={compact(kpi.subscribers)}
              delta={delta(kpi.subscribers, prev.subscribers)}
              hint="davr oxiriga"
            />
            <StatTile
              label="Davr ichidagi o'sish"
              value={
                (kpi.subscriberGrowth >= 0 ? "+" : "") + num(kpi.subscriberGrowth)
              }
              delta={delta(kpi.subscriberGrowth, prev.subscriberGrowth)}
            />
            <StatTile
              label="Ko'rish soatlari"
              value={compact(kpi.watchHours)}
              delta={delta(kpi.watchHours, prev.watchHours)}
            />
            <StatTile
              label="Likelar"
              value={compact(kpi.likes)}
              delta={delta(kpi.likes, prev.likes)}
            />
            <StatTile
              label="O'rtacha ko'rish"
              value={
                Number.isFinite(kpi.avgViewMinutes)
                  ? `${num(kpi.avgViewMinutes, 1)} daq`
                  : "—"
              }
              delta={delta(kpi.avgViewMinutes, prev.avgViewMinutes)}
            />
            <StatTile
              label="Like ulushi"
              value={pct(safeDiv(kpi.likes, kpi.views), 2)}
              delta={delta(
                safeDiv(kpi.likes, kpi.views),
                safeDiv(prev.likes, prev.views),
              )}
              hint="like / ko'rish"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard<SeriesPoint>
              title="Ko'rishlar"
              subtitle="kanal kesimida"
              legend={[
                { name: "YouTube", color: color("youtube") },
                { name: "TikTok", color: color("tiktok") },
              ]}
              table={{
                rows: views,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
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
                data={views}
                series={[
                  { key: "youtube", name: "YouTube", color: color("youtube") },
                  { key: "tiktok", name: "TikTok", color: color("tiktok") },
                ]}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Obunachilar"
              subtitle="davr oxiridagi holat"
              legend={[
                { name: "YouTube", color: color("youtube") },
                { name: "TikTok", color: color("tiktok") },
              ]}
              table={{
                rows: subscribers,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
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
                data={subscribers}
                series={[
                  { key: "youtube", name: "YouTube", color: color("youtube") },
                  { key: "tiktok", name: "TikTok", color: color("tiktok") },
                ]}
              />
            </ChartCard>

            <ChartCard<SeriesPoint>
              title="Ko'rish soatlari"
              subtitle="soat"
              legend={[
                { name: "YouTube", color: color("youtube") },
                { name: "TikTok", color: color("tiktok") },
              ]}
              table={{
                rows: watchHours,
                rowKey: (row) => String(row.key),
                columns: [
                  { key: "label", label: "Davr", render: (row) => row.label },
                  {
                    key: "youtube",
                    label: "YouTube",
                    align: "right",
                    render: (row) => num(Number(row.youtube), 1),
                  },
                  {
                    key: "tiktok",
                    label: "TikTok",
                    align: "right",
                    render: (row) => num(Number(row.tiktok), 1),
                  },
                ],
              }}
            >
              <ColumnChart
                data={watchHours}
                series={[
                  { key: "youtube", name: "YouTube", color: color("youtube") },
                  { key: "tiktok", name: "TikTok", color: color("tiktok") },
                ]}
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
                    key: "views",
                    label: "Ko'rish",
                    align: "right",
                    render: (row) => num(row.views),
                  },
                  {
                    key: "subscribers",
                    label: "Obunachi",
                    align: "right",
                    render: (row) => num(row.subscribers),
                  },
                  {
                    key: "growth",
                    label: "O'sish",
                    align: "right",
                    render: (row) =>
                      (row.subscriberGrowth >= 0 ? "+" : "") +
                      num(row.subscriberGrowth),
                  },
                  {
                    key: "watchHours",
                    label: "Soat",
                    align: "right",
                    render: (row) => num(row.watchHours, 1),
                  },
                  {
                    key: "likes",
                    label: "Like",
                    align: "right",
                    render: (row) => num(row.likes),
                  },
                  {
                    key: "videos",
                    label: "Video",
                    align: "right",
                    render: (row) => num(row.videos),
                  },
                  {
                    key: "shorts",
                    label: "Shorts",
                    align: "right",
                    render: (row) => num(row.shorts),
                  },
                ]}
              />
            </Card>
          </div>

          <section>
            <SectionTitle
              title="YouTube"
              hint="videolar, shorts, ko'rishlar va obunachilar o'sishi"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label="Videolar soni"
                value={num(ytKpi.videos)}
                delta={delta(ytKpi.videos, prevYtKpi.videos)}
              />
              <StatTile
                label="Shorts soni"
                value={num(ytKpi.shorts)}
                delta={delta(ytKpi.shorts, prevYtKpi.shorts)}
              />
              <StatTile
                label="Ko'rishlar"
                value={compact(ytKpi.views)}
                delta={delta(ytKpi.views, prevYtKpi.views)}
              />
              <StatTile
                label="Yangi obunachilar"
                value={
                  (ytKpi.subscriberGrowth >= 0 ? "+" : "") +
                  num(ytKpi.subscriberGrowth)
                }
                delta={delta(ytKpi.subscriberGrowth, prevYtKpi.subscriberGrowth)}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
