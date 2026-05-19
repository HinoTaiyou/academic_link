import { FlaskConical, Sparkles } from "lucide-react";
import { DefaultAvatar } from "@/components/profile/default-avatar";
import { cn } from "@/lib/utils";

export type ProfileViewModel = {
  id: string;
  realName: string | null;
  department: string | null;
  grade: string | null;
  interestTags: string[];
  researchFields: string[];
};

type Props = {
  profile: ProfileViewModel;
  className?: string;
  showId?: boolean;
};

export function ProfileView({ profile, className, showId = false }: Props) {
  const displayName = profile.realName?.trim() || "（名前未設定）";
  const sub = [profile.department, profile.grade].filter(Boolean).join(" · ");

  return (
    <section className={cn("al-glass-card overflow-hidden", className)}>
      <div className="border-b border-[var(--al-border)] bg-[linear-gradient(135deg,var(--al-accent-soft)_0%,#fff_55%)] px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-4">
          <DefaultAvatar className="h-14 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="al-section-eyebrow">Profile</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--al-ink)]">
              {displayName}
            </h2>
            {sub ? (
              <p className="mt-1 text-sm text-[var(--al-muted)]">{sub}</p>
            ) : null}
            {showId ? (
              <p className="mt-1 font-mono text-[10px] text-[var(--al-muted)]">
                ID: {profile.id.slice(0, 8)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--al-border)]/80 p-5 sm:p-6">
        <TagBlock
          label="興味のある分野"
          icon={Sparkles}
          tags={profile.interestTags}
          accent
          className="pb-5"
        />
        <TagBlock
          label="研究した分野"
          icon={FlaskConical}
          tags={profile.researchFields}
          labelAccent
          className="pt-5"
        />
      </div>
    </section>
  );
}

function TagBlock({
  label,
  icon: Icon,
  tags,
  accent = false,
  labelAccent = false,
  className,
}: {
  label: string;
  icon: typeof Sparkles;
  tags: string[];
  accent?: boolean;
  labelAccent?: boolean;
  className?: string;
}) {
  const labelOrange = accent || labelAccent;

  return (
    <div className={className}>
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide",
          labelOrange ? "text-[var(--al-accent)]" : "text-[var(--al-muted)]",
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        {label}
      </p>
      {tags.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--al-muted)]">未設定</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className={cn(
                accent
                  ? "al-tag-pill"
                  : "rounded-full bg-[var(--al-surface)] px-2.5 py-1 text-xs font-medium text-[var(--al-muted)] ring-1 ring-[var(--al-border)]",
              )}
            >
              {t.replace(/^#/, "")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
