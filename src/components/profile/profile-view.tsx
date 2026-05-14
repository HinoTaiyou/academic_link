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
  const initial = displayName.slice(0, 1);

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-xl font-bold text-white shadow-sm"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-slate-900">
            {displayName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            {profile.department ? <span>{profile.department}</span> : null}
            {profile.grade ? <span>{profile.grade}</span> : null}
            {showId ? (
              <span className="font-mono text-[10px] text-slate-400">
                ID: {profile.id.slice(0, 8)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <TagBlock label="💛 興味のある分野" tags={profile.interestTags} accent />
      <TagBlock
        label="🔬 研究した分野"
        tags={profile.researchFields}
        className="mt-4"
      />
    </section>
  );
}

function TagBlock({
  label,
  tags,
  accent = false,
  className,
}: {
  label: string;
  tags: string[];
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mt-6", className)}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      {tags.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">未設定</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                accent
                  ? "bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white"
                  : "bg-slate-100 text-slate-700",
              )}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
