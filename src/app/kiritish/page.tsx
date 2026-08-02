"use client";

import { useState } from "react";
import {
  EntryPanel,
  toNumber,
  type DatasetConfig,
} from "@/components/entry-panel";
import { Card, cx, PageHeader } from "@/components/ui";
import { num, pct, shortDate, usd } from "@/lib/format";
import { safeDiv } from "@/lib/metrics";
import {
  ADS_PLATFORMS,
  CATALOG_SOURCES,
  labelFor,
  MED24_COST_PER_LEAD,
  normalizeToKnown,
  SALES_SOURCES,
  SOCIAL_PLATFORMS,
  VIDEO_PLATFORMS,
  type AdsPlatform,
  type CatalogSource,
  type SalesSource,
  type SocialPlatform,
  type VideoPlatform,
} from "@/lib/types";

const SOCIAL_CONFIG: DatasetConfig<"social"> = {
  dataset: "social",
  title: "Ijtimoiy tarmoq ko'rsatkichi",
  hint: "Har kun uchun har bir platformadan bittadan yozuv.",
  fields: [
    { name: "date", label: "Sana", type: "date" },
    {
      name: "platform",
      label: "Platforma",
      type: "select",
      options: SOCIAL_PLATFORMS,
    },
    {
      name: "followers",
      label: "Obunachilar",
      type: "number",
      hint: "Kun oxiridagi umumiy soni",
    },
    { name: "reach", label: "Qamrov", type: "number", hint: "Shu kunlik" },
    {
      name: "engagement",
      label: "Faollik",
      type: "number",
      hint: "Like + izoh + saqlash + ulashish",
    },
    { name: "posts", label: "Postlar soni", type: "number" },
  ],
  defaults: {
    platform: "instagram",
    followers: "",
    reach: "",
    engagement: "",
    posts: "",
  },
  toEntry: (values) => ({
    date: values.date,
    platform: values.platform as SocialPlatform,
    followers: toNumber(values.followers),
    reach: toNumber(values.reach),
    engagement: toNumber(values.engagement),
    posts: toNumber(values.posts),
  }),
  toValues: (row) => ({
    date: row.date,
    platform: row.platform,
    followers: String(row.followers),
    reach: String(row.reach),
    engagement: String(row.engagement),
    posts: String(row.posts),
  }),
  isSame: (row, values) =>
    row.date === values.date && row.platform === values.platform,
  columns: [
    { key: "date", label: "Sana", render: (row) => shortDate(row.date) },
    {
      key: "platform",
      label: "Platforma",
      render: (row) => labelFor(SOCIAL_PLATFORMS, row.platform),
    },
    {
      key: "followers",
      label: "Obunachi",
      align: "right",
      render: (row) => num(row.followers),
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
      key: "posts",
      label: "Post",
      align: "right",
      render: (row) => num(row.posts),
    },
  ],
};

const ADS_CONFIG: DatasetConfig<"ads"> = {
  dataset: "ads",
  title: "Reklama kampaniyasi",
  hint: "Har kun uchun har bir kampaniyadan bittadan yozuv.",
  fields: [
    { name: "date", label: "Sana", type: "date" },
    {
      name: "platform",
      label: "Platforma",
      type: "select",
      options: ADS_PLATFORMS,
    },
    {
      name: "campaign",
      label: "Kampaniya nomi",
      type: "text",
      placeholder: "Masalan: Yozgi aksiya",
    },
    {
      name: "spend",
      label: "Xarajat (USD)",
      type: "number",
      step: "0.01",
      hint: "Shu kunlik sarf",
    },
    { name: "impressions", label: "Ko'rsatishlar", type: "number" },
    { name: "clicks", label: "Kliklar", type: "number" },
    {
      name: "leads",
      label: "Lidlar",
      type: "number",
      hint: "Reklamadan kelgan murojaatlar",
    },
  ],
  defaults: {
    platform: "meta",
    campaign: "",
    spend: "",
    impressions: "",
    clicks: "",
    leads: "",
  },
  toEntry: (values) => ({
    date: values.date,
    platform: values.platform as AdsPlatform,
    campaign: values.campaign.trim() || "Nomsiz kampaniya",
    spend: toNumber(values.spend),
    impressions: toNumber(values.impressions),
    clicks: toNumber(values.clicks),
    leads: toNumber(values.leads),
  }),
  toValues: (row) => ({
    date: row.date,
    platform: row.platform,
    campaign: row.campaign,
    spend: String(row.spend),
    impressions: String(row.impressions),
    clicks: String(row.clicks),
    leads: String(row.leads),
  }),
  isSame: (row, values) =>
    row.date === values.date &&
    row.platform === values.platform &&
    row.campaign.trim().toLowerCase() ===
      (values.campaign.trim() || "Nomsiz kampaniya").toLowerCase(),
  columns: [
    { key: "date", label: "Sana", render: (row) => shortDate(row.date) },
    { key: "campaign", label: "Kampaniya", render: (row) => row.campaign },
    {
      key: "platform",
      label: "Platforma",
      render: (row) => labelFor(ADS_PLATFORMS, row.platform),
    },
    {
      key: "spend",
      label: "Xarajat",
      align: "right",
      render: (row) => usd(row.spend, 2),
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
      key: "leads",
      label: "Lid",
      align: "right",
      render: (row) => num(row.leads),
    },
  ],
};

