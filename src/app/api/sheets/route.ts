import { parseAdsSheet } from "@/lib/sheet";

export const dynamic = "force-dynamic";
// Katta jadval sekin yuklanishi mumkin.
export const maxDuration = 60;

/** Havola sozlanganmi — interfeys shunga qarab tugmani ko'rsatadi. */
export async function GET() {
  const url = process.env.SHEETS_CSV_URL?.trim();
  return Response.json({
    configured: Boolean(url),
    passwordRequired: Boolean(process.env.SHEETS_SYNC_PASSWORD),
  });
}

export async function POST(request: Request) {
  const url = process.env.SHEETS_CSV_URL?.trim();
  if (!url) {
    return Response.json(
      { error: "SHEETS_CSV_URL o'rnatilmagan." },
      { status: 400 },
    );
  }

  const password = process.env.SHEETS_SYNC_PASSWORD;
  if (password && request.headers.get("x-dashboard-password") !== password) {
    return Response.json({ error: "Parol noto'g'ri." }, { status: 401 });
  }

  let response: Response;
  try {
    // Google publish qilingan havolani boshqa manzilga yo'naltiradi.
    response = await fetch(url, { redirect: "follow", cache: "no-store" });
  } catch {
    return Response.json(
      { error: "Jadvalga ulanib bo'lmadi. Havolani tekshiring." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return Response.json(
      {
        error: `Jadval o'qilmadi (HTTP ${response.status}). Jadval "Anyone with the link" yoki "Publish to web" qilinganini tekshiring.`,
      },
      { status: 502 },
    );
  }

  const text = await response.text();
  // Ochiq bo'lmagan jadval CSV o'rniga kirish sahifasini qaytaradi.
  if (/^\s*<(!doctype|html)/i.test(text)) {
    return Response.json(
      {
        error:
          "Havola CSV emas, HTML sahifa qaytardi. Jadvalni File → Share → Publish to web orqali CSV qilib chiqaring.",
      },
      { status: 502 },
    );
  }

  const result = parseAdsSheet(text);
  return Response.json(result);
}
