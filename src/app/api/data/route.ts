import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { EMPTY_DATA, type DashboardData } from "@/lib/types";

// Barcha brauzer/qurilmalar shu bitta umumiy yozuvga o'qish/yozish qiladi —
// login yo'q, kim link orqali kirsa ham xuddi shu ma'lumotni ko'radi.
const DATA_KEY = "marketing-dashboard:data:v1";

function redis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN sozlanmagan.",
    );
  }
  return new Redis({ url, token });
}

function sanitize(value: unknown): DashboardData {
  const parsed = (value ?? {}) as Partial<DashboardData>;
  return {
    social: Array.isArray(parsed.social) ? parsed.social : [],
    ads: Array.isArray(parsed.ads) ? parsed.ads : [],
    video: Array.isArray(parsed.video) ? parsed.video : [],
    sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    outbound: Array.isArray(parsed.outbound) ? parsed.outbound : [],
    catalogs: Array.isArray(parsed.catalogs) ? parsed.catalogs : [],
  };
}

export async function GET() {
  try {
    const stored = await redis().get<Partial<DashboardData>>(DATA_KEY);
    return NextResponse.json(stored ? sanitize(stored) : EMPTY_DATA);
  } catch {
    return NextResponse.json(
      { error: "Ma'lumotni yuklab bo'lmadi." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = sanitize(body);
    await redis().set(DATA_KEY, data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Ma'lumotni saqlab bo'lmadi." },
      { status: 500 },
    );
  }
}