const VIDEO_CONFIG: DatasetConfig<"video"> = {
  dataset: "video",
  title: "Video ko'rsatkichi",
  hint: "YouTube va TikTok uchun kunlik yakuniy raqamlar.",
  fields: [
    { name: "date", label: "Sana", type: "date" },
    {
      name: "platform",
      label: "Platforma",
      type: "select",
      options: VIDEO_PLATFORMS,
    },
    { name: "views", label: "Ko'rishlar", type: "number", hint: "Shu kunlik" },
    {
      name: "subscribers",
      label: "Obunachilar",
      type: "number",
      hint: "Kun oxiridagi umumiy soni",
    },
    {
      name: "watchHours",
      label: "Ko'rish soatlari",
      type: "number",
      step: "0.1",
    },
    { name: "likes", label: "Likelar", type: "number" },
  ],
  defaults: {
    platform: "youtube",
    views: "",
    subscribers: "",
    watchHours: "",
    likes: "",
  },
  toEntry: (values) => ({
    date: values.date,
    platform: values.platform as VideoPlatform,
    views: toNumber(values.views),
    subscribers: toNumber(values.subscribers),
    watchHours: toNumber(values.watchHours),
    likes: toNumber(values.likes),
  }),
  toValues: (row) => ({
    date: row.date,
    platform: row.platform,
    views: String(row.views),
    subscribers: String(row.subscribers),
    watchHours: String(row.watchHours),
    likes: String(row.likes),
  }),
  isSame: (row, values) =>
    row.date === values.date && row.platform === values.platform,
  columns: [
    { key: "date", label: "Sana", render: (row) => shortDate(row.date) },
    {
      key: "platform",
      label: "Platforma",
      render: (row) => labelFor(VIDEO_PLATFORMS, row.platform),
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
  ],
};

const SALES_CONFIG: DatasetConfig<"sales"> = {
  dataset: "sales",
  title: "Sotuv va lidlar",
  hint: "Kanal kesimida kunlik lid, bitim va daromad.",
  fields: [
    { name: "date", label: "Sana", type: "date" },
    { name: "source", label: "Kanal", type: "select", options: SALES_SOURCES },
    {
      name: "leads",
      label: "Lidlar",
      type: "number",
      hint: "Shu kanaldan kelgan murojaatlar",
    },
    {
      name: "deals",
      label: "Bitimlar",
      type: "number",
      hint: "Yopilgan sotuvlar",
    },
    { name: "revenue", label: "Daromad (USD)", type: "number", step: "0.01" },
  ],
  defaults: { source: "instagram", leads: "", deals: "", revenue: "" },
  toEntry: (values) => ({
    date: values.date,
    source: values.source as SalesSource,
    leads: toNumber(values.leads),
    deals: toNumber(values.deals),
    revenue: toNumber(values.revenue),
  }),
  toValues: (row) => ({
    date: row.date,
    source: row.source,
    leads: String(row.leads),
    deals: String(row.deals),
    revenue: String(row.revenue),
  }),
  isSame: (row, values) =>
    row.date === values.date && row.source === values.source,
  columns: [
    { key: "date", label: "Sana", render: (row) => shortDate(row.date) },
    {
      key: "source",
      label: "Kanal",
      render: (row) => labelFor(SALES_SOURCES, row.source),
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
      key: "revenue",
      label: "Daromad",
      align: "right",
      render: (row) => usd(row.revenue, 2),
    },
  ],
};

const INBOUND_CONFIG: DatasetConfig<"inbound"> = {
  dataset: "inbound",
  title: "Kiruvchi qo'ng'iroqlar",
  hint: "Asosiy raqamga kelgan qo'ng'iroqlar, kanal kesimida.",
  fields: [
    { name: "date", label: "Sana", type: "date" },
    {
      name: "source",
      label: "Kanal",
      type: "text",
      placeholder: "Instagram",
      suggestions: SALES_SOURCES,
    },
    {
      name: "calls",
      label: "Qo'ng'iroqlar",
      type: "number",
      hint: "Shu kanaldan kelgan jami qo'ng'iroqlar",
    },
    {
      name: "answered",
      label: "Javob berilgan",
      type: "number",
      hint: "Ko'tarilgani. Qolgani o'tkazib yuborilgan deb hisoblanadi",
    },
    {
      name: "deals",
      label: "Sotuvlar",
      type: "number",
      hint: "Shu qo'ng'iroqlardan chiqqan bitimlar",
    },
  ],
  defaults: { source: "Instagram", calls: "", answered: "", deals: "" },
  toEntry: (values) => ({
    date: values.date,
    source: normalizeToKnown(SALES_SOURCES, values.source) || "Boshqa",
    calls: toNumber(values.calls),
    answered: toNumber(values.answered),
    deals: toNumber(values.deals),
  }),
  toValues: (row) => ({
    date: row.date,
    source: labelFor(SALES_SOURCES, row.source),
    calls: String(row.calls),
    answered: String(row.answered),
    deals: String(row.deals),
  }),
  isSame: (row, values) =>
    row.date === values.date &&
    row.source === normalizeToKnown(SALES_SOURCES, values.source),
  columns: [
    { key: "date", label: "Sana", render: (row) => shortDate(row.date) },
    {
      key: "source",
      label: "Kanal",
      render: (row) => labelFor(SALES_SOURCES, row.source),
    },
    {
      key: "calls",
      label: "Qo'ng'iroq",
      align: "right",
      render: (row) => num(row.calls),
    },
    {
      key: "answered",
      label: "Javob",
      align: "right",
      render: (row) => num(row.answered),
    },
    {
      key: "rate",
      label: "Javob %",
      align: "right",
      render: (row) => pct(safeDiv(row.answered, row.calls)),
    },
    {
      key: "deals",
      label: "Sotuv",
      align: "right",
      render: (row) => num(row.deals),
    },
  ],
};

const OUTBOUND_CONFIG: DatasetConfig<"outbound"> = {
  dataset: "outbound",
  title: "Chiquvchi qo'ng'iroqlar",
  hint: "Operatorlar qilgan qo'ng'iroqlar natijasi, kunlik jami.",
  fields: [
    { name: "date", label: "Sana", type: "date" },
    {
      name: "leads",
      label: "Lidlar",
      type: "number",
      hint: "Qiziqish bildirganlar",
    },
    {
      name: "deals",
      label: "Bitimlar",
      type: "number",
      hint: "Yopilgan sotuvlar",
    },
  ],
  defaults: { leads: "", deals: "" },
  toEntry: (values) => ({
    date: values.date,
    leads: toNumber(values.leads),
    deals: toNumber(values.deals),
  }),
  toValues: (row) => ({
    date: row.date,
    leads: String(row.leads),
    deals: String(row.deals),
  }),
  isSame: (row, values) => row.date === values.date,
  columns: [
    { key: "date", label: "Sana", render: (row) => shortDate(row.date) },
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
      render: (row) => pct(safeDiv(row.deals, row.leads)),
    },
  ],
};

