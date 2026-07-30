import {
  fetchInsights,
  ISO_DATE,
  MetaApiError,
  readMetaConfig,
  toAdEntries,
} from "@/lib/meta";

export const dynamic = "force-dynamic";
// Uzoq davr so'ralganda Meta bir necha sahifa qaytaradi.
export const maxDuration = 60;

interface SyncBody {
  since?: unknown;
  until?: unknown;
}

export async function POST(request: Request) {
  const config = readMetaConfig();
  if (!config) {
    return Response.json(
      {
        error:
          "Meta ulanmagan: META_ACCESS_TOKEN va META_AD_ACCOUNT_ID o'rnatilmagan.",
      },
      { status: 400 },
    );
  }

  // Sayt ochiq bo'lsa, bu endpoint reklama raqamlarini ko'rsatib qo'yadi.
  // META_SYNC_PASSWORD o'rnatilgan bo'lsa, faqat parol bilan ishlaydi.
  const password = process.env.META_SYNC_PASSWORD;
  if (password && request.headers.get("x-dashboard-password") !== password) {
    return Response.json({ error: "Parol noto'g'ri." }, { status: 401 });
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return Response.json({ error: "So'rov JSON emas." }, { status: 400 });
  }

  const { since, until } = body;
  // Sanalar to'g'ridan-to'g'ri Meta so'roviga tushadi — qat'iy tekshiramiz.
  if (
    typeof since !== "string" ||
    typeof until !== "string" ||
    !ISO_DATE.test(since) ||
    !ISO_DATE.test(until)
  ) {
    return Response.json(
      { error: "Sanalar YYYY-MM-DD ko'rinishida bo'lishi kerak." },
      { status: 400 },
    );
  }
  if (since > until) {
    return Response.json(
      { error: "Boshlanish sanasi tugash sanasidan keyin turibdi." },
      { status: 400 },
    );
  }

  try {
    const rows = await fetchInsights(config, since, until);
    const { entries, availableActions } = toAdEntries(rows, config.leadActions);
    return Response.json({
      entries,
      availableActions,
      leadActions: config.leadActions,
      range: { since, until },
    });
  } catch (error) {
    if (error instanceof MetaApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "Kutilmagan xato yuz berdi." },
      { status: 500 },
    );
  }
}
