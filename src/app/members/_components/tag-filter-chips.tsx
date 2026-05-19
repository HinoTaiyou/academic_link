import Link from "next/link";
import { FlaskConical, Sparkles } from "lucide-react";
import type { FilterTagOption } from "../_lib/filter-tags";
import { cn } from "@/lib/utils";

export type FilterType = "interest" | "research";

type Props = {
  interestOptions: FilterTagOption[];
  researchOptions: FilterTagOption[];
  selectedTag: string | null;
  filterType: FilterType;
};

export function TagFilterChips({
  interestOptions,
  researchOptions,
  selectedTag,
  filterType,
}: Props) {
  const options =
    filterType === "interest" ? interestOptions : researchOptions;
  const mine = options.filter((o) => o.isMine);
  const others = options.filter((o) => !o.isMine);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl border border-[var(--al-border)] bg-white p-1 text-xs font-medium">
        <TypeTab
          label="興味タグ"
          icon={Sparkles}
          type="interest"
          current={filterType}
          selectedTag={selectedTag}
        />
        <TypeTab
          label="研究タグ"
          icon={FlaskConical}
          type="research"
          current={filterType}
          selectedTag={selectedTag}
        />
      </div>

      {options.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--al-muted)]">
              絞り込み
            </span>
            <AllChip selectedTag={selectedTag} filterType={filterType} />
          </div>

          {mine.length > 0 ? (
            <FilterChipRow
              label="あなたのタグ"
              options={mine}
              selectedTag={selectedTag}
              filterType={filterType}
            />
          ) : null}

          {others.length > 0 ? (
            <FilterChipRow
              label={mine.length > 0 ? "その他のタグ" : "タグ一覧"}
              options={others}
              selectedTag={selectedTag}
              filterType={filterType}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-[var(--al-muted)]">
          {filterType === "interest"
            ? "興味タグがまだありません。プロフィールで設定するか、他のメンバーが登録するのをお待ちください。"
            : "研究タグがまだありません。プロフィールで設定するか、他のメンバーが登録するのをお待ちください。"}
        </p>
      )}
    </div>
  );
}

function AllChip({
  selectedTag,
  filterType,
}: {
  selectedTag: string | null;
  filterType: FilterType;
}) {
  return (
    <Link
      href={`/members?type=${filterType}`}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
        selectedTag == null
          ? "border-[var(--al-accent)] bg-[var(--al-accent)] text-white shadow-sm"
          : "border-[var(--al-border)] bg-white text-[var(--al-muted)] hover:border-[color-mix(in_srgb,var(--al-accent)_30%,var(--al-border))]",
      )}
    >
      すべて
    </Link>
  );
}

function FilterChipRow({
  label,
  options,
  selectedTag,
  filterType,
}: {
  label: string;
  options: FilterTagOption[];
  selectedTag: string | null;
  filterType: FilterType;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--al-muted)] sm:w-auto sm:normal-case sm:tracking-normal">
        {label}
      </span>
      {options.map((o) => {
        const active = selectedTag === o.tag;
        return (
          <Link
            key={o.tag}
            href={`/members?type=${filterType}&tag=${encodeURIComponent(o.tag)}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
              active
                ? "border-[var(--al-accent)] bg-[var(--al-accent)] text-white shadow-sm"
                : o.isMine
                  ? "border-[color-mix(in_srgb,var(--al-accent)_35%,var(--al-border))] bg-[var(--al-accent-soft)] text-[var(--al-accent)] hover:border-[var(--al-accent)]"
                  : "border-[var(--al-border)] bg-white text-[var(--al-ink)] hover:border-[color-mix(in_srgb,var(--al-accent)_30%,var(--al-border))]",
            )}
            title={
              o.memberCount > 0
                ? `${o.memberCount} 人がこのタグを持っています`
                : undefined
            }
          >
            {o.tag}
            {o.memberCount > 0 && !active ? (
              <span className="tabular-nums text-[9px] font-normal text-[var(--al-muted)]">
                {o.memberCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function TypeTab({
  label,
  icon: Icon,
  type,
  current,
  selectedTag,
}: {
  label: string;
  icon: typeof Sparkles;
  type: FilterType;
  current: FilterType;
  selectedTag: string | null;
}) {
  const active = current === type;
  const href =
    type === current && selectedTag
      ? `/members?type=${type}&tag=${encodeURIComponent(selectedTag)}`
      : `/members?type=${type}`;

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition",
        active
          ? "bg-[var(--al-accent-soft)] text-[var(--al-accent)] shadow-sm"
          : "text-[var(--al-muted)] hover:bg-[var(--al-surface)] hover:text-[var(--al-ink)]",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      {label}
    </Link>
  );
}
