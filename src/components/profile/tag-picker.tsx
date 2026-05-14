"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
};

export function TagPicker({
  label,
  options,
  value,
  onChange,
  hint,
}: Props) {
  const selectedSet = useMemo(() => new Set(value), [value]);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
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
                  ? "border-transparent bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#667eea]/40 hover:bg-slate-50",
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
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div className="mb-2 text-xs font-medium text-slate-600">選択中</div>
          <div className="flex flex-wrap gap-1.5">
            {value.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
              >
                {t}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-[#667eea] underline-offset-2 hover:underline"
            onClick={() => onChange([])}
          >
            選択をクリア
          </button>
        </div>
      ) : null}
    </div>
  );
}
