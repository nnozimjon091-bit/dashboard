import { maskAccount, readMetaConfig } from "@/lib/meta";

// Sozlamalar server muhitidan o'qiladi — javob keshlanmasligi kerak.
export const dynamic = "force-dynamic";

export async function GET() {
  const config = readMetaConfig();
  return Response.json({
    configured: Boolean(config),
    // Token hech qachon qaytarilmaydi; hisob raqami ham yashirilgan holda.
    account: config ? maskAccount(config.accountId) : null,
    apiVersion: config?.version ?? null,
    leadActions: config?.leadActions ?? [],
    passwordRequired: Boolean(process.env.META_SYNC_PASSWORD),
  });
}
