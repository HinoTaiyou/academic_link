import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, FlaskConical, MessageSquare, Sparkles } from "lucide-react";
import { DefaultAvatar } from "@/components/profile/default-avatar";
import { isSharedTag, normTag, type ScoredMember } from "../_lib/match";
import { cn } from "@/lib/utils";

type Props = {
  member: ScoredMember;
  myInterestTags: readonly string[];
  myResearchTags: readonly string[];
};

const MAX_TAGS_PER_SECTION = 5;

export function MemberCard({
  member,
  myInterestTags = [],
  myResearchTags = [],
}: Props) {
  const name = member.real_name?.trim() || "（名前未設定）";
  const sub = [member.department, member.grade].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-[var(--al-border)] bg-white transition-all",
        "hover:border-[color-mix(in_srgb,var(--al-accent)_35%,var(--al-border))] hover:shadow-[0_8px_28px_-8px_rgba(201,107,74,0.12)]",
      )}
    >
      <Link href={`/u/${member.id}`} className="group block flex-1 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <DefaultAvatar className="h-12 w-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--al-ink)] group-hover:text-[var(--al-accent)]">
              {name}
            </p>
            {sub ? (
              <p className="mt-0.5 truncate text-xs text-[var(--al-muted)]">
                {sub}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <OverlapBadge
              icon={Sparkles}
              label="興味"
              count={member.interestOverlap}
            />
            <OverlapBadge
              icon={FlaskConical}
              label="研究"
              count={member.researchOverlap}
              variant="research"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3 divide-y divide-[var(--al-border)]/80">
          <TagSection
            title="興味タグ"
            icon={Sparkles}
            tags={member.interest_tags ?? []}
            myTags={myInterestTags}
            emptyLabel="興味タグ未設定"
            accentHeader
          />
          <TagSection
            title="研究タグ"
            icon={FlaskConical}
            tags={member.research_fields ?? []}
            myTags={myResearchTags}
            emptyLabel="研究タグ未設定"
          />
        </div>
      </Link>

      <div className="mt-auto border-t border-[var(--al-border)] bg-[var(--al-surface)]/60 px-4 py-3 sm:px-5">
        <Link
          href={`/chat/${member.id}`}
          className="al-btn-gradient inline-flex w-full items-center justify-center gap-1.5 text-xs sm:text-sm"
        >
          <MessageSquare className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          メッセージを送る
        </Link>
      </div>
    </article>
  );
}

function OverlapBadge({
  icon: Icon,
  label,
  count,
  variant = "interest",
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  variant?: "interest" | "research";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
        variant === "interest"
          ? "bg-[var(--al-accent-soft)] text-[var(--al-accent)] ring-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))]"
          : "bg-[var(--al-surface)] text-[var(--al-muted)] ring-[var(--al-border)]",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden />
      {label} {count}
    </span>
  );
}

function TagSection({
  title,
  icon: Icon,
  tags,
  myTags,
  emptyLabel,
  accentHeader = false,
}: {
  title: string;
  icon: LucideIcon;
  tags: readonly string[];
  myTags?: readonly string[];
  emptyLabel: string;
  accentHeader?: boolean;
}) {
  const safeTags = tags ?? [];
  const safeMyTags = myTags ?? [];
  const sorted = [...safeTags].sort((a, b) => {
    const sa = isSharedTag(a, safeMyTags);
    const sb = isSharedTag(b, safeMyTags);
    if (sa !== sb) return sa ? -1 : 1;
    return normTag(a).localeCompare(normTag(b), "ja");
  });

  const visible = sorted.slice(0, MAX_TAGS_PER_SECTION);
  const hidden = sorted.length - visible.length;
  const sharedCount = safeTags.filter((t) => isSharedTag(t, safeMyTags)).length;

  return (
    <div className="pt-3 first:pt-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p
          className={cn(
            "flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide",
            accentHeader ? "text-[var(--al-accent)]" : "text-[var(--al-muted)]",
          )}
        >
          <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden />
          {title}
        </p>
        {safeTags.length > 0 ? (
          <span className="text-[10px] text-[var(--al-muted)]">
            共通 {sharedCount}
          </span>
        ) : null}
      </div>

      {safeTags.length === 0 ? (
        <p className="text-xs text-[var(--al-muted)]">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((t) => (
            <MemberTagPill
              key={t}
              tag={t}
              shared={isSharedTag(t, safeMyTags)}
            />
          ))}
          {hidden > 0 ? (
            <span className="self-center text-[10px] text-[var(--al-muted)]">
              +{hidden}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MemberTagPill({ tag, shared }: { tag: string; shared: boolean }) {
  const label = normTag(tag);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-snug ring-1",
        shared
          ? "bg-[var(--al-accent-soft)] text-[var(--al-accent)] ring-[color-mix(in_srgb,var(--al-accent)_35%,var(--al-border))]"
          : "bg-[var(--al-surface)] text-[var(--al-muted)] ring-[var(--al-border)]",
      )}
      title={shared ? `共通: ${label}` : label}
    >
      {shared ? (
        <Check
          className="h-2.5 w-2.5 shrink-0 text-[var(--al-accent)]"
          strokeWidth={2.5}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}
