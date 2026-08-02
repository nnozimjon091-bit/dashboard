"use client";

import { useMemo } from "react";
import {
  pickBucket,
  previousRange,
  sliceData,
  type Bucket,
  type Range,
} from "./metrics";
import { useStore } from "./store";
import { useChartTokens } from "./theme";
import type { ChartTokens } from "./palette";
import type { DashboardData } from "./types";

export interface DashboardView {
  /** Butun ma'lumot (davr bilan cheklanmagan) */
  all: DashboardData;
  /** Tanlangan davrga tushgan yozuvlar */
  current: DashboardData;
  /** Solishtirish uchun oldingi teng davr */
  previous: DashboardData;
  range: Range;
  bucket: Bucket;
  tokens: ChartTokens;
  /** Umuman hech qanday yozuv yo'q */
  isEmpty: boolean;
  /** Yozuvlar bor, lekin tanlangan davrga tushmadi */
  isRangeEmpty: boolean;
}

const countRows = (data: DashboardData): number =>
  data.social.length +
  data.ads.length +
  data.video.length +
  data.sales.length +
  data.outbound.length +
  data.catalogs.length;

export function useDashboard(): DashboardView {
  const { data, range } = useStore();
  const tokens = useChartTokens();

  return useMemo(() => {
    const current = sliceData(data, range);
    const previous = sliceData(data, previousRange(range));
    return {
      all: data,
      current,
      previous,
      range,
      bucket: pickBucket(range),
      tokens,
      isEmpty: countRows(data) === 0,
      isRangeEmpty: countRows(current) === 0,
    };
  }, [data, range, tokens]);
}
