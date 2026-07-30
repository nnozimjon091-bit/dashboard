"use client";

import Link from "next/link";
import { Button, Card, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";

/** Umuman yozuv bo'lmaganda. */
export function NoData() {
  const { loadDemo } = useStore();
  return (
    <Card>
      <EmptyState
        title="Hali ma'lumot kiritilmagan"
        description="Kunlik ko'rsatkichlaringizni kiriting — grafiklar va KPI'lar shu zahoti hisoblanadi."
        action={
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link
              href="/kiritish"
              className="inline-flex min-h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white hover:opacity-90"
            >
              Ma'lumot kiritish
            </Link>
            <Button onClick={loadDemo}>Demo bilan ko'rish</Button>
          </div>
        }
      />
    </Card>
  );
}

/** Yozuvlar bor, lekin tanlangan davrga tushmagan. */
export function NoDataInRange() {
  return (
    <Card>
      <EmptyState
        title="Bu davrda ma'lumot yo'q"
        description="Yuqoridagi filtrdan boshqa davrni tanlang yoki shu kunlar uchun ko'rsatkich kiriting."
      />
    </Card>
  );
}