const CATALOG_CONFIG: DatasetConfig<"catalogs"> = {
  dataset: "catalogs",
  title: "Klinikalar katalogi",
  hint: "Clinics.uz va Med24'dan kelgan lidlar, kunlik.",
  fields: [
    { name: "date", label: "Sana", type: "date" },
    {
      name: "catalog",
      label: "Katalog",
      type: "select",
      options: CATALOG_SOURCES,
    },
    {
      name: "leads",
      label: "Lidlar",
      type: "number",
      hint: "Shu katalogdan kelgan murojaatlar",
    },
    {
      name: "deals",
      label: "Bitimlar",
      type: "number",
      hint: "Yopilgan sotuvlar",
    },
    { name: "revenue", label: "Daromad (USD)", type: "number", step: "0.01" },
    {
      name: "spend",
      label: "Xarajat (USD)",
      type: "number",
      step: "0.01",
      hint: `Clinics.uz uchun oylik to'lovni kiriting. Med24 uchun bo'sh qoldiring — $${MED24_COST_PER_LEAD}/lid avtomatik hisoblanadi`,
    },
  ],
  defaults: {
    catalog: "clinics_uz",
    leads: "",
    deals: "",
    revenue: "",
    spend: "",
  },
  toEntry: (values) => {
    const catalog = values.catalog as CatalogSource;
    const leads = toNumber(values.leads);
    const spend =
      catalog === "med24" && values.spend.trim() === ""
        ? Number((leads * MED24_COST_PER_LEAD).toFixed(2))
        : toNumber(values.spend);
    return {
      date: values.date,
      catalog,
      leads,
      deals: toNumber(values.deals),
      revenue: toNumber(values.revenue),
      spend,
    };
  },
  toValues: (row) => ({
    date: row.date,
    catalog: row.catalog,
    leads: String(row.leads),
    deals: String(row.deals),
    revenue: String(row.revenue),
    spend: String(row.spend),
  }),
  isSame: (row, values) =>
    row.date === values.date && row.catalog === values.catalog,
  columns: [
    { key: "date", label: "Sana", render: (row) => shortDate(row.date) },
    {
      key: "catalog",
      label: "Katalog",
      render: (row) => labelFor(CATALOG_SOURCES, row.catalog),
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
      key: "revenue",
      label: "Daromad",
      align: "right",
      render: (row) => usd(row.revenue, 2),
    },
    {
      key: "spend",
      label: "Xarajat",
      align: "right",
      render: (row) => usd(row.spend, 2),
    },
  ],
};

