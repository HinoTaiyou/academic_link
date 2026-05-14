import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  tags: readonly string[];
  selectedTag: string | null;
};

/** あなたの興味タグから、メンバー一覧の絞り込みリンクを並べる */
export function TagFilterChips({ tags, selectedTag }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">絞り込み:</span>
      <Link
        href="/members"
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
            href={`/members?tag=${encodeURIComponent(t)}`}
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
  );
}
