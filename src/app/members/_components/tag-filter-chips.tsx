import Link from "next/link";
import { cn } from "@/lib/utils";

export type FilterType = "interest" | "research";

type Props = {
  interestTags: readonly string[];
  researchTags: readonly string[];
  selectedTag: string | null;
  filterType: FilterType;
};

export function TagFilterChips({
  interestTags,
  researchTags,
  selectedTag,
  filterType,
}: Props) {
  const tags = filterType === "interest" ? interestTags : researchTags;

  return (
    <div className="space-y-3">
      {/* Type toggle */}
      <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-xs font-medium">
        <TypeTab
          label="💛 興味タグ"
          type="interest"
          current={filterType}
          selectedTag={selectedTag}
        />
        <TypeTab
          label="🔬 研究タグ"
          type="research"
          current={filterType}
          selectedTag={selectedTag}
        />
      </div>

      {/* Tag chips */}
      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">絞り込み:</span>
          <Link
            href={`/members?type=${filterType}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              selectedTag == null
                ? "border-[#667eea] bg-violet-50 text-[#667eea]"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#667eea]/40",
            )}
          >
            すべて
          </Link>
          {tags.map((t) => {
            const active = selectedTag === t;
            return (
              <Link
                key={t}
                href={`/members?type=${filterType}&tag=${encodeURIComponent(t)}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-[#667eea] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#667eea]/40",
                )}
              >
                {t}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          {filterType === "interest"
            ? "興味タグが未設定です。プロフィールで設定してください。"
            : "研究タグが未設定です。プロフィールで設定してください。"}
        </p>
      )}
    </div>
  );
}

function TypeTab({
  label,
  type,
  current,
  selectedTag,
}: {
  label: string;
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
        "flex-1 rounded-full px-3 py-1.5 text-center transition",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {label}
    </Link>
  );
}