const TABS = [
  { id: "social", label: "Ijtimoiy tarmoq" },
  { id: "ads", label: "Reklama" },
  { id: "video", label: "Video" },
  { id: "sales", label: "Sotuv" },
  { id: "inbound", label: "Kiruvchi operator" },
  { id: "outbound", label: "Chiquvchi operator" },
  { id: "catalogs", label: "Klinikalar katalogi" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function EntryPage() {
  const [tab, setTab] = useState<TabId>("social");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ma'lumot kiritish"
        description="Kunlik ko'rsatkichlarni qo'lda kiriting. Bir sana va bir kanal uchun ikkinchi marta kiritsangiz, eski yozuv yangilanadi."
      />

      <Card className="!p-2">
        <div
          role="tablist"
          aria-label="Ma'lumot turi"
          className="flex flex-wrap gap-1"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cx(
                "min-h-9 rounded-lg px-3 text-sm font-medium transition",
                tab === item.id
                  ? "bg-accent-soft text-ink"
                  : "text-ink-2 hover:bg-surface-2",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === "social" ? <EntryPanel config={SOCIAL_CONFIG} /> : null}
      {tab === "ads" ? <EntryPanel config={ADS_CONFIG} /> : null}
      {tab === "video" ? <EntryPanel config={VIDEO_CONFIG} /> : null}
      {tab === "sales" ? <EntryPanel config={SALES_CONFIG} /> : null}
      {tab === "inbound" ? <EntryPanel config={INBOUND_CONFIG} /> : null}
      {tab === "outbound" ? <EntryPanel config={OUTBOUND_CONFIG} /> : null}
      {tab === "catalogs" ? <EntryPanel config={CATALOG_CONFIG} /> : null}
    </div>
  );
}
