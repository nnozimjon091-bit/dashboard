"use client";

import { useState } from "react";
import { IconTrash } from "@/components/icons";
import {
  Button,
  Card,
  cx,
  DataTable,
  Field,
  Input,
  SectionTitle,
  Select,
  type Column,
} from "@/components/ui";
import { longDate } from "@/lib/format";
import { todayISO } from "@/lib/metrics";
import { useStore } from "@/lib/store";
import type { DashboardData, DatasetKey } from "@/lib/types";

export type FieldSpec =
  | { name: string; label: string; type: "date" }
  | {
      name: string;
      label: string;
      type: "text";
      placeholder?: string;
      /** Berilsa, input yoniga taklif ro'yxati (datalist) qo'shiladi — tanlash ham, qo'lda yozish ham mumkin. */
      suggestions?: { value: string; label: string }[];
    }
  | { name: string; label: string; type: "number"; step?: string; hint?: string }
  | {
      name: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
    };

export type Values = Record<string, string>;

export interface DatasetConfig<K extends DatasetKey> {
  dataset: K;
  title: string;
  hint: string;
  fields: FieldSpec[];
  defaults: Values;
  /** Formadagi matnlarni saqlanadigan yozuvga aylantiradi */
  toEntry: (values: Values) => Omit<DashboardData[K][number], "id">;
  /** Yozuvni qayta tahrirlash uchun formaga qaytaradi */
  toValues: (row: DashboardData[K][number]) => Values;
  /** Bir kun + bir kanal uchun ikkinchi yozuv paydo bo'lmasligi uchun */
  isSame: (row: DashboardData[K][number], values: Values) => boolean;
  columns: Column<DashboardData[K][number]>[];
}

export function toNumber(value: string): number {
  const parsed = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function EntryPanel<K extends DatasetKey>({
  config,
}: {
  config: DatasetConfig<K>;
}) {
  // Bu ro'yxatda faqat siz kiritgan yozuvlar bo'ladi — demo hech qachon
  // bu yerga tushmaydi, aks holda uni tahrirlashga urinib bo'lardi.
  const { ownData, addEntry, updateEntry, removeEntry } = useStore();
  const [values, setValues] = useState<Values>({
    date: todayISO(),
    ...config.defaults,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = [...ownData[config.dataset]].sort((a, b) =>
    b.date.localeCompare(a.date),
  ) as DashboardData[K][number][];

  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const reset = () => {
    setValues({ date: todayISO(), ...config.defaults });
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.date) {
      setNotice("Sanani tanlang.");
      return;
    }
    const entry = config.toEntry(values);

    if (editingId) {
      updateEntry(config.dataset, editingId, entry as never);
      setNotice("Yozuv yangilandi.");
    } else {
      // Shu sana va kanal uchun yozuv bo'lsa — yangisini qo'shmay, ustiga yozamiz.
      const existing = rows.find((row) => config.isSame(row, values));
      if (existing) {
        updateEntry(config.dataset, existing.id, entry as never);
        setNotice(`${longDate(values.date)} uchun yozuv yangilandi.`);
      } else {
        addEntry(config.dataset, entry as never);
        setNotice("Yozuv qo'shildi.");
      }
    }
    reset();
  };

  const startEdit = (row: DashboardData[K][number]) => {
    setValues(config.toValues(row));
    setEditingId(row.id);
    setNotice(null);
  };

  const columnsWithActions: Column<DashboardData[K][number]>[] = [
    ...config.columns,
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" onClick={() => startEdit(row)}>
            Tahrirlash
          </Button>
          <Button
            variant="danger"
            size="iconSm"
            aria-label="O'chirish"
            title="O'chirish"
            onClick={() => {
              removeEntry(config.dataset, row.id);
              if (editingId === row.id) reset();
            }}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          title={editingId ? "Yozuvni tahrirlash" : config.title}
          hint={config.hint}
        />
        <form onSubmit={handleSubmit} className="space-y-3">
          {config.fields.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              hint={field.type === "number" ? field.hint : undefined}
            >
              {field.type === "select" ? (
                <Select
                  value={values[field.name] ?? ""}
                  onChange={(event) => set(field.name, event.target.value)}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <>
                  <Input
                    type={field.type === "text" ? "text" : field.type}
                    list={
                      field.type === "text" && field.suggestions
                        ? `${field.name}-suggestions`
                        : undefined
                    }
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    step={field.type === "number" ? (field.step ?? "1") : undefined}
                    min={field.type === "number" ? 0 : undefined}
                    placeholder={
                      field.type === "text" ? field.placeholder : undefined
                    }
                    value={values[field.name] ?? ""}
                    onChange={(event) => set(field.name, event.target.value)}
                    required={field.type === "date"}
                  />
                  {field.type === "text" && field.suggestions ? (
                    <datalist id={`${field.name}-suggestions`}>
                      {field.suggestions.map((option) => (
                        <option key={option.value} value={option.label} />
                      ))}
                    </datalist>
                  ) : null}
                </>
              )}
            </Field>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" variant="primary">
              {editingId ? "Saqlash" : "Qo'shish"}
            </Button>
            {editingId ? (
              <Button onClick={reset}>Bekor qilish</Button>
            ) : null}
          </div>

          {notice ? (
            <p
              role="status"
              className={cx("text-xs", "text-ink-2")}
            >
              {notice}
            </p>
          ) : null}
        </form>
      </Card>

      <Card>
        <SectionTitle
          title="Kiritilgan yozuvlar"
          hint={`${rows.length} ta yozuv, eng yangisi yuqorida`}
        />
        <DataTable
          rows={rows.slice(0, 60)}
          rowKey={(row) => row.id}
          columns={columnsWithActions}
          emptyText="Hozircha yozuv yo'q"
          maxHeight="520px"
        />
      </Card>
    </div>
  );
}
