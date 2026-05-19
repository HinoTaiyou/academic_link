"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  icon?: LucideIcon;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
};

export function TagPicker({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  hint,
}: Props) {
  const selectedSet = useMemo(() => new Set(value), [value]);

  return (
    <div className="space-y-3">
      <div>
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-semibold",
            Icon ? "text-[var(--al-accent)]" : "text-[var(--al-ink)]",
          )}
        >
          {Icon ? (
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          ) : null}
          {label}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-[var(--al-muted)]">{hint}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2" role="list">
        {options.map((t) => {
          const selected = selectedSet.has(t);
          return (
            <button
              key={t}
              type="button"
              role="listitem"
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                selected
                  ? "border-transparent bg-[var(--al-accent)] text-white shadow-sm"
                  : "border-[var(--al-border)] bg-white text-[var(--al-ink)] hover:border-[color-mix(in_srgb,var(--al-accent)_40%,var(--al-border))] hover:bg-[var(--al-accent-soft)]",
              )}
              onClick={() => {
                if (selected) {
                  onChange(value.filter((x) => x !== t));
                } else {
                  onChange([...value, t]);
                }
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {value.length > 0 ? (
        <div className="rounded-xl border border-[var(--al-border)] bg-[var(--al-surface)] p-3">
          <div className="mb-2 text-xs font-medium text-[var(--al-muted)]">
            選択中
          </div>
          <div className="flex flex-wrap gap-1.5">
            {value.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--al-ink)] ring-1 ring-[var(--al-border)]"
              >
                {t}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-[var(--al-accent)] underline-offset-2 hover:underline"
            onClick={() => onChange([])}
          >
            選択をクリア
          </button>
        </div>
      ) : null}
    </div>
  );
}
